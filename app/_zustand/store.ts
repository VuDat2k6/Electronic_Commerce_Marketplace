/**
 * Product Cart Store (Zustand)
 * 
 * Manages the shopping cart state with the following features:
 * - Add/remove products from cart
 * - Update product quantities
 * - Group products by merchant (for multi-seller checkout)
 * - Calculate totals (subtotal, shipping, tax, grand total)
 * - Persist cart to sessionStorage
 * 
 * Cart data persists across page refreshes using sessionStorage
 * (cleared when browser tab is closed)
 * 
 * @module _zustand/store
 * @requires zustand
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// TYPE DEFINITIONS
// Defines the structure of cart-related data
// ============================================================

/**
 * Product in cart
 * Represents an item added to the shopping cart
 */
export type ProductInCart = {
  id: string;              // Unique product identifier
  title: string;           // Product name
  price: number;           // Unit price (in cents)
  image: string;           // Product image URL
  amount: number;          // Quantity in cart
  sellerId?: string;       // Seller ID (bắt buộc - thay merchantId)
  sellerName?: string;     // Seller name (thay merchantName)
  slug?: string;           // URL-friendly product identifier
  maxStock?: number;       // Maximum available stock
  // backward compat
  merchantId?: string;
  merchantName?: string;
};

/**
 * Cart group
 * Groups products by seller for multi-seller checkout
 * Each seller has their own shipping fee calculation
 */
export type CartGroup = {
  sellerId: string;        // Seller identifier (thay merchantId)
  sellerName: string;      // Seller name (thay merchantName)
  items: ProductInCart[];  // Products from this seller
  subtotal: number;        // Subtotal for this seller's items
  shippingFee: number;     // Shipping fee for this group
  // backward compat
  merchantId?: string;
  merchantName?: string;
};

/**
 * Store state type
 * Core state properties for the cart
 */
export type State = {
  products: ProductInCart[];  // Array of products in cart
  allQuantity: number;        // Total quantity of all items
  total: number;              // Total price (quantity * price) for all items
};

/**
 * Store actions type
 * All functions that can modify the cart
 */
export type Actions = {
  addToCart: (newProduct: ProductInCart) => void;                                    // Add product to cart
  removeFromCart: (id: string) => void;                                              // Remove product from cart
  updateCartAmount: (id: string, quantity: number) => void;                          // Update product quantity
  clearCart: () => void;                                                              // Clear all products
  getCartGroups: () => CartGroup[];                                                   // Get products grouped by merchant
  getCartTotal: () => { subtotal: number; shipping: number; tax: number; grandTotal: number };  // Calculate final totals
  isInCart: (id: string) => boolean;                                                  // Check if product is in cart
  getProductAmount: (id: string) => number;                                           // Get quantity of specific product
};

// ============================================================
// HELPER FUNCTIONS
// Utility functions used by the store
// ============================================================

/**
 * Calculates total quantity and total price from product list
 * Used to update state after any cart modification
 * 
 * @param {ProductInCart[]} products - Array of products
 * @returns {Object} Object with quantity and total price
 */
function calculateTotals(products: ProductInCart[]) {
  return products.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.amount,
      total: acc.total + item.amount * item.price,
    }),
    { quantity: 0, total: 0 }
  );
}

// ============================================================
// CART STORE
// Main store definition with Zustand
// ============================================================

/**
 * Product Cart Store
 * 
 * Features:
 * - Persists to sessionStorage (survives refresh, cleared on tab close)
 * - Automatically calculates totals
 * - Groups products by merchant for multi-seller support
 * - Validates against stock limits
 * 
 * @example
 * // Access store in component
 * const { products, addToCart } = useProductStore();
 * 
 * // Add product to cart
 * addToCart({ id: '123', title: 'Laptop', price: 100000, image: '...', amount: 1 });
 */
