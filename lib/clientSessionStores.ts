export const CART_STORAGE_KEY = "products-storage";
export const WISHLIST_STORAGE_KEY = "wishlist-storage";
export const SESSION_STORE_OWNER_KEY = "marketplace-session-store-owner";

export function clearPersistedSessionStores() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(CART_STORAGE_KEY);
  window.sessionStorage.removeItem(WISHLIST_STORAGE_KEY);
}

export function getSessionStoreOwner() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_STORE_OWNER_KEY);
}

export function setSessionStoreOwner(owner: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_STORE_OWNER_KEY, owner);
}
