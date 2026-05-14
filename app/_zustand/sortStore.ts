/**
 * Sort Store (Zustand)
 * 
 * Manages product sorting/ordering state.
 * Tracks current sort mode for product listings.
 * 
 * @module _zustand/sortStore
 * @requires zustand
 */

import { create } from "zustand";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Store state type
 * Current sort mode
 */
export type State = {
  sortBy: string;  // Current sort mode (e.g., 'defaultSort', 'lowPrice')
};

/**
 * Store actions type
 * Methods to change sort mode
 */
export type Actions = {
  changeSortBy: (mode: string) => void;  // Change sort mode
};

// ============================================================
// SORT STORE
// ============================================================

/**
 * Sort Store
 * 
 * Available sort modes (from backend):
 * - defaultSort: No specific ordering
 * - titleAsc: Sort by title A-Z
 * - titleDesc: Sort by title Z-A
 * - lowPrice: Sort by price (low to high)
 * - highPrice: Sort by price (high to low)
 * 
 * @example
 * // In component
 * const { sortBy, changeSortBy } = useSortStore();
 * 
 * // Sort dropdown
 * <select value={sortBy} onChange={(e) => changeSortBy(e.target.value)}>
 *   <option value="defaultSort">Default</option>
 *   <option value="lowPrice">Price: Low to High</option>
 *   <option value="highPrice">Price: High to Low</option>
 * </select>
 */
export const useSortStore = create<State & Actions>((set) => ({
  // Initial state: default sort
  sortBy: "defaultSort",

  /**
   * Change the sort mode
   * Updates the sortBy state with new mode
   * 
   * @param {string} mode - New sort mode
   */
  changeSortBy: (mode: string) => {
    set((state) => {
      return { sortBy: mode };
    });
  },
}));
