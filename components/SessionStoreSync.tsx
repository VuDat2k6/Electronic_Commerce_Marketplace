"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CART_STORAGE_KEY,
  WISHLIST_STORAGE_KEY,
  clearPersistedSessionStores,
  getSessionStoreOwner,
  setSessionStoreOwner,
} from "@/lib/clientSessionStores";

const GUEST_OWNER = "guest";

export default function SessionStoreSync() {
  const { data: session, status } = useSession();
  const user = session?.user as { id?: string; email?: string } | undefined;
  const currentOwner =
    status === "authenticated"
      ? String(user?.id || user?.email || GUEST_OWNER)
      : GUEST_OWNER;

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    let cartSaveTimer: ReturnType<typeof setTimeout> | undefined;
    let wishlistSaveTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribeCart: (() => void) | undefined;
    let unsubscribeWishlist: (() => void) | undefined;

    const syncSessionStores = async () => {
      const [{ useProductStore }, { useWishlistStore }] = await Promise.all([
        import("@/app/_zustand/store"),
        import("@/app/_zustand/wishlistStore"),
      ]);

      if (cancelled) return;

      const previousOwner = getSessionStoreOwner();
      const hasLegacyPersistedData =
        !previousOwner &&
        (window.sessionStorage.getItem(CART_STORAGE_KEY) ||
          window.sessionStorage.getItem(WISHLIST_STORAGE_KEY));

      if ((previousOwner && previousOwner !== currentOwner) || hasLegacyPersistedData) {
        useProductStore.getState().clearCart();
        useWishlistStore.getState().clearWishlist();
        clearPersistedSessionStores();
      }

      if (status !== "authenticated") {
        setSessionStoreOwner(currentOwner);
        return;
      }

      const [cartResult, wishlistResult] = await Promise.allSettled([
        fetch("/api/account/cart", { cache: "no-store" }).then(async (response) => {
          if (!response.ok) throw new Error("Unable to load cart");
          return response.json();
        }),
        fetch("/api/account/wishlist", { cache: "no-store" }).then(async (response) => {
          if (!response.ok) throw new Error("Unable to load wishlist");
          return response.json();
        }),
      ]);

      if (cancelled) return;

      if (cartResult.status === "fulfilled") {
        useProductStore.getState().setCart(cartResult.value.items || []);
      } else {
        console.warn("Unable to hydrate cart", cartResult.reason);
      }

      if (wishlistResult.status === "fulfilled") {
        useWishlistStore.getState().setWishlist(wishlistResult.value.items || []);
      } else {
        console.warn("Unable to hydrate wishlist", wishlistResult.reason);
      }

      setSessionStoreOwner(currentOwner);

      const saveCart = (items: unknown[]) => {
        if (cancelled) return;
        if (cartSaveTimer) clearTimeout(cartSaveTimer);

        cartSaveTimer = setTimeout(() => {
          fetch("/api/account/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          }).catch((error) => {
            console.warn("Unable to persist cart", error);
          });
        }, 250);
      };

      const saveWishlist = (items: unknown[]) => {
        if (cancelled) return;
        if (wishlistSaveTimer) clearTimeout(wishlistSaveTimer);

        wishlistSaveTimer = setTimeout(() => {
          fetch("/api/account/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          }).catch((error) => {
            console.warn("Unable to persist wishlist", error);
          });
        }, 250);
      };

      unsubscribeCart = useProductStore.subscribe((state: any, previousState: any) => {
        if (state.products !== previousState.products) {
          saveCart(state.products);
        }
      });

      unsubscribeWishlist = useWishlistStore.subscribe((state: any, previousState: any) => {
        if (state.wishlist !== previousState.wishlist) {
          saveWishlist(state.wishlist);
        }
      });
    };

    syncSessionStores().catch((error) => {
      console.warn("Unable to synchronize session stores", error);
    });

    return () => {
      cancelled = true;
      if (cartSaveTimer) clearTimeout(cartSaveTimer);
      if (wishlistSaveTimer) clearTimeout(wishlistSaveTimer);
      unsubscribeCart?.();
      unsubscribeWishlist?.();
    };
  }, [currentOwner, status]);

  return null;
}
