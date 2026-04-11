import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================
// ProductInWishlist Type - Sản phẩm trong wishlist
// ============================================
export type ProductInWishlist = {
  id: string;
  title: string;
  price: number;
  image: string;
  slug?: string;
  stockAvailabillity?: number;
};

// ============================================
// State Type - Trạng thái store
// ============================================
export type State = {
  wishlist: ProductInWishlist[];
  wishQuantity: number;
};

// ============================================
// Actions Type - Các hành động
// ============================================
export type Actions = {
  addToWishlist: (product: ProductInWishlist) => void;
  removeFromWishlist: (id: string) => void;
  setWishlist: (wishlist: ProductInWishlist[]) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
};

// ============================================
// Wishlist Store - Quản lý wishlist với persistence
// ============================================
export const useWishlistStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      wishlist: [],
      wishQuantity: 0,

      // Thêm sản phẩm vào wishlist
      addToWishlist: (product) => {
        set((state) => {
          // Kiểm tra xem sản phẩm đã có trong wishlist chưa
          const exists = state.wishlist.some((item) => item.id === product.id);
          
          if (exists) {
            // Nếu đã tồn tại, không thay đổi gì
            return { wishlist: state.wishlist, wishQuantity: state.wishlist.length };
          }
          
          // Thêm sản phẩm mới và cập nhật số lượng
          return {
            wishlist: [...state.wishlist, product],
            wishQuantity: state.wishlist.length + 1,
          };
        });
      },

      // Xóa sản phẩm khỏi wishlist
      removeFromWishlist: (id) => {
        set((state) => {
          // Kiểm tra xem sản phẩm có trong wishlist không
          const exists = state.wishlist.some((item) => item.id === id);
          
          if (!exists) {
            // Nếu không tồn tại, không thay đổi gì
            return { wishlist: state.wishlist, wishQuantity: state.wishlist.length };
          }
          
          // Xóa sản phẩm và cập nhật số lượng
          const newWishlist = state.wishlist.filter((item) => item.id !== id);
          return { wishlist: newWishlist, wishQuantity: newWishlist.length };
        });
      },

      // Set toàn bộ wishlist (thường dùng khi fetch từ API)
      setWishlist: (wishlist) => {
        set({ wishlist: [...wishlist], wishQuantity: wishlist.length });
      },

      // Xóa toàn bộ wishlist
      clearWishlist: () => {
        set({ wishlist: [], wishQuantity: 0 });
      },

      // Kiểm tra sản phẩm có trong wishlist không
      isInWishlist: (id) => {
        return get().wishlist.some((item) => item.id === id);
      },
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
