"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// ============================================================
// PRISMA CLIENT SINGLETON
// ============================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

// ============================================================
// PRODUCT ACTIONS
// ============================================================

/**
 * Create a new product (seller only)
 */
export async function createProduct(
  data: {
    title: string;
    slug: string;
    mainImage: string;
    price: number;
    description: string;
    manufacturer: string;
    inStock: number;
    categoryId: string;
    sellerId: string;
  }
): Promise<ActionResult<any>> {
  try {
    // Validate required fields
    if (!data.title || !data.slug || !data.sellerId || !data.categoryId) {
      return { success: false, error: "Missing required fields" };
    }

    // Check if slug already exists
    const existing = await prisma.product.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return { success: false, error: "A product with this slug already exists" };
    }

    const product = await prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        mainImage: data.mainImage || "/placeholder.jpg",
        price: data.price || 0,
        description: data.description || "",
        manufacturer: data.manufacturer || "",
        inStock: data.inStock || 0,
        categoryId: data.categoryId,
        sellerId: data.sellerId,
      },
    });

    revalidatePath("/shop");
    revalidatePath("/seller/products");

    return { success: true, data: product, message: "Product created successfully" };
  } catch (error) {
    console.error("createProduct error:", error);
    return { success: false, error: "Failed to create product" };
  }
}

/**
 * Update an existing product (seller only)
 */
export async function updateProduct(
  productId: string,
  data: Partial<{
    title: string;
    slug: string;
    mainImage: string;
    price: number;
    description: string;
    manufacturer: string;
    inStock: number;
    categoryId: string;
  }>,
  sellerId: string
): Promise<ActionResult<any>> {
  try {
    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (product.sellerId !== sellerId) {
      return { success: false, error: "You do not have permission to update this product" };
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== product.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        return { success: false, error: "A product with this slug already exists" };
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data,
    });

    revalidatePath("/shop");
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/seller/products");

    return { success: true, data: updated, message: "Product updated successfully" };
  } catch (error) {
    console.error("updateProduct error:", error);
    return { success: false, error: "Failed to update product" };
  }
}

/**
 * Delete a product (seller only)
 */
export async function deleteProduct(
  productId: string,
  sellerId: string
): Promise<ActionResult> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (product.sellerId !== sellerId) {
      return { success: false, error: "You do not have permission to delete this product" };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/shop");
    revalidatePath("/seller/products");

    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("deleteProduct error:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

// ============================================================
// WISHLIST ACTIONS
// ============================================================

/**
 * Add product to user's wishlist
 */
export async function addToWishlist(
  userId: string,
  productId: string
): Promise<ActionResult> {
  try {
    if (!userId || !productId) {
      return { success: false, error: "Missing user or product information" };
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      return { success: false, error: "Product is already in your wishlist" };
    }

    await prisma.wishlist.create({
      data: { userId, productId },
    });

    revalidatePath("/wishlist");

    return { success: true, message: "Added to wishlist" };
  } catch (error) {
    console.error("addToWishlist error:", error);
    return { success: false, error: "Failed to add to wishlist" };
  }
}

/**
 * Remove product from user's wishlist
 */
export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<ActionResult> {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId, productId },
    });

    revalidatePath("/wishlist");

    return { success: true, message: "Removed from wishlist" };
  } catch (error) {
    console.error("removeFromWishlist error:", error);
    return { success: false, error: "Failed to remove from wishlist" };
  }
}

/**
 * Clear all items in user's wishlist
 */
export async function clearWishlist(userId: string): Promise<ActionResult> {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId },
    });

    revalidatePath("/wishlist");

    return { success: true, message: "Wishlist cleared" };
  } catch (error) {
    console.error("clearWishlist error:", error);
    return { success: false, error: "Failed to clear wishlist" };
  }
}

// ============================================================
// ORDER ACTIONS (for sellers updating order status)
// ============================================================

/**
 * Update order item status (seller only)
 */
export async function updateOrderItemStatus(
  orderItemId: string,
  newStatus: "processing" | "shipped" | "delivered" | "canceled",
  sellerId: string
): Promise<ActionResult<any>> {
  return { success: false, error: "Not implemented. Order_item does not have a status field." };
}

/**
 * Cancel an order item (seller only)
 */
export async function cancelOrderItem(
  orderItemId: string,
  reason: string,
  sellerId: string
): Promise<ActionResult<any>> {
  return { success: false, error: "Not implemented. Order_item does not have status/cancelReason fields." };
}

// ============================================================
// SHOP / SELLER PROFILE ACTIONS
// ============================================================

/**
 * Update seller shop information
 */
