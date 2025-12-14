import { Child } from '../types';

const DB_NAME = 'MandirAttendanceDB';
const DB_VERSION = 1;
const STORE_NAME = 'children';

export class DBService {
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    if (this.db) return Promise.resolve(); // Prevent multiple open requests

    // SAFETY: Request persistent storage to prevent browser from auto-clearing data
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persisted storage granted: ${isPersisted}`);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("Database error:", event);
        reject("Error opening database");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          objectStore.createIndex('fullName', 'fullName', { unique: false });
          objectStore.createIndex('village', 'village', { unique: false });
        }
      };
    });
  }

  // Helper to get transaction
  private getStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction([STORE_NAME], mode);
    return transaction.objectStore(STORE_NAME);
  }

  async getAllChildren(): Promise<Child[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addChild(child: Child): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.add(child);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateChild(child: Child): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.put(child);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChild(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // NEW: Critical for recovering data from JSON backup
  async restoreData(children: Child[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not init");
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      // We use 'put' which updates if ID exists, adds if it doesn't
      children.forEach(child => {
        store.put(child);
      });
    });
  }
}

export const dbService = new DBService();