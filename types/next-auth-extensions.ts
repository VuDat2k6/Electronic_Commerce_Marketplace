import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

// Helper type for session user with id and role
export type SessionUser = {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

// Helper function to safely get user id from session
export function getSessionUserId(session: any): string | undefined {
  return session?.user?.id;
}

// Helper function to check if user is admin
export function isAdmin(session: any): boolean {
  return session?.user?.role === "admin";
}

// Helper function to check if user is seller
export function isSeller(session: any): boolean {
  return session?.user?.role === "seller";
}
