// *********************
// Role of the component: Header component
// Name of the component: Header.tsx
// Developer: Vu Dat
// Version: 1.0
// Component call: <Header />
// Input parameters: no input parameters
// Output: Header component
// *********************

"use client";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import HeaderTop from "./HeaderTop";
import Image from "next/image";
import SearchInput from "./SearchInput";
import Link from "next/link";

import CartElement from "./CartElement";
import NotificationBell from "./NotificationBell";
import HeartElement from "./HeartElement";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";

const Header = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { setWishlist, wishQuantity } = useWishlistStore();

  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  };

  // getting all wishlist items by user id
  const getWishlistByUserId = async (id: string) => {
    const response = await apiClient.get(`/api/wishlist/${id}`, {
      cache: "no-store",
    });
    const wishlist = await response.json();
    const productArray: {
      id: string;
      title: string;
      price: number;
      image: string;
      slug: string;
      stockAvailabillity: number;
    }[] = [];

    wishlist.map((item: any) =>
      productArray.push({
        id: item?.product?.id,
        title: item?.product?.title,
        price: item?.product?.price,
        image: item?.product?.mainImage,
        slug: item?.product?.slug,
        stockAvailabillity: item?.product?.inStock,
      })
    );

    setWishlist(productArray);
  };

  // getting user by email so I can get his user id
  const getUserByEmail = async () => {
    if (session?.user?.email) {
      apiClient
        .get(`/api/users/email/${session?.user?.email}`, {
          cache: "no-store",
        })
        .then((response) => response.json())
        .then((data) => {
          getWishlistByUserId(data?.id);
        });
    }
  };

  useEffect(() => {
    getUserByEmail();
  }, [session?.user?.email]);

  return (
    <header className="bg-white">
      <HeaderTop />

      {/* Seller dashboard header */}
      {pathname.startsWith("/seller/") && pathname !== "/become-seller" && (
        <div className="flex justify-between h-20 bg-green-600 items-center px-6">
          <div className="flex items-center gap-6 w-full">
            <Link
              href="/"
              className="text-white font-bold text-lg flex items-center gap-2 whitespace-nowrap"
            >
              ← Về trang chủ
            </Link>

            {/* Đã bỏ nav seller ở đây để tránh trùng với SellerSidebar */}
            <div className="text-white text-sm hidden md:block">
              Seller Dashboard
            </div>
          </div>

          <div className="flex gap-x-5 items-center ml-4 flex-shrink-0">
            <span className="text-green-200 text-sm hidden sm:block">
              Seller Dashboard
            </span>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="w-10">
                <Image
                  src="/randomuser.jpg"
                  alt="profile"
                  width={30}
                  height={30}
                  className="w-full h-full rounded-full"
                />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link href="/seller/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link href="/seller/settings">Cài đặt shop</Link>
                </li>
                <li onClick={handleLogout}>
                  <a>Đăng xuất</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Normal header */}
      {pathname.startsWith("/admin") === false && !pathname.startsWith("/seller/") && (
        <div className="h-32 bg-white flex items-center justify-between px-16 max-[1320px]:px-16 max-md:px-6 max-lg:flex-col max-lg:gap-y-7 max-lg:justify-center max-lg:h-60 max-w-screen-2xl mx-auto">
          <Link href="/">
            <Image
              src="/TFDTRONIC-logo.png"
              width={200}
              height={80}
              alt="TFDTRONIC logo"
              className="relative right-5 max-[1023px]:w-56 h-auto"
              priority
            />
          </Link>
          <SearchInput />
          <div className="flex gap-x-10 items-center">
            {session?.user?.role === "seller" && (
              <Link
                href="/seller/dashboard"
                className="text-sm font-medium hover:underline text-green-600"
              >
                Seller Dashboard
              </Link>
            )}
            {session?.user?.role === "buyer" && (
              <Link
                href="/become-seller"
                className="text-sm font-medium hover:underline text-green-600"
              >
                Trở thành Seller
              </Link>
            )}
            <NotificationBell />
            <HeartElement wishQuantity={wishQuantity} />
            <CartElement />
          </div>
        </div>
      )}

      {/* Admin header */}
      {pathname.startsWith("/admin") === true && (
        <div className="flex justify-between h-32 bg-white items-center px-16 max-[1320px]:px-10  max-w-screen-2xl mx-auto max-[400px]:px-5">
          <Link href="/">
            <Image
              src="/TFDTRONIC-logo.png"
              width={130}
              height={52}
              alt="TFDTRONIC logo"
              className="w-56 h-auto"
            />
          </Link>
          <div className="flex gap-x-5 items-center">
            <NotificationBell />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="w-10">
                <Image
                  src="/randomuser.jpg"
                  alt="random profile photo"
                  width={30}
                  height={30}
                  className="w-full h-full rounded-full"
                />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link href="/admin">Dashboard</Link>
                </li>
                <li>
                  <a>Profile</a>
                </li>
                <li onClick={handleLogout}>
                  <a href="#">Logout</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;