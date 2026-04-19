import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    // Admin routes — chỉ admin
    if (path.startsWith("/admin")) {
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Seller dashboard/management routes — chỉ seller đã được duyệt
    // Lưu ý: /seller/[id] (public shop page) KHÔNG bị bảo vệ ở đây
    // vì nó là public route và không match pattern này
    if (
      path.startsWith("/seller/dashboard") ||
      path.startsWith("/seller/analytics") ||
      path.startsWith("/seller/products") ||
      path.startsWith("/seller/orders") ||
      path.startsWith("/seller/vouchers") ||
      path.startsWith("/seller/settings") ||
      path.startsWith("/seller/bulk-upload")
    ) {
      if (role !== "seller") {
        return NextResponse.redirect(new URL("/become-seller", req.url));
      }
    }

    // Profile routes — phải đăng nhập (bất kỳ role nào)
    if (path.startsWith("/profile")) {
      if (!role) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Admin luôn cần token hợp lệ
        if (path.startsWith("/admin")) {
          return !!token && token.role === "admin";
        }
        // Seller dashboard cần token
        if (
          path.startsWith("/seller/dashboard") ||
          path.startsWith("/seller/analytics") ||
          path.startsWith("/seller/products") ||
          path.startsWith("/seller/orders") ||
          path.startsWith("/seller/vouchers") ||
          path.startsWith("/seller/settings")
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/dashboard",
    "/seller/dashboard/:path*",
    "/seller/analytics/:path*",
    "/seller/products/:path*",
    "/seller/orders/:path*",
    "/seller/vouchers/:path*",
    "/seller/settings",
    "/seller/bulk-upload",
    "/profile/:path*",
  ],
};
