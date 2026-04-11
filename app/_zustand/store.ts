import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================
// ProductInCart Type - Sản phẩm trong giỏ hàng
// ============================================
export type ProductInCart = {
  id: string;
  title: string;
  price: number;
  image: string;
  amount: number;
  merchantId?: string;
  merchantName?: string;
  slug?: string;
  maxStock?: number; // Số lượng tối đa trong kho
};

// ============================================
// CartGroup Type - Nhóm sản phẩm theo merchant
// ============================================
export type CartGroup = {
  merchantId: string;
  merchantName: string;
  items: ProductInCart[];
  subtotal: number;
  shippingFee: number;
};

// ============================================
// State Type - Trạng thái cart
// ============================================
export type State = {
  products: ProductInCart[];
  allQuantity: number;
  total: number;
};

// ============================================
// Actions Type - Các hành động
// ============================================
export type Actions = {
  addToCart: (newProduct: ProductInCart) => void;
  removeFromCart: (id: string) => void;
  updateCartAmount: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartGroups: () => CartGroup[];
  getCartTotal: () => { subtotal: number; shipping: number; tax: number; grandTotal: number };
  isInCart: (id: string) => boolean;
  getProductAmount: (id: string) => number;
};

// ============================================
// Helper: Tính tổng từ danh sách sản phẩm
// ============================================
function calculateTotals(products: ProductInCart[]) {
  return products.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.amount,
      total: acc.total + item.amount * item.price,
    }),
    { quantity: 0, total: 0 }
  );
}

// ============================================
// Cart Store - Quản lý giỏ hàng với persistence
// ============================================
export const useProductStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      products: [],
      allQuantity: 0,
      total: 0,

      // Thêm sản phẩm vào giỏ hàng
      addToCart: (newProduct) => {
        set((state) => {
          const existingIndex = state.products.findIndex(
            (item) => item.id === newProduct.id
          );

          let updatedProducts: ProductInCart[];

          if (existingIndex === -1) {
            // Thêm sản phẩm mới
            updatedProducts = [...state.products, newProduct];
          } else {
            // Cập nhật số lượng nếu đã tồn tại
            const existing = state.products[existingIndex];
            const newAmount = existing.amount + (newProduct.amount || 1);
            
            // Kiểm tra stock nếu có maxStock
            const validAmount = newProduct.maxStock
              ? Math.min(newAmount, newProduct.maxStock)
              : newAmount;

            updatedProducts = state.products.map((product, index) =>
              index === existingIndex
                ? { ...product, amount: validAmount }
                : product
            );
          }

          // Tự động tính tổng
          const { quantity, total } = calculateTotals(updatedProducts);

          return {
            products: updatedProducts,
            allQuantity: quantity,
            total,
          };
        });
      },

      // Xóa sản phẩm khỏi giỏ hàng
      removeFromCart: (id) => {
        set((state) => {
          const updatedProducts = state.products.filter(
            (product) => product.id !== id
          );
          const { quantity, total } = calculateTotals(updatedProducts);

          return {
            products: updatedProducts,
            allQuantity: quantity,
            total,
          };
        });
      },

      // Cập nhật số lượng sản phẩm
      updateCartAmount: (id, amount) => {
        set((state) => {
          // Nếu amount <= 0, xóa sản phẩm
          if (amount <= 0) {
            const updatedProducts = state.products.filter(
              (product) => product.id !== id
            );
            const { quantity, total } = calculateTotals(updatedProducts);
            return {
              products: updatedProducts,
              allQuantity: quantity,
              total,
            };
          }

          // Tìm sản phẩm và kiểm tra stock
          const product = state.products.find((p) => p.id === id);
          if (!product) return state;

          const validAmount = product.maxStock
            ? Math.min(amount, product.maxStock)
            : amount;

          const updatedProducts = state.products.map((p) =>
            p.id === id ? { ...p, amount: validAmount } : p
          );
          const { quantity, total } = calculateTotals(updatedProducts);

          return {
            products: updatedProducts,
            allQuantity: quantity,
            total,
          };
        });
      },

      // Xóa toàn bộ giỏ hàng
      clearCart: () => {
        set({
          products: [],
          allQuantity: 0,
          total: 0,
        });
      },

      // Nhóm sản phẩm theo merchant
      getCartGroups: () => {
        const state = get();
        const groupsMap = new Map<string, CartGroup>();

        for (const item of state.products) {
          const merchantId = item.merchantId || "default";
          const merchantName = item.merchantName || "Unknown Shop";
          const shippingFee = 500; // $5.00 mặc định (cents)

          if (!groupsMap.has(merchantId)) {
            groupsMap.set(merchantId, {
              merchantId,
              merchantName,
              items: [],
              subtotal: 0,
              shippingFee,
            });
          }

          const group = groupsMap.get(merchantId)!;
          group.items.push(item);
          group.subtotal += item.amount * item.price;
        }

        return Array.from(groupsMap.values());
      },

      // Tính tổng đơn hàng
      getCartTotal: () => {
        const groups = get().getCartGroups();
        const subtotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
        const shipping = groups.reduce((sum, g) => sum + g.shippingFee, 0);
        const tax = Math.round(subtotal * 0.05); // 5% tax
        const grandTotal = subtotal + shipping + tax;

        return { subtotal, shipping, tax, grandTotal };
      },

      // Kiểm tra sản phẩm có trong giỏ hàng không
      isInCart: (id) => {
        return get().products.some((p) => p.id === id);
      },

      // Lấy số lượng của một sản phẩm trong giỏ
      getProductAmount: (id) => {
        const product = get().products.find((p) => p.id === id);
        return product?.amount || 0;
      },
    }),
    {
      name: "products-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
