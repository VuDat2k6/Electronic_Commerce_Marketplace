"use client";

import {
  Bell,
  ChevronDown,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  PackageCheck,
  Phone,
  Search,
  ShoppingCart,
  Store,
  UserCircle,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useProductStore } from "@/app/_zustand/store";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import { clearPersistedSessionStores } from "@/lib/clientSessionStores";
import { clearBackendTokenCache } from "@/lib/api";

const categories = [
  { label: "Smartphones", href: "/shop?category=smartphones" },
  { label: "Laptops", href: "/shop?category=laptops" },
  { label: "Tablets", href: "/shop?category=tablets" },
  { label: "Audio", href: "/shop?category=audio" },
  { label: "Cameras", href: "/shop?category=cameras" },
  { label: "Smart Watches", href: "/shop?category=smart-watches" },
  { label: "Gaming", href: "/shop?category=gaming" },
  { label: "Accessories", href: "/shop?category=accessories" },
];

export function Header() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [liveAccount, setLiveAccount] = useState<{
    email?: string | null;
    role?: string | null;
    shopStatus?: string | null;
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isAuthenticated = status === "authenticated" && Boolean(user);
  const allQuantity = useProductStore((state) => state.allQuantity);
  const wishQuantity = useWishlistStore((state) => state.wishQuantity);
  const accountRole = liveAccount?.role || user?.role;
  const accountShopStatus = liveAccount?.shopStatus || user?.shopStatus;
  const accountEmail = liveAccount?.email || user?.email;
  const isActiveSeller = accountRole === "seller" && accountShopStatus === "ACTIVE";
  const accountHref =
    accountRole === "admin"
      ? "/admin"
      : accountRole === "seller"
        ? isActiveSeller
          ? "/seller/dashboard"
          : "/seller/status"
        : "/account/orders";
  const accountLabel =
    accountRole === "admin"
      ? "Admin dashboard"
      : accountRole === "seller"
        ? isActiveSeller
          ? "Seller dashboard"
          : "Seller status"
        : "My orders";

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (status !== "authenticated" || !user?.id) {
      setLiveAccount(null);
      return;
    }

    const syncAccountStatus = async () => {
      try {
        const res = await fetch("/api/account/status", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        const currentUser = data?.user;
        if (!currentUser || cancelled) return;

        setLiveAccount({
          email: currentUser.email,
          role: currentUser.role,
          shopStatus: currentUser.shopStatus,
        });

        if (
          currentUser.role !== user.role ||
          currentUser.shopStatus !== user.shopStatus
        ) {
          clearBackendTokenCache();
          await update({
            role: currentUser.role,
            shopStatus: currentUser.shopStatus,
          });
        }
      } catch {
        // Keep the existing session UI if the lightweight status check fails.
      }
    };

    syncAccountStatus();

    return () => {
      cancelled = true;
    };
  }, [status, update, user?.id, user?.role, user?.shopStatus]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;
      router.push(`/search?search=${encodeURIComponent(query)}`);
      setSearchQuery("");
      setIsMobileSearchOpen(false);
      searchInputRef.current?.blur();
      mobileSearchInputRef.current?.blur();
    },
    [router, searchQuery],
  );

  const handleSignOut = useCallback(async () => {
    clearBackendTokenCache();
    clearPersistedSessionStores();
    await signOut({ redirect: false, callbackUrl: "/" });
    window.location.replace("/");
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 bg-white shadow-md will-change-transform"
    >
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white">
        <motion.div
          className="absolute inset-0 bg-white/10"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
          style={{ backgroundSize: "200% 200%" }}
        />
        <div className="relative z-10 mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-xs sm:text-sm">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Official electronics marketplace</span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              +84 337 879 184
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Mail className="h-3.5 w-3.5" />
              info@tfdtronic.com
            </span>
          </div>
          {status === "loading" ? (
            <span className="h-4 w-24 animate-pulse rounded bg-white/25" />
          ) : isAuthenticated ? (
            <span className="hidden max-w-[260px] truncate sm:block">Signed in as {accountEmail}</span>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="transition-colors hover:text-purple-100">
                Login
              </Link>
              <span className="text-purple-200">|</span>
              <Link href="/register" className="transition-colors hover:text-purple-100">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:gap-6">
        <button
          type="button"
          disabled={!isInteractive}
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-purple-700 transition-colors hover:bg-purple-50 disabled:cursor-wait disabled:opacity-60 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="TFDTRONIC home">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg shadow-purple-200">
            <ShoppingCart className="h-6 w-6 text-white" />
          </span>
          <span className="hidden bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-xl font-black text-transparent sm:inline">
            TFDTRONIC
          </span>
        </Link>

        <form onSubmit={handleSearch} className="relative mx-auto hidden w-full max-w-2xl md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="search"
            disabled={!isInteractive}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-12 w-full rounded-full border-2 border-gray-100 bg-gray-50 pl-11 pr-32 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
            placeholder="Search phones, laptops, audio..."
            aria-label="Search products"
          />
          <button
            type="submit"
            disabled={!isInteractive}
            className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 text-sm font-bold text-white shadow-md transition hover:from-purple-700 hover:to-pink-600 disabled:cursor-wait disabled:opacity-60"
          >
            Search
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={!isInteractive}
            onClick={() => {
              setIsMobileSearchOpen((open) => !open);
              window.setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-purple-700 hover:bg-purple-50 disabled:cursor-wait disabled:opacity-60 md:hidden"
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5" />
          </button>

          {isAuthenticated && (
            <div ref={accountRef} className="relative">
              <button
                type="button"
                disabled={!isInteractive}
                onClick={() => setIsAccountOpen((open) => !open)}
                className="flex h-12 items-center gap-2 rounded-full border border-purple-100 bg-purple-50/70 px-1.5 transition hover:border-purple-200 hover:bg-purple-100 disabled:cursor-wait disabled:opacity-60 sm:px-3"
                aria-expanded={isAccountOpen}
                aria-label="Open account menu"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-sm font-bold text-white">
                    {accountEmail?.charAt(0)?.toUpperCase() || "U"}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block text-xs text-gray-500">Account</span>
                  <span className="block max-w-32 truncate text-sm font-medium text-gray-900">
                    {accountEmail}
                  </span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
              </button>
              <AnimatePresence>
                {isAccountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-full mt-3 w-72 rounded-2xl border border-purple-100 bg-white p-2 shadow-2xl"
                  >
                    <div className="border-b border-gray-100 px-3 py-3">
                      <p className="truncate text-sm font-medium text-gray-950">{accountEmail}</p>
                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {accountRole || "buyer"} account
                        {accountRole === "seller" && accountShopStatus !== "ACTIVE"
                          ? ` - ${String(accountShopStatus || "pending").toLowerCase()}`
                          : ""}
                      </p>
                    </div>
                    <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase text-gray-400">
                      Account management
                    </p>
                      <AccountLink href={accountHref} icon={accountRole === "admin" ? LayoutDashboard : accountRole === "seller" ? Store : PackageCheck} onClick={() => setTimeout(() => setIsAccountOpen(false), 150)}>
                        {accountLabel}
                      </AccountLink>
                      {accountHref !== "/account/orders" && (
                        <AccountLink href="/account/orders" icon={PackageCheck} onClick={() => setTimeout(() => setIsAccountOpen(false), 150)}>
                          My orders
                        </AccountLink>
                      )}
                      <AccountLink href="/notifications" icon={Bell} onClick={() => setTimeout(() => setIsAccountOpen(false), 150)}>
                        Notifications
                      </AccountLink>
                      {accountRole === "buyer" && (
                        <AccountLink href="/become-seller" icon={Store} onClick={() => setTimeout(() => setIsAccountOpen(false), 150)}>
                        Become a seller
                      </AccountLink>
                    )}
                    <div className="my-2 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountOpen(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <HeaderIconLink href="/wishlist" icon={Heart} label="Wishlist" count={wishQuantity} />
          <HeaderIconLink href="/cart" icon={ShoppingCart} label="Cart" count={allQuantity} />
        </div>
      </div>

      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.form
            onSubmit={handleSearch}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white px-4 py-3 md:hidden"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-20 text-sm outline-none focus:border-purple-500"
                placeholder="Search electronics..."
              />
              <button type="submit" className="absolute right-1.5 top-1.5 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-4 text-sm font-semibold text-white">
                Go
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-gray-950/45 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed inset-y-0 left-0 z-[70] flex w-[290px] flex-col bg-white shadow-xl md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-purple-100 bg-gradient-to-r from-purple-600 to-pink-500 px-4 text-white">
                <span className="font-bold">TFDTRONIC</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-white/90 hover:bg-white/15"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <MobileLink href="/" label="Home" onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)} />
                <MobileLink href="/shop" label="All Products" onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)} />
                <p className="px-3 pb-2 pt-5 text-xs font-semibold uppercase text-gray-400">Categories</p>
                {categories.map((category) => (
                  <MobileLink
                    key={category.href}
                    href={category.href}
                    label={category.label}
                    onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)}
                  />
                ))}
              </div>
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Link
                      href={accountHref}
                      onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-medium text-gray-900"
                    >
                      <UserCircle className="h-4 w-4" />
                      {accountLabel}
                    </Link>
                    {accountHref !== "/account/orders" && (
                      <Link
                        href="/account/orders"
                        onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-medium text-gray-900"
                      >
                        <PackageCheck className="h-4 w-4" />
                        My orders
                      </Link>
                    )}
                    {accountRole === "buyer" && (
                      <Link
                        href="/become-seller"
                        onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)}
                      className="flex items-center justify-center gap-2 rounded-full border border-purple-200 bg-white py-2.5 text-sm font-semibold text-purple-700"
                      >
                        <Store className="h-4 w-4" />
                        Become a seller
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full rounded-lg py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" className="rounded-lg border border-gray-200 bg-white py-2.5 text-center text-sm font-medium">
                      Login
                    </Link>
                    <Link href="/register" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 py-2.5 text-center text-sm font-medium text-white">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function HeaderIconLink({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: typeof Heart;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
      aria-label={`${label}${count > 0 ? `, ${count} items` : ""}`}
    >
      <Icon className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-1 text-[11px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function AccountLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof Store;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-purple-700"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function MobileLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-700"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </Link>
  );
}

export default Header;
