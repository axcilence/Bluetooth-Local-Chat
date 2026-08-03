import { ChatMessage, UserProfile, BluetoothConfig, PeerDevice } from '../types';

const DB_NAME = 'bluetooth_chat_db';
const DB_VERSION = 1;

export class LocalStorageDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('peerId', 'peerId', { unique: false });
          msgStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Peers store
        if (!db.objectStoreNames.contains('peers')) {
          db.createObjectStore('peers', { keyPath: 'id' });
        }

        // Settings / Profile store
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv', { keyPath: 'key' });
        }
      };
    });
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');
      const request = store.put(message);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMessagesForPeer(peerId: string): Promise<ChatMessage[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const index = store.index('peerId');
      const request = index.getAll(peerId);

      request.onsuccess = () => {
        const res = (request.result as ChatMessage[]) || [];
        res.sort((a, b) => a.timestamp - b.timestamp);
        resolve(res);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAllMessages(): Promise<ChatMessage[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const request = store.getAll();

      request.onsuccess = () => {
        const res = (request.result as ChatMessage[]) || [];
        res.sort((a, b) => a.timestamp - b.timestamp);
        resolve(res);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async savePeer(peer: PeerDevice): Promise<void> {
    await this.init();
    if (!this.db) return;

    // Omit non-serializable properties like DOM elements / GATT server refs
    const cleanPeer: Partial<PeerDevice> = {
      id: peer.id,
      name: peer.name,
      deviceType: peer.deviceType,
      addressOrUuid: peer.addressOrUuid,
      rssi: peer.rssi,
      battery: peer.battery,
      mode: peer.mode,
      connected: peer.connected,
      lastSeen: peer.lastSeen,
      unreadCount: peer.unreadCount,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('peers', 'readwrite');
      const store = tx.objectStore('peers');
      const request = store.put(cleanPeer);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSavedPeers(): Promise<PeerDevice[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('peers', 'readonly');
      const store = tx.objectStore('peers');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as PeerDevice[]);
      request.onerror = () => reject(request.error);
    });
  }

  async setKV<T>(key: string, value: T): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getKV<T>(key: string, defaultValue: T): Promise<T> {
    await this.init();
    if (!this.db) return defaultValue;

    return new Promise((resolve) => {
      const tx = this.db!.transaction('kv', 'readonly');
      const store = tx.objectStore('kv');
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result && request.result.value !== undefined) {
          resolve(request.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };

      request.onerror = () => resolve(defaultValue);
    });
  }

  async clearAllHistory(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['messages', 'peers'], 'readwrite');
      tx.objectStore('messages').clear();
      tx.objectStore('peers').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const localDB = new LocalStorageDB();
