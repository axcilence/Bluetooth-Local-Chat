import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PeerClient {
  id: string;
  name: string;
  deviceType: string;
  ws: WebSocket;
  rssi: number;
  battery: number;
  mode: string;
  connectedAt: number;
}

const peers = new Map<string, PeerClient>();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), peersCount: peers.size });
  });

  app.get('/api/bluetooth/info', (req, res) => {
    res.json({
      serviceUuid: '0000cafe-0000-1000-8000-00805f9b34fb',
      rxCharUuid: '0000c001-0000-1000-8000-00805f9b34fb',
      txCharUuid: '0000c002-0000-1000-8000-00805f9b34fb',
      requiresHttps: true,
      supportedBrowsers: ['Google Chrome 56+', 'Microsoft Edge 79+', 'Chrome for Android'],
      notes: 'Web Bluetooth requires user gesture and HTTPS/localhost context.',
    });
  });

  app.get('/api/peers', (req, res) => {
    const peerList = Array.from(peers.values()).map(p => ({
      id: p.id,
      name: p.name,
      deviceType: p.deviceType,
      rssi: p.rssi,
      battery: p.battery,
      mode: p.mode,
      connectedAt: p.connectedAt,
    }));
    res.json({ peers: peerList });
  });

  // WebSocket logic for Local Server Mesh & Bluetooth Bridge
  wss.on('connection', (ws: WebSocket) => {
    let clientId = '';

    ws.on('message', (messageRaw: string | Buffer) => {
      try {
        const data = JSON.parse(messageRaw.toString());

        switch (data.type) {
          case 'register': {
            clientId = data.id || `Peer-${Math.floor(1000 + Math.random() * 9000)}`;
            const name = data.name || 'Anonymous Guest';
            const deviceType = data.deviceType || 'Web Client';
            const rssi = Math.floor(-45 - Math.random() * 30);
            const battery = Math.floor(60 + Math.random() * 40);
            const mode = data.mode || 'Server Relay';

            peers.set(clientId, {
              id: clientId,
              name,
              deviceType,
              ws,
              rssi,
              battery,
              mode,
              connectedAt: Date.now(),
            });

            // Ack registration
            ws.send(JSON.stringify({ type: 'registered', id: clientId }));

            // Broadcast peer update to all connected clients
            broadcastPeersList();
            break;
          }

          case 'chat_message': {
            // Forward chat message to target peer or broadcast to all
            const payload = {
              type: 'chat_message',
              id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fromId: data.fromId || clientId,
              fromName: data.fromName || 'Guest',
              toId: data.toId,
              text: data.text,
              timestamp: data.timestamp || Date.now(),
              channel: data.channel || 'direct',
            };

            if (data.toId && data.toId !== 'all') {
              const recipient = peers.get(data.toId);
              if (recipient && recipient.ws.readyState === WebSocket.OPEN) {
                recipient.ws.send(JSON.stringify(payload));
              }
              // Send delivery confirmation back to sender
              ws.send(
                JSON.stringify({
                  type: 'message_delivered',
                  msgId: payload.id,
                  toId: data.toId,
                  timestamp: Date.now(),
                })
              );
            } else {
              // Broadcast to all other peers
              peers.forEach((peer, peerId) => {
                if (peerId !== clientId && peer.ws.readyState === WebSocket.OPEN) {
                  peer.ws.send(JSON.stringify(payload));
                }
              });
            }
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      if (clientId && peers.has(clientId)) {
        peers.delete(clientId);
        broadcastPeersList();
      }
    });

    ws.on('error', err => {
      console.error('WS client error:', err);
    });
  });

  function broadcastPeersList() {
    const peerList = Array.from(peers.values()).map(p => ({
      id: p.id,
      name: p.name,
      deviceType: p.deviceType,
      rssi: p.rssi,
      battery: p.battery,
      mode: p.mode,
      connectedAt: p.connectedAt,
    }));

    const updateMsg = JSON.stringify({
      type: 'peers_update',
      peers: peerList,
    });

    peers.forEach(peer => {
      if (peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(updateMsg);
      }
    });
  }

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Bluetooth Chat Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
