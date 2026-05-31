import { DashboardSidebar } from "@/components";
import { Bell, CreditCard, ShieldCheck, Store, Wrench } from "lucide-react";

const settingsGroups = [
  {
    title: "Marketplace Identity",
    icon: Store,
    items: [
      ["Marketplace name", "TFDTRONIC Electronics Marketplace"],
      ["Primary category focus", "Electronics, smart devices, accessories"],
      ["Support email", "info@tfdtronic.com"],
    ],
  },
  {
    title: "Commerce Controls",
    icon: CreditCard,
    items: [
      ["Cash on delivery", "Enabled"],
      ["Bank transfer QR", "Enabled"],
      ["Seller approval", "Required before selling"],
    ],
  },
  {
    title: "Moderation",
    icon: ShieldCheck,
    items: [
      ["Admin product removal", "Disabled"],
      ["Seller violation warnings", "Enabled"],
      ["Order snapshot preservation", "Enabled"],
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    items: [
      ["Buyer order confirmation", "Enabled"],
      ["Seller new-order alerts", "Enabled"],
      ["Admin system alerts", "Enabled"],
    ],
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start bg-gray-50 max-xl:flex-col">
      <DashboardSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Platform Settings</h1>
            <p className="mt-1 text-sm text-gray-500">Current operational configuration for the marketplace.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
            <Wrench className="h-4 w-4" />
            Read-only until settings persistence is added
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {settingsGroups.map((group) => (
            <section key={group.title} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <group.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{group.title}</h2>
              </div>

              <div className="divide-y divide-gray-100">
                {group.items.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                    <span className="text-right text-sm font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
