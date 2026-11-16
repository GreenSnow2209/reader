import { DocumentMetadata } from '../engine/types';

export interface StoredBook extends DocumentMetadata {
  data: ArrayBuffer;
  addedAt: number;
}

export interface ReadingProgress {
  bookId: string;
  pageNumber: number;
  chapterIndex: number;
  totalPages: number;
  progressPercent: number;
  updatedAt: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  chapterTitle: string;
  excerpt: string;
  createdAt: number;
}

export interface Highlight {
  id: string;
  bookId: string;
  pageNumber: number;
  text: string;
  color: string;
  note?: string;
  createdAt: number;
}

const DB_NAME = 'lumina_reader_db';
const DB_VERSION = 1;

export class StorageManager {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  static async getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available in this environment'));
        return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'bookId' });
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          const store = db.createObjectStore('bookmarks', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('highlights')) {
          const store = db.createObjectStore('highlights', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  // --- Books ---
  static async saveBook(book: StoredBook): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').put(book);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async getAllBooks(): Promise<StoredBook[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readonly');
      const req = tx.objectStore('books').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  static async getBook(id: string): Promise<StoredBook | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readonly');
      const req = tx.objectStore('books').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  static async deleteBook(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['books', 'progress', 'bookmarks', 'highlights'], 'readwrite');
      tx.objectStore('books').delete(id);
      tx.objectStore('progress').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Reading Progress ---
  static async saveProgress(progress: ReadingProgress): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readwrite');
      tx.objectStore('progress').put(progress);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async getProgress(bookId: string): Promise<ReadingProgress | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readonly');
      const req = tx.objectStore('progress').get(bookId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Bookmarks ---
  static async addBookmark(bookmark: Bookmark): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readwrite');
      tx.objectStore('bookmarks').put(bookmark);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async getBookmarks(bookId: string): Promise<Bookmark[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readonly');
      const index = tx.objectStore('bookmarks').index('bookId');
      const req = index.getAll(bookId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  static async removeBookmark(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readwrite');
      tx.objectStore('bookmarks').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
