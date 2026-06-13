import { SectionTitle } from "@/components";
import { Loader } from "@/components/Loader";
import { CartModule } from "@/components/modules/cart";
import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

const CartPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/cart");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SectionTitle title="Cart" path="Home | Cart" />
      <div className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-800 sm:text-4xl mb-8">
            Your Cart
          </h1>
          <Suspense fallback={<Loader />}>
            <CartModule />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
