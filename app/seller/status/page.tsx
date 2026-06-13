import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock3, Home, PackageX, ShieldAlert, Store } from "lucide-react";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SellerStatusPage() {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/seller/status");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      role: true,
      shopName: true,
      shopStatus: true,
      shopCreatedAt: true,
      shopApprovedAt: true,
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/seller/status");
  }

  if (user.role !== "seller") {
    redirect("/become-seller");
  }

  if (user.shopStatus === "ACTIVE") {
    redirect("/seller/dashboard");
  }

  const isSuspended = user.shopStatus === "SUSPENDED";
  const Icon = isSuspended ? ShieldAlert : Clock3;

  return (
    <main className="min-h-[calc(100vh-15rem)] bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-14">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-xl">
        <div className={`px-8 py-8 text-white ${isSuspended ? "bg-gradient-to-r from-red-600 to-rose-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Icon className="h-9 w-9" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/75">Seller account</p>
              <h1 className="mt-1 text-3xl font-black">
                {isSuspended ? "Shop suspended" : "Shop awaiting approval"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                {isSuspended
                  ? "This shop is temporarily disabled by admin moderation."
                  : "Your seller application is still waiting for admin review."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-8">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatusFact label="Shop" value={user.shopName || "Unnamed shop"} />
              <StatusFact label="Account" value={user.email || "-"} />
              <StatusFact label="Status" value={user.shopStatus || "PENDING"} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
              <PackageX className="h-5 w-5 text-purple-600" />
              What is restricted
            </h2>
            <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
              <RestrictionItem text="Seller dashboard and analytics are locked." />
              <RestrictionItem text="Product creation, editing, and bulk upload are blocked." />
              <RestrictionItem text="Seller vouchers cannot be managed." />
              <RestrictionItem text="Public listings and checkout for this shop are unavailable." />
            </div>
          </div>

          <p className="text-sm leading-6 text-gray-600">
            {isSuspended
              ? "Contact platform support or wait for an admin to reactivate your shop. Existing order records are preserved for customer and seller history."
              : "You will be able to access seller tools after an admin approves your shop."}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-purple-700 hover:to-pink-600"
            >
              <Home className="h-4 w-4" />
              Back to store
            </Link>
            <Link
              href="/notifications"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              <Store className="h-4 w-4" />
              View notifications
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-gray-900" title={value}>
        {value}
      </p>
    </div>
  );
}

function RestrictionItem({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      {text}
    </div>
  );
}
