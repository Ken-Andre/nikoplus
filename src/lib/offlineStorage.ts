import { get, set, del, keys, createStore, UseStore } from 'idb-keyval';

// Database version for schema migrations
const DB_VERSION = 1;
const DB_NAME = 'nickoplus-offline-db';

// Create separate stores for different data types
const pendingTransactionsStore = createStore(`${DB_NAME}-transactions`, 'pending');
const productsCacheStore = createStore(`${DB_NAME}-products`, 'cache');
const stockCacheStore = createStore(`${DB_NAME}-stock`, 'cache');
const backupsStore = createStore(`${DB_NAME}-backups`, 'backups');
const metaStore = createStore(`${DB_NAME}-meta`, 'meta');

// Types
export interface PendingTransaction {
  id: string;
  type: 'sale' | 'stock_adjustment';
  data: any;
  timestamp: number;
  priority: 1 | 2 | 3; // 1=high (sales), 2=medium (stock), 3=low
  syncStatus: 'pending' | 'syncing' | 'error';
  retryCount: number;
  checksum: string;
  errorMessage?: string;
}

export interface CachedProduct {
  id: string;
  data: any;
  cachedAt: number;
  version: number;
}

export interface CachedStock {
  key: string; // productId_boutiqueId
  productId: string;
  boutiqueId: string;
  quantity: number;
  cachedAt: number;
}

export interface LocalBackup {
  id: string;
  timestamp: number;
  data: string; // JSON stringified
  type: 'auto' | 'manual';
}

// Generate checksum for data integrity
export function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============ PENDING TRANSACTIONS ============

export async function savePendingTransaction(
  type: PendingTransaction['type'],
  data: any,
  priority: PendingTransaction['priority'] = 2
): Promise<string> {
  const id = generateId();
  const transaction: PendingTransaction = {
    id,
    type,
    data,
    timestamp: Date.now(),
    priority,
    syncStatus: 'pending',
    retryCount: 0,
    checksum: generateChecksum(data),
  };
  
  await set(id, transaction, pendingTransactionsStore);
  return id;
}

export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  const allKeys = await keys(pendingTransactionsStore);
  const transactions: PendingTransaction[] = [];
  
  for (const key of allKeys) {
    const tx = await get<PendingTransaction>(key, pendingTransactionsStore);
    if (tx) transactions.push(tx);
  }
  
  // Sort by priority (1 first) then by timestamp (oldest first)
  return transactions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.timestamp - b.timestamp;
  });
}

export async function updateTransactionStatus(
  id: string,
  status: PendingTransaction['syncStatus'],
  errorMessage?: string
): Promise<void> {
  const tx = await get<PendingTransaction>(id, pendingTransactionsStore);
  if (tx) {
    tx.syncStatus = status;
    if (status === 'error') {
      tx.retryCount += 1;
      tx.errorMessage = errorMessage;
    }
    await set(id, tx, pendingTransactionsStore);
  }
}

export async function deletePendingTransaction(id: string): Promise<void> {
  await del(id, pendingTransactionsStore);
}

export async function getPendingCount(): Promise<number> {
  const allKeys = await keys(pendingTransactionsStore);
  return allKeys.length;
}

// ============ PRODUCTS CACHE ============

export async function cacheProducts(products: any[]): Promise<void> {
  const now = Date.now();
  for (const product of products) {
    const cached: CachedProduct = {
      id: product.id,
      data: product,
      cachedAt: now,
      version: DB_VERSION,
    };
    await set(product.id, cached, productsCacheStore);
  }
}

export async function getCachedProducts(): Promise<any[]> {
  const allKeys = await keys(productsCacheStore);
  const products: any[] = [];
  
  for (const key of allKeys) {
    const cached = await get<CachedProduct>(key, productsCacheStore);
    if (cached) products.push(cached.data);
  }
  
  return products;
}

export async function getCachedProduct(id: string): Promise<any | null> {
  const cached = await get<CachedProduct>(id, productsCacheStore);
  return cached?.data || null;
}

// ============ STOCK CACHE ============

