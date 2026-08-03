import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BluetoothConnectionStatus,
  BluetoothConfig,
  ChatMessage,
  PeerDevice,
  UserProfile,
  DiagnosticsStatus,
  GattLogEntry,
} from './types';
import {
  BluetoothChatManager,
  DEFAULT_SERVICE_UUID,
  DEFAULT_RX_UUID,
  DEFAULT_TX_UUID,
} from './lib/bluetooth';
import { localDB } from './lib/db';
import { soundFx } from './lib/sound';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ScanModal } from './components/ScanModal';
import { SettingsModal } from './components/SettingsModal';
import { GattInspectorModal } from './components/GattInspectorModal';
import { BluetoothStatusCard } from './components/BluetoothStatusCard';

export default function App() {
  // State
  const [status, setStatus] = useState<BluetoothConnectionStatus>('off');

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: `guest-${Math.floor(1000 + Math.random() * 9000)}`,
    name: `Device-${Math.floor(1000 + Math.random() * 9000)}`,
    avatarColor: '#3B82F6',
    bleDeviceName: `Bluetooth-Device`,
    createdTimestamp: Date.now(),
  });

  const [config, setConfig] = useState<BluetoothConfig>({
    serviceUuid: DEFAULT_SERVICE_UUID,
    rxUuid: DEFAULT_RX_UUID,
    txUuid: DEFAULT_TX_UUID,
    enableMockFallback: false,
    enableSound: true,
    enableVibration: true,
    autoConnectLast: true,
    connectionMode: 'ble_hardware',
  });

  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [activePeerId, setActivePeerId] = useState<string | null>('all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gattLogs, setGattLogs] = useState<GattLogEntry[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Modals
  const [showScanModal, setShowScanModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showGattInspector, setShowGattInspector] = useState<boolean>(false);

  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<DiagnosticsStatus>({
    hasWebBluetooth: false,
    bluetoothAvailable: false,
    isHttps: false,
    pwaInstalled: false,
    storagePersisted: false,
  });

  const managerRef = useRef<BluetoothChatManager | null>(null);

  // Lock window scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load Saved DB State & Register PWA
  useEffect(() => {
    async function initStorageAndManager() {
      try {
        await localDB.init();

        // Load profile
        const savedProfile = await localDB.getKV<UserProfile | null>('profile', null);
        let currentProfile = userProfile;
        if (savedProfile) {
          currentProfile = savedProfile;
          setUserProfile(savedProfile);
        } else {
          await localDB.setKV('profile', userProfile);
        }

        // Load config
        const savedConfig = await localDB.getKV<BluetoothConfig | null>('config', null);
        let currentConfig = config;
        if (savedConfig) {
          currentConfig = { ...savedConfig, connectionMode: 'ble_hardware' };
          setConfig(currentConfig);
        } else {
          await localDB.setKV('config', config);
        }

        // Load saved peers
        const savedPeers = await localDB.getSavedPeers();
        if (savedPeers.length > 0) {
          setPeers(savedPeers);
        }

        // Load saved messages
        const savedMsgs = await localDB.getAllMessages();
        if (savedMsgs.length > 0) {
          setMessages(savedMsgs);
        }

        // Create Bluetooth Manager instance
        const mgr = new BluetoothChatManager(currentConfig, currentProfile);
        managerRef.current = mgr;

        // Subscriptions
        mgr.onStatusChange((newStatus) => {
          setStatus(newStatus);
        });

        mgr.onPeerFound((newPeer) => {
          setPeers((prev) => {
            const existsIdx = prev.findIndex((p) => p.id === newPeer.id);
            if (existsIdx >= 0) {
              const updated = [...prev];
              updated[existsIdx] = { ...updated[existsIdx], ...newPeer };
              return updated;
            }
            return [...prev, newPeer];
          });
          localDB.savePeer(newPeer);
          if (currentConfig.enableSound) soundFx.playPeerFoundSound();
        });

        mgr.onMessage((newMsg) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          localDB.saveMessage(newMsg);

          if (!newMsg.isMine && currentConfig.enableSound) {
            soundFx.playReceiveSound();
            if (currentConfig.enableVibration) soundFx.vibrate([40, 60, 40]);
          }
        });

        mgr.onGattLog((log) => {
          setGattLogs((prev) => [log, ...prev].slice(0, 150));
        });

        // Run availability check & auto-scan on load
        const diag = await mgr.checkAvailability();
        setDiagnostics({
          hasWebBluetooth: diag.hasWebBluetooth,
          bluetoothAvailable: diag.available,
          isHttps: diag.isHttps,
          pwaInstalled: 'serviceWorker' in navigator,
          storagePersisted: typeof indexedDB !== 'undefined',
        });
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    initStorageAndManager();

    // Browser Online/Offline listener
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    setIsOnline(navigator.onLine);

    // Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Bluetooth Chat SW registered'))
        .catch((e) => console.warn('SW registration skipped:', e));
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Scan Click Handler
  const handleScanForPeers = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.scanForPeers();
    }
  }, []);

  // Select Active Peer
  const handleSelectPeer = useCallback((peer: PeerDevice | 'all') => {
    const peerId = peer === 'all' ? 'all' : peer.id;
    setActivePeerId(peerId);
  }, []);

  // Send Message Handler
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!managerRef.current) return;

      const targetId = activePeerId === 'all' ? 'all' : activePeerId || 'all';

      if (config.enableSound) soundFx.playSendSound();
      if (config.enableVibration) soundFx.vibrate(30);

      const msg = await managerRef.current.sendMessage(text, targetId);

      setMessages((prev) => [...prev, msg]);
      localDB.saveMessage(msg);
    },
    [activePeerId, config]
  );

  // Send File Message Handler
  const handleSendFileMessage = useCallback(
    async (file: File, captionText?: string) => {
      if (!managerRef.current) return;

      const targetId = activePeerId === 'all' ? 'all' : activePeerId || 'all';

      if (config.enableSound) soundFx.playSendSound();
      if (config.enableVibration) soundFx.vibrate([30, 50, 30]);

      const msg = await managerRef.current.sendFileMessage(file, targetId, captionText);

      setMessages((prev) => [...prev, msg]);
      localDB.saveMessage(msg);
    },
    [activePeerId, config]
  );

  // Clear Chat History for Current Peer
  const handleClearChat = useCallback(async () => {
    if (!activePeerId) return;
    const filtered = messages.filter((m) => m.peerId !== activePeerId);
    setMessages(filtered);
    if (activePeerId === 'all') {
      await localDB.clearAllHistory();
    }
  }, [activePeerId, messages]);

  // Export Chat History JSON
  const handleExportChat = useCallback(() => {
    const activeMsgs = messages.filter(
      (m) => activePeerId === 'all' || m.peerId === activePeerId
    );
    const blob = new Blob([JSON.stringify(activeMsgs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bluetooth-chat-log-${activePeerId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activePeerId, messages]);

  // Save Settings & Profile
  const handleSaveConfig = useCallback(
    (newConfig: BluetoothConfig, newProfile: UserProfile) => {
      const hardwareConfig = { ...newConfig, connectionMode: 'ble_hardware' as const };
      setConfig(hardwareConfig);
      setUserProfile(newProfile);

      localDB.setKV('config', hardwareConfig);
      localDB.setKV('profile', newProfile);

      if (managerRef.current) {
        managerRef.current.updateConfig(hardwareConfig);
        managerRef.current.updateUserProfile(newProfile);
      }
    },
    []
  );

  // Manual GATT Read & Write
  const handleExecuteGattRead = useCallback(async (serviceUuid: string, charUuid: string) => {
    if (!managerRef.current) throw new Error('Bluetooth Manager not ready.');
    return await managerRef.current.readCustomCharacteristic(serviceUuid, charUuid);
  }, []);

  const handleExecuteGattWrite = useCallback(async (serviceUuid: string, charUuid: string, text: string) => {
    if (!managerRef.current) throw new Error('Bluetooth Manager not ready.');
    return await managerRef.current.writeCustomCharacteristic(serviceUuid, charUuid, text);
  }, []);

  // Derived Map for last messages in sidebar
  const lastMessagesMap = new Map<string, ChatMessage>();
  messages.forEach((msg) => {
    lastMessagesMap.set(msg.peerId, msg);
  });

  const selectedPeer =
    activePeerId === 'all'
      ? 'all'
      : peers.find((p) => p.id === activePeerId) || null;

  return (
    <div className="relative flex flex-col flex-1 h-full w-full bg-[#0a0c14] text-slate-100 font-sans overflow-hidden select-none">
      {/* Frosted Glass Background Mesh Gradients */}
      <div className="-top-48 -left-48 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none absolute z-0" />
      <div className="top-1/2 -right-48 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none absolute z-0" />
      <div className="-bottom-48 left-1/4 w-[700px] h-[400px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none absolute z-0" />

      {/* Main Glass Workspace */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full backdrop-blur-3xl overflow-hidden">
        {/* Top Application Bar */}
        <Header
          status={status}
          userProfile={userProfile}
          config={config}
          isOnline={isOnline}
          onScanClick={() => setShowScanModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenGattInspector={() => setShowGattInspector(true)}
          onOpenProfile={() => setShowSettingsModal(true)}
        />

        {/* Bluetooth Offline Status Alert */}
        <BluetoothStatusCard
          status={status}
          onScanClick={handleScanForPeers}
        />

        {/* Main Workspace (Sidebar + Chat Area) */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <Sidebar
            peers={peers}
            activePeerId={activePeerId}
            lastMessagesMap={lastMessagesMap}
            isScanning={status === 'scanning'}
            onSelectPeer={handleSelectPeer}
            onScanClick={handleScanForPeers}
          />

          <ChatWindow
            activePeer={selectedPeer}
            messages={messages.filter(
              (m) => activePeerId === 'all' || m.peerId === activePeerId
            )}
            userProfile={userProfile}
            onSendMessage={handleSendMessage}
            onSendFileMessage={handleSendFileMessage}
            onClearChat={handleClearChat}
            onExportChat={handleExportChat}
            onOpenGattInspector={() => setShowGattInspector(true)}
          />
        </div>

        {/* Modals */}
        <ScanModal
          isOpen={showScanModal}
          status={status}
          diagnostics={diagnostics}
          onClose={() => setShowScanModal(false)}
          onStartBleScan={handleScanForPeers}
        />

        <SettingsModal
          isOpen={showSettingsModal}
          config={config}
          userProfile={userProfile}
          onClose={() => setShowSettingsModal(false)}
          onSaveConfig={handleSaveConfig}
          onClearHistory={async () => {
            await localDB.clearAllHistory();
            setMessages([]);
            setPeers([]);
            setShowSettingsModal(false);
          }}
          onExportHistory={handleExportChat}
        />

        <GattInspectorModal
          isOpen={showGattInspector}
          logs={gattLogs}
          activePeer={selectedPeer}
          onClose={() => setShowGattInspector(false)}
          onExecuteRead={handleExecuteGattRead}
          onExecuteWrite={handleExecuteGattWrite}
        />
      </div>
    </div>
  );
}
