import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    : null;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          image: user.image,
          role: user.role,
          shopStatus: user.shopStatus,
        };
      },
    }),
    ...(googleProvider ? [googleProvider] : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider !== "google") return true;

      const email = String(user?.email || profile?.email || "").trim().toLowerCase();
      if (!email || profile?.email_verified !== true) return false;

      const linkedAccount = await prisma.authAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        include: { user: true },
      });

      const existingEmailUser = await prisma.user.findUnique({ where: { email } });
      if (existingEmailUser && !linkedAccount) {
        return false;
      }

      const databaseUser = linkedAccount
        ? await prisma.user.update({
            where: { id: linkedAccount.userId },
            data: {
              name: user.name || linkedAccount.user.name,
              image: user.image || linkedAccount.user.image,
              emailVerified: linkedAccount.user.emailVerified || new Date(),
            },
          })
        : await prisma.user.create({
            data: {
              email,
              name: user.name || email,
              image: user.image || null,
              emailVerified: new Date(),
              role: "buyer",
            },
          });

      await prisma.authAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        update: {
          expiresAt: account.expires_at || null,
          tokenType: account.token_type || null,
          scope: account.scope || null,
        },
        create: {
          userId: databaseUser.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          type: account.type,
          expiresAt: account.expires_at || null,
          tokenType: account.token_type || null,
          scope: account.scope || null,
        },
      });

      Object.assign(user, {
        id: databaseUser.id,
        email: databaseUser.email,
        name: databaseUser.name || databaseUser.email,
        image: databaseUser.image,
        role: databaseUser.role,
        shopStatus: databaseUser.shopStatus,
      });

      return true;
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.shopStatus = user.shopStatus;
      }
      if (trigger === "update" && token.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { role: true, shopStatus: true },
        });
        if (currentUser) {
          token.role = currentUser.role;
          token.shopStatus = currentUser.shopStatus;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.shopStatus = token.shopStatus as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