export async function cacheStock(stocks: { productId: string; boutiqueId: string; quantity: number }[]): Promise<void> {
  const now = Date.now();
  for (const stock of stocks) {
    const key = `${stock.productId}_${stock.boutiqueId}`;
    const cached: CachedStock = {
      key,
      productId: stock.productId,
      boutiqueId: stock.boutiqueId,
      quantity: stock.quantity,
      cachedAt: now,
    };
    await set(key, cached, stockCacheStore);
  }
}

export async function getCachedStock(productId: string, boutiqueId: string): Promise<number | null> {
  const key = `${productId}_${boutiqueId}`;
  const cached = await get<CachedStock>(key, stockCacheStore);
  return cached?.quantity ?? null;
}

export async function updateCachedStock(productId: string, boutiqueId: string, quantityDelta: number): Promise<void> {
  const key = `${productId}_${boutiqueId}`;
  const cached = await get<CachedStock>(key, stockCacheStore);
  if (cached) {
    cached.quantity = Math.max(0, cached.quantity + quantityDelta);
    cached.cachedAt = Date.now();
    await set(key, cached, stockCacheStore);
  }
}

// ============ LOCAL BACKUPS ============

const MAX_BACKUPS = 3;
const BACKUP_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours

export async function createLocalBackup(type: 'auto' | 'manual' = 'auto'): Promise<string> {
  const id = generateId();
  
  // Gather all data
  const pendingTx = await getPendingTransactions();
  const products = await getCachedProducts();
  
  const backupData = {
    pendingTransactions: pendingTx,
    products,
    version: DB_VERSION,
  };
  
  const backup: LocalBackup = {
    id,
    timestamp: Date.now(),
    data: JSON.stringify(backupData),
    type,
  };
  
  await set(id, backup, backupsStore);
  
  // Clean old backups (keep only MAX_BACKUPS)
  await cleanOldBackups();
  
  return id;
}

async function cleanOldBackups(): Promise<void> {
  const allKeys = await keys(backupsStore);
  const backups: LocalBackup[] = [];
  
  for (const key of allKeys) {
    const backup = await get<LocalBackup>(key, backupsStore);
    if (backup) backups.push(backup);
  }
  
  // Sort by timestamp (newest first)
  backups.sort((a, b) => b.timestamp - a.timestamp);
  
  // Delete backups beyond MAX_BACKUPS
  const toDelete = backups.slice(MAX_BACKUPS);
  for (const backup of toDelete) {
    await del(backup.id, backupsStore);
  }
}

export async function getLatestBackup(): Promise<LocalBackup | null> {
  const allKeys = await keys(backupsStore);
  let latest: LocalBackup | null = null;
  
  for (const key of allKeys) {
    const backup = await get<LocalBackup>(key, backupsStore);
    if (backup && (!latest || backup.timestamp > latest.timestamp)) {
      latest = backup;
    }
  }
  
  return latest;
}

export async function restoreFromBackup(backup: LocalBackup): Promise<void> {
  const data = JSON.parse(backup.data);
  
  // Restore pending transactions
  for (const tx of data.pendingTransactions || []) {
    await set(tx.id, tx, pendingTransactionsStore);
  }
  
  // Restore products cache
  await cacheProducts(data.products || []);
}

// ============ CLEANUP ============

const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function cleanupOldData(): Promise<void> {
  const cutoff = Date.now() - MAX_CACHE_AGE;
  
  // Clean old products cache
  const productKeys = await keys(productsCacheStore);
  for (const key of productKeys) {
    const cached = await get<CachedProduct>(key, productsCacheStore);
    if (cached && cached.cachedAt < cutoff) {
      await del(key, productsCacheStore);
    }
  }
  
  // Clean old stock cache
  const stockKeys = await keys(stockCacheStore);
  for (const key of stockKeys) {
    const cached = await get<CachedStock>(key, stockCacheStore);
    if (cached && cached.cachedAt < cutoff) {
      await del(key, stockCacheStore);
    }
  }
}

// ============ META ============

export async function getLastBackupTime(): Promise<number | null> {
  return get<number>('lastBackupTime', metaStore);
}

export async function setLastBackupTime(time: number): Promise<void> {
  await set('lastBackupTime', time, metaStore);
}

export async function shouldCreateBackup(): Promise<boolean> {
  const lastBackup = await getLastBackupTime();
  if (!lastBackup) return true;
  return Date.now() - lastBackup >= BACKUP_INTERVAL;
}
