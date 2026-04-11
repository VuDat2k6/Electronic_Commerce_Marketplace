import React from "react";
import { getMerchantShop } from "../../../server/services/order.service";

interface ShopPageProps {
  params: Promise<{
    merchantId: string;
  }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { merchantId } = await params;
  let merchantName = "Unknown Shop";
  let merchantDescription = "";
  let products: Array<{
    id: string;
    title: string;
    price: number | string;
    inStock: number;
  }> = [];

  try {
    const { merchant, products: merchantProducts } = await getMerchantShop(merchantId);
    merchantName = (merchant as { name?: string }).name ?? merchantName;
    merchantDescription = (merchant as { description?: string }).description ?? "";
    products = merchantProducts as Array<{
      id: string;
      title: string;
      price: number | string;
      inStock: number;
    }>;
  } catch {
    // Keep page rendering even when merchant is not found.
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>{merchantName}</h1>
      <p>{merchantDescription || `Merchant ID: ${merchantId}`}</p>

      {products.length === 0 ? <p>No products available in this shop.</p> : null}

      {products.map((product) => (
        <section key={product.id} style={{ marginBottom: "12px" }}>
          <h3>{product.title}</h3>
          <p>Price: ${product.price}</p>
          <p>Stock: {product.inStock}</p>
        </section>
      ))}
    </main>
  );
}
