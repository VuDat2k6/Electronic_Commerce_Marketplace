import { createHmac } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signBackendToken(payload: Record<string, unknown>, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${base64Url(signature)}`;
}

export async function GET() {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Backend token secret is not configured" }, { status: 500 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, shopStatus: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signBackendToken({
    id: session.user.id,
    sub: session.user.id,
    email: currentUser.email || session.user.email,
    role: currentUser.role || "buyer",
    shopStatus: currentUser.shopStatus || null,
    iat: now,
    exp: now + 5 * 60,
  }, secret);

  return NextResponse.json(
    { token },
    { headers: { "Cache-Control": "no-store" } }
  );
}
