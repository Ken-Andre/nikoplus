import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  cacheProducts,
  cacheStock,
  getCachedProducts,
  cleanupOldData,
  type CachedProduct,
} from '@/lib/offlineStorage';
import { toast } from 'sonner';

interface UseOfflineCacheReturn {
  isInitialized: boolean;
  isLoading: boolean;
  cachedProducts: CachedProduct[];
  refreshCache: () => Promise<void>;
}

export function useOfflineCache(boutiqueId?: string): UseOfflineCacheReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedProducts, setCachedProducts] = useState<CachedProduct[]>([]);

  const loadCachedProducts = useCallback(async () => {
    const products = await getCachedProducts();
    setCachedProducts(products);
  }, []);

  const refreshCache = useCallback(async () => {
    if (!boutiqueId) return;

    setIsLoading(true);
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id, reference, name, description, category_id,
          selling_price, purchase_price, alert_threshold, image_url, is_active,
          categories(name)
        `)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Transform and cache products
      const productsToCache = (productsData || []).map(p => ({
        id: p.id,
        reference: p.reference,
        name: p.name,
        description: p.description,
        categoryId: p.category_id,
        categoryName: (p.categories as any)?.name,
        sellingPrice: p.selling_price,
        purchasePrice: p.purchase_price || 0,
        alertThreshold: p.alert_threshold || 5,
        imageUrl: p.image_url,
        isActive: p.is_active ?? true,
      }));

      await cacheProducts(productsToCache);

      // Fetch stock for this boutique
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('product_id, quantity')
        .eq('boutique_id', boutiqueId);

      if (stockError) throw stockError;

      // Cache stock
      const stockToCache = (stockData || []).map(s => ({
        productId: s.product_id,
        boutiqueId,
        quantity: s.quantity,
      }));

      await cacheStock(stockToCache);

      // Reload cached products
      await loadCachedProducts();

      console.log(`Cache refreshed: ${productsToCache.length} products, ${stockToCache.length} stock items`);
    } catch (error) {
      console.error('Error refreshing cache:', error);
      // Don't show error toast - this runs in background
    } finally {
      setIsLoading(false);
    }
  }, [boutiqueId, loadCachedProducts]);

  // Initialize cache on mount
  useEffect(() => {
    const initCache = async () => {
      // Load existing cached data first
      await loadCachedProducts();
      
      // Clean up old data
      await cleanupOldData();
      
      // Mark as initialized
      setIsInitialized(true);
      
      // Refresh cache if we have a boutiqueId
      if (boutiqueId) {
        await refreshCache();
      }
    };

    initCache();
  }, [boutiqueId, loadCachedProducts, refreshCache]);

  return {
    isInitialized,
    isLoading,
    cachedProducts,
    refreshCache,
  };
}
