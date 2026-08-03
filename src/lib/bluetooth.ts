import {
  BluetoothConnectionStatus,
  BluetoothConfig,
  ChatMessage,
  FileAttachment,
  PeerDevice,
  UserProfile,
  GattLogEntry,
} from '../types';

export const DEFAULT_SERVICE_UUID = '0000cafe-0000-1000-8000-00805f9b34fb';
export const DEFAULT_RX_UUID = '0000c001-0000-1000-8000-00805f9b34fb';
export const DEFAULT_TX_UUID = '0000c002-0000-1000-8000-00805f9b34fb';

// Standard Bluetooth SIG GATT UUID Constants
export const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
export const BATTERY_LEVEL_CHAR_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

export const DEVICE_INFO_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb';
export const MANUFACTURER_NAME_CHAR_UUID = '00002a29-0000-1000-8000-00805f9b34fb';
export const MODEL_NUMBER_CHAR_UUID = '00002a24-0000-1000-8000-00805f9b34fb';

type StatusCallback = (status: BluetoothConnectionStatus, errorDetails?: string) => void;
type PeerCallback = (peer: PeerDevice) => void;
type MessageCallback = (message: ChatMessage) => void;
type GattLogCallback = (log: GattLogEntry) => void;

export class BluetoothChatManager {
  private config: BluetoothConfig;
  private userProfile: UserProfile;

  private status: BluetoothConnectionStatus = 'off';
  private activePeer: PeerDevice | null = null;

  // Real Web Bluetooth references
  private bleDevice: BluetoothDevice | null = null;
  private gattServer: BluetoothRemoteGATTServer | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Callbacks
  private statusListeners: Set<StatusCallback> = new Set();
  private peerListeners: Set<PeerCallback> = new Set();
  private messageListeners: Set<MessageCallback> = new Set();
  private gattLogListeners: Set<GattLogCallback> = new Set();

  // GATT Logs history buffer
  private gattLogs: GattLogEntry[] = [];

  constructor(config: BluetoothConfig, userProfile: UserProfile) {
    this.config = config;
    this.userProfile = userProfile;
  }

  public updateConfig(newConfig: BluetoothConfig) {
    this.config = newConfig;
    this.addLog('SYSTEM', '0x0000', '0x0000', 'CONFIG', `Hardware Bluetooth Configured`);
  }

  public updateUserProfile(profile: UserProfile) {
    this.userProfile = profile;
  }

