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

function signToken(payload: Record<string, unknown>, secret: string) {
  const encodedHeader = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  return `${encodedHeader}.${encodedPayload}.${base64Url(signature)}`;
}

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  const secret = process.env.CHAT_JWT_SECRET;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!secret) {
    return NextResponse.json({ error: "Chat token secret is not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Math.floor(Date.now() / 1000);
  const token = signToken({
    sub: user.id,
    iss: "tfdtronic-next",
    aud: "tfdtronic-chat",
    iat: now,
    exp: now + 5 * 60,
  }, secret);

  return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
