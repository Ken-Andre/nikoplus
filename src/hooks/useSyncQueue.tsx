import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getPendingTransactions,
  updateTransactionStatus,
  deletePendingTransaction,
  getPendingCount,
  createLocalBackup,
  shouldCreateBackup,
  setLastBackupTime,
  type PendingTransaction,
} from '@/lib/offlineStorage';
import { useConnectionStatus } from './useConnectionStatus';
import { toast } from 'sonner';

interface SyncQueueState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  errors: string[];
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff

export function useSyncQueue() {
  const { isOnline, setPendingSyncs } = useConnectionStatus();
  const [state, setState] = useState<SyncQueueState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    errors: [],
  });
  
  const syncInProgress = useRef(false);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setState(prev => ({ ...prev, pendingCount: count }));
    setPendingSyncs(count);
  }, [setPendingSyncs]);

  // Process a single sale transaction
  const processSaleTransaction = async (tx: PendingTransaction): Promise<boolean> => {
    const { saleData, saleItems } = tx.data;
    
    try {
      // Insert sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      // Insert sale items
      const itemsWithSaleId = saleItems.map((item: any) => ({
        ...item,
        sale_id: sale.id,
      }));
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsWithSaleId);
      
      if (itemsError) throw itemsError;
      
      // Decrement stock for each item
      for (const item of saleItems) {
        await supabase.rpc('decrement_stock', {
          _boutique_id: saleData.boutique_id,
          _product_id: item.product_id,
          _quantity: item.quantity,
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Error processing sale:', error);
      throw error;
    }
  };

  // Process a stock adjustment transaction
  const processStockAdjustment = async (tx: PendingTransaction): Promise<boolean> => {
    const { productId, boutiqueId, adjustment, reason } = tx.data;
    
    try {
      const { error } = await supabase
        .from('stock')
        .update({ 
          quantity: adjustment,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId)
        .eq('boutique_id', boutiqueId);
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error processing stock adjustment:', error);
      throw error;
    }
  };

  // Process a single transaction
  const processTransaction = async (tx: PendingTransaction): Promise<boolean> => {
    await updateTransactionStatus(tx.id, 'syncing');
    
    try {
      let success = false;
      
      switch (tx.type) {
        case 'sale':
          success = await processSaleTransaction(tx);
          break;
        case 'stock_adjustment':
          success = await processStockAdjustment(tx);
          break;
        default:
          console.warn(`Unknown transaction type: ${tx.type}`);
          success = true; // Skip unknown types
      }
      
      if (success) {
        await deletePendingTransaction(tx.id);
        return true;
      }
      
      return false;
    } catch (error: any) {
      await updateTransactionStatus(tx.id, 'error', error.message);
      
      // Check if max retries exceeded
      if (tx.retryCount >= MAX_RETRIES) {
        // Keep in queue but mark as failed for manual resolution
        console.error(`Transaction ${tx.id} failed after ${MAX_RETRIES} retries`);
      }
      
      return false;
    }
  };

  // Main sync function
  const syncAll = useCallback(async () => {
    if (!isOnline || syncInProgress.current) return;
    
    syncInProgress.current = true;
    setState(prev => ({ ...prev, isSyncing: true, errors: [] }));
    
    const errors: string[] = [];
    let syncedCount = 0;
    
    try {
      const transactions = await getPendingTransactions();
      
      for (const tx of transactions) {
        // Skip transactions that have exceeded retry limit
        if (tx.retryCount >= MAX_RETRIES) continue;
        
        // Add delay based on retry count
        if (tx.retryCount > 0) {
          const delay = RETRY_DELAYS[Math.min(tx.retryCount - 1, RETRY_DELAYS.length - 1)];
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const success = await processTransaction(tx);
        if (success) {
          syncedCount++;
        } else {
          errors.push(`Erreur de synchronisation: ${tx.type} - ${tx.id}`);
        }
      }
      
      if (syncedCount > 0) {
        toast.success(`${syncedCount} opération(s) synchronisée(s)`);
      }
      
      setState(prev => ({
        ...prev,
        lastSyncTime: Date.now(),
        errors,
      }));
    } catch (error: any) {
      console.error('Sync error:', error);
      errors.push(error.message);
      setState(prev => ({ ...prev, errors }));
    } finally {
      syncInProgress.current = false;
      setState(prev => ({ ...prev, isSyncing: false }));
      await updatePendingCount();
    }
  }, [isOnline, updatePendingCount]);

  // Auto backup
  const checkAndBackup = useCallback(async () => {
    const shouldBackup = await shouldCreateBackup();
    if (shouldBackup) {
      await createLocalBackup('auto');
      await setLastBackupTime(Date.now());
      console.log('Auto backup created');
    }
  }, []);

  // Initialize and setup auto-sync
  useEffect(() => {
    updatePendingCount();
    
    // Setup backup interval (check every 30 minutes)
    backupIntervalRef.current = setInterval(checkAndBackup, 30 * 60 * 1000);
    
    // Initial backup check
    checkAndBackup();
    
    return () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
    };
  }, [updatePendingCount, checkAndBackup]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && state.pendingCount > 0) {
      // Delay sync slightly to ensure connection is stable
      const timeout = setTimeout(syncAll, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, state.pendingCount, syncAll]);

  return {
    ...state,
    syncAll,
    updatePendingCount,
    createBackup: () => createLocalBackup('manual'),
  };
}
