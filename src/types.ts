export type BluetoothConnectionStatus =
  | 'unsupported'
  | 'off'
  | 'available'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export type ConnectionMode = 'ble_hardware';

export interface GattLogEntry {
  id: string;
  timestamp: number;
  type: 'READ' | 'WRITE' | 'NOTIFY' | 'CONNECT' | 'DISCONNECT' | 'ERROR' | 'SYSTEM';
  serviceUuid: string;
  characteristicUuid: string;
  bytesHex: string;
  valueText: string;
  deviceName?: string;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  dataUrl: string;
  transferProgress?: number;
}

export interface PeerDevice {
  id: string;
  name: string;
  deviceType:
    | 'ESP32'
    | 'nRF52 Board'
    | 'Smartphone'
    | 'Laptop / PC'
    | 'BLE Beacon'
    | 'Heart Rate Monitor'
    | 'Battery Sensor';
  addressOrUuid?: string;
  rssi: number; // e.g. -65 dBm
  battery?: number; // percentage 0-100
  manufacturerName?: string;
  modelNumber?: string;
  heartRateBpm?: number;
  servicesDiscovered?: string[];
  mode: ConnectionMode;
  connected: boolean;
  lastSeen: number;
  unreadCount?: number;
  nativeBleDevice?: BluetoothDevice;
  gattServer?: BluetoothRemoteGATTServer;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  peerId: string; // 'all' for group broadcast or target peer ID
  fromId: string;
  fromName: string;
  text: string;
  fileAttachment?: FileAttachment;
  timestamp: number;
  isMine: boolean;
  status: MessageStatus;
  viaMode: ConnectionMode;
  rssiAtSend?: number;
  rawHex?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarColor: string;
  bleDeviceName: string;
  createdTimestamp: number;
}

export interface BluetoothConfig {
  serviceUuid: string;
  rxUuid: string;
  txUuid: string;
  enableSound: boolean;
  enableVibration: boolean;
  autoConnectLast: boolean;
  connectionMode: ConnectionMode;
}

export interface DiagnosticsStatus {
  hasWebBluetooth: boolean;
  bluetoothAvailable: boolean;
  isHttps: boolean;
  pwaInstalled: boolean;
  storagePersisted: boolean;
}