export async function updateShopInfo(
  userId: string,
  data: {
    shopName?: string;
    shopDescription?: string;
    shopPhone?: string;
    shopAddress?: string;
  }
): Promise<ActionResult<any>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "seller" && user.role !== "admin") {
      return { success: false, error: "Only sellers can update shop information" };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        shopName: data.shopName ?? user.shopName,
        shopDescription: data.shopDescription ?? user.shopDescription,
        shopPhone: data.shopPhone ?? user.shopPhone,
        shopAddress: data.shopAddress ?? user.shopAddress,
      },
    });

    revalidatePath("/seller/settings");
    revalidatePath(`/seller/${userId}`);

    return { success: true, data: updated, message: "Shop information updated" };
  } catch (error) {
    console.error("updateShopInfo error:", error);
    return { success: false, error: "Failed to update shop information" };
  }
}

// ============================================================
// USER PROFILE ACTIONS
// ============================================================

/**
 * Update user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return { success: false, error: "User not found or does not have a password" };
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    const hashedNew = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNew },
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("changePassword error:", error);
    return { success: false, error: "Failed to change password" };
  }
}

// ============================================================
// NOTIFICATION ACTIONS
// ============================================================

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    if (notification.userId !== userId) {
      return { success: false, error: "You do not have permission" };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    revalidatePath("/notifications");

    return { success: true };
  } catch (error) {
    console.error("markNotificationAsRead error:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<ActionResult> {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/notifications");

    return { success: true, message: "All notifications marked as read" };
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error);
    return { success: false, error: "Failed to mark all notifications as read" };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    if (notification.userId !== userId) {
      return { success: false, error: "You do not have permission" };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    revalidatePath("/notifications");

    return { success: true, message: "Notification deleted" };
  } catch (error) {
    console.error("deleteNotification error:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

/**
 * Approve seller shop (admin only)
 */
export async function approveSellerShop(
  sellerId: string,
  adminId: string
): Promise<ActionResult<any>> {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== "admin") {
      return { success: false, error: "Only admins can approve seller shops" };
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return { success: false, error: "Seller not found" };
    }

    const updated = await prisma.user.update({
      where: { id: sellerId },
      data: {
        shopStatus: "ACTIVE",
        shopApprovedAt: new Date(),
      },
    });

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: sellerId,
        title: "Shop Approved! 🎉",
        message: `Your shop "${seller.shopName || "TFDTRONIC Store"}" has been approved and is now active.`,
        type: "PROMOTION",
        priority: "HIGH",
      },
    });

    revalidatePath("/admin/sellers");
    revalidatePath("/notifications");

    return { success: true, data: updated, message: "Seller shop approved" };
  } catch (error) {
    console.error("approveSellerShop error:", error);
    return { success: false, error: "Failed to approve seller shop" };
  }
}

/**
 * Suspend seller shop (admin only)
 */
export async function suspendSellerShop(
  sellerId: string,
  adminId: string,
  reason: string
): Promise<ActionResult<any>> {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== "admin") {
      return { success: false, error: "Only admins can suspend seller shops" };
    }

    const updated = await prisma.user.update({
      where: { id: sellerId },
      data: {
        shopStatus: "SUSPENDED",
      },
    });

    await prisma.notification.create({
      data: {
        userId: sellerId,
        title: "Shop Suspended",
        message: reason || "Your shop has been suspended. Please contact support for more information.",
        type: "SYSTEM_ALERT",
        priority: "HIGH",
      },
    });

    revalidatePath("/admin/sellers");
    revalidatePath("/notifications");

    return { success: true, data: updated, message: "Seller shop suspended" };
  } catch (error) {
    console.error("suspendSellerShop error:", error);
    return { success: false, error: "Failed to suspend seller shop" };
  }
}

// ============================================================
// CATEGORY ACTIONS
// ============================================================

/**
 * Create a new category (admin only)
 */
export async function createCategory(
  name: string,
  adminId: string
): Promise<ActionResult<any>> {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== "admin") {
      return { success: false, error: "Only admins can create categories" };
    }

    if (!name || name.trim().length === 0) {
      return { success: false, error: "Category name is required" };
    }

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return { success: false, error: "Category already exists" };
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/shop");

    return { success: true, data: category, message: "Category created" };
  } catch (error) {
    console.error("createCategory error:", error);
    return { success: false, error: "Failed to create category" };
  }
}

/**
 * Delete a category (admin only)
 */
export async function deleteCategory(
  categoryId: string,
  adminId: string
): Promise<ActionResult> {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== "admin") {
      return { success: false, error: "Only admins can delete categories" };
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${productCount} products. Please remove or reassign products first.`,
      };
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/shop");

    return { success: true, message: "Category deleted" };
  } catch (error) {
    console.error("deleteCategory error:", error);
    return { success: false, error: "Failed to delete category" };
  }
}