export const useProductStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      // Initial state
      products: [],
      allQuantity: 0,
      total: 0,

      /**
       * Add product to cart
       * - If product already exists, increases quantity
       * - Respects maxStock limit if provided
       * - Automatically updates totals
       * 
       * @param {ProductInCart} newProduct - Product to add
       */
      addToCart: (newProduct) => {
        set((state) => {
          // Check if product already exists in cart
          const existingIndex = state.products.findIndex(
            (item) => item.id === newProduct.id
          );

          let updatedProducts: ProductInCart[];

          if (existingIndex === -1) {
            // New product: add to array with default quantity of 1
            updatedProducts = [...state.products, newProduct];
          } else {
            // Existing product: increase quantity
            const existing = state.products[existingIndex];
            const newAmount = existing.amount + (newProduct.amount || 1);
            
            // Respect maxStock limit if provided
            const maxStock = existing.maxStock ?? newProduct.maxStock;
            const validAmount = maxStock
              ? Math.min(newAmount, maxStock)
              : newAmount;

            updatedProducts = state.products.map((product, index) =>
              index === existingIndex
                ? { ...product, ...newProduct, amount: validAmount, maxStock }
                : product
            );
          }

          // Recalculate totals
          const { quantity, total } = calculateTotals(updatedProducts);

          return {
            products: updatedProducts,
            allQuantity: quantity,
            total,
          };
        });
      },

      /**
       * Remove product from cart
       * Removes product by ID and recalculates totals
       * 
       * @param {string} id - Product ID to remove
       */
      removeFromCart: (id) => {
        set((state) => {
          // Filter out the product with matching ID
          const updatedProducts = state.products.filter(
            (product) => product.id !== id
          );
          const { quantity, total } = calculateTotals(updatedProducts);

          return {
            products: updatedProducts,
            allQuantity: quantity,
            total,
          };
        });
      },

      /**
       * Update product quantity
       * - If quantity <= 0, removes product from cart
       * - Respects maxStock limit if provided
       * 
       * @param {string} id - Product ID
       * @param {number} amount - New quantity
       */
      updateCartAmount: (id, amount) => {
        set((state) => {
          // Remove product if quantity is 0 or negative
          if (amount <= 0) {
            const updatedProducts = state.products.filter(
              (product) => product.id !== id
            );
            const { quantity, total } = calculateTotals(updatedProducts);
            return {
              products: updatedProducts,
              allQuantity: quantity,
              total,
            };
          }

          // Find product and validate against stock
          const product = state.products.find((p) => p.id === id);
          if (!product) return state;

          const validAmount = product.maxStock
            ? Math.min(amount, product.maxStock)
            : amount;

          // Update product quantity
          const updatedProducts = state.products.map((p) =>
            p.id === id ? { ...p, amount: validAmount } : p
          );
          const { quantity, total } = calculateTotals(updatedProducts);

          return {
            products: updatedProducts,
            allQuantity: quantity,
            total,
          };
        });
      },

      /**
       * Clear all products from cart
       * Resets cart to empty state
       */
      clearCart: () => {
        set({
          products: [],
          allQuantity: 0,
          total: 0,
        });
      },

      /**
       * Get products grouped by merchant
       * Used for multi-seller checkout flow
       * Each group has its own shipping fee
       * 
       * @returns {CartGroup[]} Array of cart groups by merchant
       */
      getCartGroups: () => {
        const state = get();
        const groupsMap = new Map<string, CartGroup>();

        // Group products by seller
        for (const item of state.products) {
          const sellerId = item.sellerId || item.merchantId || "default";
          const sellerName = item.sellerName || item.merchantName || "Unknown Shop";
          const shippingFee = 500; // $5.00 default (in cents)

          // Create new group if seller doesn't exist
          if (!groupsMap.has(sellerId)) {
            groupsMap.set(sellerId, {
              sellerId,
              sellerName,
              items: [],
              subtotal: 0,
              shippingFee,
            });
          }

          // Add product to seller group
          const group = groupsMap.get(sellerId)!;
          group.items.push(item);
          group.subtotal += item.amount * item.price;
        }

        return Array.from(groupsMap.values());
      },

      /**
       * Calculate final order totals
       * Includes subtotal, shipping, tax, and grand total
       * 
       * @returns {Object} Breakdown of all totals
       */
      getCartTotal: () => {
        const groups = get().getCartGroups();
        
        // Sum subtotals from all groups
        const subtotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
        
        // Sum shipping fees from all groups
        const shipping = groups.reduce((sum, g) => sum + g.shippingFee, 0);
        
        // Calculate 5% tax on subtotal
        const tax = Math.round(subtotal * 0.05);
        
        // Grand total = subtotal + shipping + tax
        const grandTotal = subtotal + shipping + tax;

        return { subtotal, shipping, tax, grandTotal };
      },

      /**
       * Check if product is already in cart
       * 
       * @param {string} id - Product ID to check
       * @returns {boolean} True if product is in cart
       */
      isInCart: (id) => {
        return get().products.some((p) => p.id === id);
      },

      /**
       * Get quantity of specific product in cart
       * 
       * @param {string} id - Product ID
       * @returns {number} Quantity in cart (0 if not found)
       */
      getProductAmount: (id) => {
        const product = get().products.find((p) => p.id === id);
        return product?.amount || 0;
      },
    }),
    {
      // Persistence configuration
      name: "products-storage",           // Storage key name
      storage: createJSONStorage(() => sessionStorage),  // Use sessionStorage (not localStorage)
    }
  )
);

/**
 * STORAGE NOTES:
 * 
 * sessionStorage vs localStorage:
 * - sessionStorage: Cleared when browser tab/window is closed
 * - localStorage: Persists until explicitly cleared
 * 
 * Cart data in sessionStorage means:
 * ✅ Cart survives page refresh
 * ✅ Cart persists while browsing the site
 * ❌ Cart is cleared when browser tab is closed
 * 
 * This is typically desired for shopping carts as users
 * usually don't expect abandoned carts to persist forever.
 */