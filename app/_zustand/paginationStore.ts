/**
 * Pagination Store (Zustand)
 * 
 * Manages pagination state for product listing pages.
 * Used to track current page when browsing paginated content.
 * 
 * @module _zustand/paginationStore
 * @requires zustand
 */

import { create } from "zustand";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Store state type
 * Current page number
 */
export type State = {
  page: number;  // Current page number (1-indexed)
};

/**
 * Store actions type
 * Methods to navigate between pages
 */
export type Actions = {
  incrementPage: () => void;  // Go to next page
  decrementPage: () => void;  // Go to previous page
  setPage: (page: number) => void; // Set specific page
};

// ============================================================
// PAGINATION STORE
// ============================================================

/**
 * Pagination Store
 * 
 * Manages simple page navigation state
 * 
 * @example
 * // In component
 * const { page, incrementPage, decrementPage } = usePaginationStore();
 * 
 * // Navigation buttons
 * <button onClick={decrementPage}>Previous</button>
 * <span>Page {page}</span>
 * <button onClick={incrementPage}>Next</button>
 */
export const usePaginationStore = create<State & Actions>((set) => ({
  // Initial state: start at page 1
  page: 1,

  /**
   * Increment page number
   * Move to next page
   */
  incrementPage: () => {
    set((state: any) => {
      state.page = state.page + 1;
      return { page: state.page };
    });
  },

  /**
   * Decrement page number
   * Move to previous page
   * Prevents going below page 1
   */
  decrementPage: () => {
    set((state: any) => {
      if (state.page !== 1) {
        state.page = state.page - 1;
        return { page: state.page };
      }
      return { page: 1 };
    });
  },

  /**
   * Set specific page number
   */
  setPage: (page: number) => {
    set({ page });
  },
}));
