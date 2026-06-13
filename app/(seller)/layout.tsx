import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import SellerSidebar from "@/components/SellerSidebar";
import { prisma } from "@/lib/prisma";

/**
 * Renders the seller-only page layout and enforces that the current session belongs to a seller.
 *
 * @param children - Content displayed in the layout's main content area to the right of the seller sidebar
 * @returns The layout element containing the seller sidebar and a main area that wraps `children`
 */
export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions) as any;

  // If not logged in or not a seller, redirect
  if (!session) redirect("/login");
  if ((session?.user as any)?.role !== "seller") redirect("/become-seller");

  const seller = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { shopStatus: true },
  });

  if (seller?.shopStatus !== "ACTIVE") redirect("/seller/status");

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <SellerSidebar />
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