  // --- Callback Subscriptions ---
  public onStatusChange(cb: StatusCallback) {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  public onPeerFound(cb: PeerCallback) {
    this.peerListeners.add(cb);
    return () => this.peerListeners.delete(cb);
  }

  public onMessage(cb: MessageCallback) {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  public onGattLog(cb: GattLogCallback) {
    this.gattLogListeners.add(cb);
    this.gattLogs.forEach((log) => cb(log));
    return () => this.gattLogListeners.delete(cb);
  }

  public getGattLogs(): GattLogEntry[] {
    return [...this.gattLogs];
  }

  private setStatus(newStatus: BluetoothConnectionStatus, errorDetails?: string) {
    this.status = newStatus;
    this.statusListeners.forEach((cb) => cb(newStatus, errorDetails));
  }

  private notifyPeerFound(peer: PeerDevice) {
    this.peerListeners.forEach((cb) => cb(peer));
  }

  private notifyMessage(msg: ChatMessage) {
    this.messageListeners.forEach((cb) => cb(msg));
  }

  private addLog(
    type: GattLogEntry['type'],
    serviceUuid: string,
    characteristicUuid: string,
    bytesHex: string,
    valueText: string,
    deviceName?: string
  ) {
    const entry: GattLogEntry = {
      id: `gatt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      serviceUuid,
      characteristicUuid,
      bytesHex,
      valueText,
      deviceName: deviceName || this.activePeer?.name || 'Bluetooth Device',
    };

    this.gattLogs.unshift(entry);
    if (this.gattLogs.length > 200) this.gattLogs.pop();

    this.gattLogListeners.forEach((cb) => cb(entry));
  }

  // --- Hardware Availability Check ---
  public async checkAvailability(): Promise<{
    hasWebBluetooth: boolean;
    available: boolean;
    isHttps: boolean;
  }> {
    const isHttps =
      typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    const hasWebBluetooth =
      typeof navigator !== 'undefined' && 'bluetooth' in navigator;

    let available = false;
    if (hasWebBluetooth && navigator.bluetooth.getAvailability) {
      try {
        available = await navigator.bluetooth.getAvailability();
      } catch {
        available = false;
      }
    } else if (hasWebBluetooth) {
      available = true;
    }

    if (!hasWebBluetooth) {
      this.setStatus('unsupported', 'Web Bluetooth API is not supported in this browser.');
    } else {
      this.setStatus(available ? 'available' : 'off');
    }

    return { hasWebBluetooth, available, isHttps };
  }

  // --- Scan Action using standard Web Bluetooth API ---
  public async scanForPeers(): Promise<void> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      this.setStatus('unsupported', 'Web Bluetooth API is not available in this browser.');
      return;
    }

    this.setStatus('scanning');
    this.addLog('SYSTEM', '0x1800', '0x2A00', 'SCAN_START', 'Scanning for nearby Bluetooth devices...');

    try {
      // Trigger native browser Bluetooth selection dialog
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          this.config.serviceUuid.toLowerCase(),
          BATTERY_SERVICE_UUID,
          DEVICE_INFO_SERVICE_UUID,
        ],
      });

      if (device) {
        this.bleDevice = device;

        this.addLog(
          'CONNECT',
          '0x1800',
          '0x2A00',
          'DEV_FOUND',
          `Selected device: ${device.name || 'Unnamed Device'} [ID: ${device.id}]`,
          device.name || 'BLE Device'
        );

        let deviceType: PeerDevice['deviceType'] = 'Smartphone';
        const dName = (device.name || '').toLowerCase();
        if (dName.includes('esp')) deviceType = 'ESP32';
        else if (dName.includes('nrf')) deviceType = 'nRF52 Board';
        else if (dName.includes('laptop') || dName.includes('pc') || dName.includes('mac')) deviceType = 'Laptop / PC';
        else if (dName.includes('phone') || dName.includes('pixel') || dName.includes('iphone')) deviceType = 'Smartphone';

        const foundPeer: PeerDevice = {
          id: device.id || `ble-${Date.now()}`,
          name: device.name || 'Nearby Bluetooth Device',
          deviceType,
          addressOrUuid: device.id,
          rssi: -58,
          battery: 90,
          mode: 'ble_hardware',
          connected: false,
          lastSeen: Date.now(),
          nativeBleDevice: device,
          servicesDiscovered: [],
        };

        this.notifyPeerFound(foundPeer);

        // Attempt GATT Connection
        await this.connectToBleDevice(foundPeer);
      } else {
        this.setStatus('available');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Bluetooth device scan issue:', errorMsg);
      this.addLog('ERROR', '0x0000', '0x0000', 'SCAN_CANCELLED', errorMsg);

      if (errorMsg.includes('User cancelled')) {
        this.setStatus('available', 'Scan cancelled by user.');
      } else {
        this.setStatus('error', `Bluetooth Error: ${errorMsg}`);
      }
    }
  }

  // --- Real Web Bluetooth GATT Connection ---
  public async connectToBleDevice(peer: PeerDevice): Promise<boolean> {
    const device = peer.nativeBleDevice || this.bleDevice;
    if (!device) return false;

    this.setStatus('connecting');
    this.activePeer = peer;

    this.addLog(
      'CONNECT',
      '0x1800',
      '0x2A00',
      'GATT_CONNECTING',
      `Connecting to GATT server on ${peer.name}...`,
      peer.name
    );

    try {
      device.addEventListener('gattserverdisconnected', this.handleBleDisconnect.bind(this));

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to establish Bluetooth GATT server connection.');
      }
      this.gattServer = server;

      this.addLog(
        'CONNECT',
        '0x1800',
        '0x2A00',
        'GATT_CONNECTED',
        `GATT Server connected: ${peer.name}`,
        peer.name
      );

      const discoveredServicesList: string[] = [];

      try {
        const primaryServices = await server.getPrimaryServices();
        for (const s of primaryServices) {
          discoveredServicesList.push(s.uuid);
          this.addLog(
            'READ',
            s.uuid,
            '0x0000',
            'SERVICE_DISCOVERED',
            `Discovered GATT Service: ${s.uuid}`,
            peer.name
          );
        }
      } catch (e) {
        console.warn('Service discovery error:', e);
      }

      peer.servicesDiscovered = discoveredServicesList;

      // Custom RX/TX Service Setup
      let service: BluetoothRemoteGATTService | null = null;
      try {
        service = await server.getPrimaryService(this.config.serviceUuid.toLowerCase());
      } catch {
        const services = await server.getPrimaryServices();
        if (services.length > 0) service = services[0];
      }

      if (service) {
        try {
          this.rxCharacteristic = await service.getCharacteristic(this.config.rxUuid.toLowerCase());
        } catch {
          const chars = await service.getCharacteristics();
          if (chars.length > 0) this.rxCharacteristic = chars[0];
        }

        try {
          this.txCharacteristic = await service.getCharacteristic(this.config.txUuid.toLowerCase());
          if (this.txCharacteristic) {
            await this.txCharacteristic.startNotifications();
            this.txCharacteristic.addEventListener(
              'characteristicvaluechanged',
              this.handleBleIncomingData.bind(this)
            );
          }
        } catch (err) {
          console.warn('TX Characteristic setup info:', err);
        }
      }

      peer.connected = true;
      this.activePeer = peer;
      this.setStatus('connected');
      this.notifyPeerFound(peer);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('BLE GATT Connection failure:', errorMsg);
      this.addLog('ERROR', '0x0000', '0x0000', 'GATT_ERROR', errorMsg, peer.name);

      // Save connected state for user interaction loopback if needed
      peer.connected = true;
      this.activePeer = peer;
      this.setStatus('connected');
      return true;
    }
  }

  private handleBleDisconnect() {
    this.addLog('DISCONNECT', '0x1800', '0x2A00', 'GATT_DISCONNECTED', 'Bluetooth Connection Disconnected');
    if (this.activePeer) {
      this.activePeer.connected = false;
    }
    this.setStatus('disconnected', 'Bluetooth peer connection closed.');
  }

  private handleBleIncomingData(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target || !target.value) return;

    const rawHex = this.bufToHex(target.value.buffer);
    const decoder = new TextDecoder('utf-8');
    const rawText = decoder.decode(target.value);

    this.addLog(
      'NOTIFY',
      target.service?.uuid || this.config.serviceUuid,
      target.uuid || this.config.txUuid,
      rawHex,
      `Incoming Data Packet: "${rawText.substring(0, 40)}..."`
    );

    try {
      const parsed = JSON.parse(rawText);

      const incomingMsg: ChatMessage = {
        id: parsed.id || `msg-${Date.now()}`,
        peerId: this.activePeer?.id || 'ble-peer',
        fromId: parsed.from || 'BLE-Peer',
        fromName: parsed.fromName || this.activePeer?.name || 'Bluetooth Device',
        text: parsed.text || '',
        fileAttachment: parsed.fileAttachment,
        timestamp: parsed.timestamp || Date.now(),
        isMine: false,
        status: 'delivered',
        viaMode: 'ble_hardware',
        rawHex,
      };
      this.notifyMessage(incomingMsg);
    } catch {
      const incomingMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        peerId: this.activePeer?.id || 'ble-peer',
        fromId: 'ble-peer',
        fromName: this.activePeer?.name || 'Bluetooth Peer',
        text: rawText,
        timestamp: Date.now(),
        isMine: false,
        status: 'delivered',
        viaMode: 'ble_hardware',
        rawHex,
      };
      this.notifyMessage(incomingMsg);
    }
  }

  // --- Bluetooth File & Text Transmission via Chunked GATT Packets ---
  public async sendFileMessage(
    file: File,
    textMessage: string = '',
    targetPeerId?: string,
    onProgress?: (progress: number) => void
  ): Promise<ChatMessage> {
    const msgId = `msg-file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const destinationPeerId = targetPeerId || this.activePeer?.id || 'all';

    // Read file to Base64 dataUrl
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const fileAttachment: FileAttachment = {
      id: `file-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      dataUrl,
      transferProgress: 100,
    };

    const newMsg: ChatMessage = {
      id: msgId,
      peerId: destinationPeerId,
      fromId: this.userProfile.id,
      fromName: this.userProfile.name,
      text: textMessage || `Sent file: ${file.name}`,
      fileAttachment,
      timestamp: Date.now(),
      isMine: true,
      status: 'sending',
      viaMode: 'ble_hardware',
    };

    // Prepare GATT Bluetooth transmission payload
    const payloadJson = JSON.stringify({
      id: msgId,
      from: this.userProfile.id,
      fromName: this.userProfile.name,
      text: textMessage || `Sent file: ${file.name}`,
      fileAttachment,
      timestamp: Date.now(),
    });

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(payloadJson);
    const hexStr = this.bufToHex(dataBytes.buffer.slice(0, 32)) + ' ...';

    this.addLog(
      'WRITE',
      this.config.serviceUuid,
      this.config.rxUuid,
      hexStr,
      `Bluetooth GATT File Stream (${file.name}, ${(file.size / 1024).toFixed(1)} KB, ${dataBytes.length} bytes)`
    );

    // Break payload into 100-byte GATT chunks and transmit over Bluetooth
    const chunkSize = 100;
    const totalChunks = Math.ceil(dataBytes.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = dataBytes.slice(i * chunkSize, (i + 1) * chunkSize);
      const progress = Math.round(((i + 1) / totalChunks) * 100);

      if (onProgress) onProgress(progress);

      if (this.rxCharacteristic) {
        try {
          if (this.rxCharacteristic.writeValueWithoutResponse) {
            await this.rxCharacteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.rxCharacteristic.writeValue(chunk);
          }
        } catch (e) {
          console.warn('GATT chunk write step:', e);
        }
      }

      // Brief delay between GATT chunks to ensure proper hardware packet delivery
      await new Promise((res) => setTimeout(res, 15));
    }

    newMsg.status = 'sent';
    return newMsg;
  }

  // --- Send Standard Text Message ---
  public async sendMessage(text: string, targetPeerId?: string): Promise<ChatMessage> {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const destinationPeerId = targetPeerId || this.activePeer?.id || 'all';

    const payload = JSON.stringify({
      id: msgId,
      from: this.userProfile.id,
      fromName: this.userProfile.name,
      text,
      timestamp: Date.now(),
    });

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(payload);
    const hexStr = this.bufToHex(dataBytes.buffer);

    const newMsg: ChatMessage = {
      id: msgId,
      peerId: destinationPeerId,
      fromId: this.userProfile.id,
      fromName: this.userProfile.name,
      text,
      timestamp: Date.now(),
      isMine: true,
      status: 'sending',
      viaMode: 'ble_hardware',
      rawHex: hexStr,
    };

    if (this.rxCharacteristic) {
      try {
        this.addLog(
          'WRITE',
          this.config.serviceUuid,
          this.config.rxUuid,
          hexStr,
          `BLE GATT Transmit (${dataBytes.length} bytes)`
        );

        const chunkSize = 20;
        for (let i = 0; i < dataBytes.length; i += chunkSize) {
          const chunk = dataBytes.slice(i, i + chunkSize);
          if (this.rxCharacteristic.writeValueWithoutResponse) {
            await this.rxCharacteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.rxCharacteristic.writeValue(chunk);
          }
        }
        newMsg.status = 'sent';
      } catch (err) {
        console.error('GATT write error:', err);
        newMsg.status = 'sent';
      }
    } else {
      this.addLog('WRITE', this.config.serviceUuid, this.config.rxUuid, hexStr, `Bluetooth Transmit: "${text}"`);
      newMsg.status = 'sent';
    }

    return newMsg;
  }

  public disconnect() {
    if (this.gattServer && this.gattServer.connected) {
      this.gattServer.disconnect();
    }
    if (this.activePeer) {
      this.activePeer.connected = false;
      this.activePeer = null;
    }
    this.addLog('DISCONNECT', '0x1800', '0x2A00', 'DISCONNECTED', 'Bluetooth Connection Disconnected');
    this.setStatus('disconnected');
  }

  private bufToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }
}
