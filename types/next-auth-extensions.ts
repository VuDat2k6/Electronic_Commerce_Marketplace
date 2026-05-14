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

/**
 * Retrieve the user's id from a NextAuth session object.
 *
 * @param session - NextAuth `Session` (or any object) that may contain `user.id`
 * @returns The `user.id` string if present, `undefined` otherwise
 */
export function getSessionUserId(session: any): string | undefined {
  return session?.user?.id;
}

/**
 * Determine whether the session's user has the "admin" role.
 *
 * @param session - A Session-like object (expected to have `user.role`)
 * @returns `true` if `session.user.role` equals `"admin"`, `false` otherwise
 */
export function isAdmin(session: any): boolean {
  return session?.user?.role === "admin";
}

/**
 * Determines whether the session's user has the "seller" role.
 *
 * @param session - Session object that may contain `user.role`
 * @returns `true` if `session.user.role` equals `"seller"`, `false` otherwise
 */
export function isSeller(session: any): boolean {
  return session?.user?.role === "seller";
}
