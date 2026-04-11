"use client";

import Link from "next/link";

interface WishItemProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug?: string;
  stockAvailabillity?: number;
  onRemove?: () => void;
}

export default function WishItem({
  id,
  title,
  price,
  image,
  slug,
  stockAvailabillity,
  onRemove,
}: WishItemProps) {
  return (
    <tr>
      <td>-</td>
      <td>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={image || "/product_placeholder.jpg"} 
          alt={title || "Product"} 
          className="w-14 h-14 object-cover mx-auto rounded" 
        />
      </td>
      <td className="text-left">
        <Link href={`/product/${slug || id}`} className="hover:text-blue-600">
          {title || "Unknown Product"}
        </Link>
      </td>
      <td>
        {stockAvailabillity !== undefined && stockAvailabillity > 0 ? (
          <span className="text-green-600">In stock</span>
        ) : (
          <span className="text-red-600">Out of stock</span>
        )}
      </td>
      <td>${((price || 0) / 100).toFixed(2)}</td>
      <td>
        <div className="flex gap-2 justify-center">
          <Link 
            href={`/product/${slug || id}`} 
            className="btn btn-sm btn-primary"
          >
            View
          </Link>
          {onRemove && (
            <button
              onClick={onRemove}
              className="btn btn-sm btn-error btn-outline"
            >
              Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
