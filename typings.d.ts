interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  rating: number;
  description: string;
  mainImage: string;
  manufacturer: string;
  categoryId: string;
  category?: { name: string };
  inStock: number;
  sellerId: string;  // ← đổi từ merchantId
  seller?: User;     // ← thêm
}

interface User {
  id: string;
  email: string;
  password: string | null;
  role: "buyer" | "seller" | "admin";
  shopName?: string | null;
  shopDescription?: string | null;
  shopPhone?: string | null;
  shopAddress?: string | null;
  shopStatus?: "PENDING" | "ACTIVE" | "SUSPENDED";
  shopApprovedAt?: string | null;
  shopCreatedAt?: string | null;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  quantity: number;
  priceAtPurchase: number;
  product?: Product;
  order?: Order;
  seller?: User;
}

interface Order {
  id: string;
  buyerId?: string | null;
  adress: string;
  apartment: string;
  company: string;
  dateTime: string;
  email: string;
  lastname: string;
  name: string;
  phone: string;
  postalCode: string;
  status: "processing" | "canceled" | "delivered";
  city: string;
  country: string;
  orderNotice?: string;
  total: number;
  items?: OrderItem[];
}

interface SellerInfo {
  id: string;
  email: string;
  shopName: string;
  shopDescription?: string | null;
  shopPhone?: string | null;
  shopAddress?: string | null;
  shopStatus: "PENDING" | "ACTIVE" | "SUSPENDED";
  productCount?: number;
}

interface SingleProductPageProps {
  params: {
    id: string;
    productSlug: string;
  };
}

type ProductInWishlist = {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  stockAvailabillity: number;
};

interface OtherImages {
  imageID: number;
  productID: number;
  image: string;
}

interface Category {
  id: string;
  name: string;
}

interface WishListItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      role: string;
    };
  }

  interface User {
    id: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
