import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      role: string;
      shopStatus?: string;
    };
  }

  interface User {
    id: string;
    role: string;
    shopStatus?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    shopStatus?: string;
  }
}
