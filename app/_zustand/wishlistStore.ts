/**
 * Wishlist Store (Zustand)
 * 
 * Manages the user's wishlist/favorites state:
 * - Add/remove products from wishlist
 * - Check if product is in wishlist
 * - Sync with server-side wishlist
 * - Persist to sessionStorage
 * 
 * Wishlist stores products users want to save for later
 * without immediate purchase intent.
 * 
 * @module _zustand/wishlistStore
 * @requires zustand
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// TYPE DEFINITIONS
// Defines the structure of wishlist data
// ============================================================

/**
 * Product in wishlist
 * Represents a saved product in the wishlist
 */
export type ProductInWishlist = {
  id: string;              // Unique product identifier
  title: string;           // Product name
  price: number;           // Product price (in cents)
  image: string;           // Product image URL
  slug?: string;           // URL-friendly product identifier
  sellerId?: string;       // Shop owner for cart conversion
  sellerName?: string;     // Display name for cart grouping
  stockAvailabillity?: number;  // Available stock (note: typo in original)
};

/**
 * Store state type
 * Core state properties for the wishlist
 */
export type State = {
  wishlist: ProductInWishlist[];  // Array of products in wishlist
  wishQuantity: number;           // Total number of items in wishlist
};

/**
 * Store actions type
 * All functions that can modify the wishlist state
 */
export type Actions = {
  addToWishlist: (product: ProductInWishlist) => void;        // Add product to wishlist
  removeFromWishlist: (id: string) => void;                 // Remove product from wishlist
  setWishlist: (wishlist: ProductInWishlist[]) => void;      // Set entire wishlist (from API)
  clearWishlist: () => void;                                // Clear all products
  isInWishlist: (id: string) => boolean;                     // Check if product is in wishlist
};

// ============================================================
// WISHLIST STORE
// Main store definition with Zustand
// ============================================================

/**
 * Wishlist Store
 * 
 * Features:
 * - Persists to sessionStorage (same as cart)
 * - Prevents duplicate entries
 * - Provides isInWishlist for quick checks
 * 
 * @example
 * // In component
 * const { wishlist, addToWishlist, isInWishlist } = useWishlistStore();
 * 
 * // Add to wishlist
 * addToWishlist({ id: '123', title: 'Phone', price: 50000, image: '...' });
 * 
 * // Check if product is wishlisted
 * const isSaved = isInWishlist('123');
 */
export const useWishlistStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      // Initial state
      wishlist: [],
      wishQuantity: 0,

      // ============================================================
      // ADD TO WISHLIST
      // ============================================================
      
      /**
       * Add product to wishlist
       * - Prevents duplicate entries (won't add if already exists)
       * - Updates wishQuantity automatically
       * 
       * @param {ProductInWishlist} product - Product to add
       */
      addToWishlist: (product) => {
        set((state) => {
          // Check if product already exists in wishlist
          const exists = state.wishlist.some((item) => item.id === product.id);
          
          if (exists) {
            // Product already in wishlist, no changes
            return { wishlist: state.wishlist, wishQuantity: state.wishlist.length };
          }
          
          // Add new product and update quantity
          return {
            wishlist: [...state.wishlist, product],
            wishQuantity: state.wishlist.length + 1,
          };
        });
      },

      // ============================================================
      // REMOVE FROM WISHLIST
      // ============================================================
      
      /**
       * Remove product from wishlist
       * - Does nothing if product doesn't exist
       * - Updates wishQuantity automatically
       * 
       * @param {string} id - Product ID to remove
       */
      removeFromWishlist: (id) => {
        set((state) => {
          // Check if product exists in wishlist
          const exists = state.wishlist.some((item) => item.id === id);
          
          if (!exists) {
            // Product not in wishlist, no changes
            return { wishlist: state.wishlist, wishQuantity: state.wishlist.length };
          }
          
          // Remove product and update quantity
          const newWishlist = state.wishlist.filter((item) => item.id !== id);
          return { wishlist: newWishlist, wishQuantity: newWishlist.length };
        });
      },

      // ============================================================
      // SET WISHLIST
      // ============================================================
      
      /**
       * Set entire wishlist from API response
       * Used when syncing with server-side wishlist
       * Replaces local wishlist with server data
       * 
       * @param {ProductInWishlist[]} wishlist - Products from API
       */
      setWishlist: (wishlist) => {
        set({ wishlist: [...wishlist], wishQuantity: wishlist.length });
      },

      // ============================================================
      // CLEAR WISHLIST
      // ============================================================
      
      /**
       * Clear all products from wishlist
       * Resets wishlist to empty state
       */
      clearWishlist: () => {
        set({ wishlist: [], wishQuantity: 0 });
      },

      // ============================================================
      // CHECK IF IN WISHLIST
      // ============================================================
      
      /**
       * Check if a product is in the wishlist
       * Fast lookup using some()
       * 
       * @param {string} id - Product ID to check
       * @returns {boolean} True if product is in wishlist
       * 
       * @example
       * const isSaved = isInWishlist('product-123');
       * // Returns true if product-123 is in wishlist
       */
      isInWishlist: (id) => {
        return get().wishlist.some((item) => item.id === id);
      },
    }),
    {
      // Persistence configuration
      name: "wishlist-storage",        // Storage key name
      storage: createJSONStorage(() => sessionStorage),  // Use sessionStorage
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
 * Wishlist in sessionStorage means:
 * ✅ Wishlist survives page refresh
 * ✅ Wishlist persists while browsing the site
 * ❌ Wishlist is cleared when browser tab is closed
 * 
 * This is often acceptable for wishlists since:
 * - Users typically browse on single device/session
 * - Server-side wishlist can be synced when user logs in
 * - Maintains privacy (shared computers won't see wishlist)
 */
