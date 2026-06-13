// *********************
// Role of the component: Component that displays current page location in the application 
// Name of the component: Breadcrumb.tsx
// Developer: Vu Dat
// Version: 1.0
// Component call: <Breadcrumb />
// Input parameters: No input parameters
// Output: Page location in the application
// *********************

import Link from "next/link";
import React from "react";
import { FaHouse } from "react-icons/fa6";
import { ChevronRight } from "lucide-react";

const Breadcrumb = () => {
  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto pb-2">
      <ol className="flex min-w-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-zinc-500 sm:text-base">
        <li className="flex items-center">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">
            <FaHouse className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </li>
        <li className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-zinc-300" />
          <Link href="/shop" className="rounded-full px-2 py-1 hover:bg-zinc-100 hover:text-zinc-950">
            Shop
          </Link>
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
          <Link href="/shop" className="truncate rounded-full px-2 py-1 text-zinc-900 hover:bg-zinc-100">
            All products
          </Link>
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumb;
