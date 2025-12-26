// NICKOPLUS PRO - Type definitions

export type AppRole = 'admin' | 'manager' | 'seller';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: AppRole;
  boutiqueId?: string;
  boutiqueName?: string;
  avatarUrl?: string;
}

export interface Boutique {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  reference: string;
  name: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  supplierId?: string;
  purchasePrice: number;
  sellingPrice: number;
  alertThreshold: number;
  imageUrl?: string;
  isActive: boolean;
  stock?: number; // Stock for current boutique
}

export interface Stock {
  id: string;
  productId: string;
  boutiqueId: string;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  reference: string;
  boutiqueId: string;
  boutiqueName?: string;
  sellerId: string;
  sellerName?: string;
  clientName?: string;
  clientPhone?: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'transfer';
  status: 'completed' | 'cancelled' | 'pending_sync';
  isSynced: boolean;
  createdAt: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  specialty?: string;
}

export interface SupplierOrder {
  id: string;
  reference: string;
  supplierId: string;
  supplierName?: string;
  boutiqueId: string;
  totalAmount: number;
  status: 'pending' | 'delivered' | 'cancelled';
  expectedDeliveryDate?: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName?: string;
  boutiqueId: string;
  boutiqueName?: string;
  alertType: 'low_stock' | 'out_of_stock';
  message?: string;
  isResolved: boolean;
  createdAt: string;
}

// UI Types
export type ConnectionStatus = 'online' | 'offline' | 'syncing';

export interface SaleStep {
  id: number;
  title: string;
  description: string;
}

export const SALE_STEPS: SaleStep[] = [
  { id: 1, title: 'Produits', description: 'Sélectionner les produits' },
  { id: 2, title: 'Client', description: 'Informations client (optionnel)' },
  { id: 3, title: 'Paiement', description: 'Mode de paiement' },
  { id: 4, title: 'Confirmation', description: 'Finaliser la vente' },
];

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Espèces', icon: '💵' },
  { id: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { id: 'card', label: 'Carte bancaire', icon: '💳' },
  { id: 'transfer', label: 'Virement', icon: '🏦' },
] as const;
