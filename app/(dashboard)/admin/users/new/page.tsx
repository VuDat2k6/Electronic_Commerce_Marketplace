"use client";

import { DashboardSidebar } from "@/components";
import { sanitizeFormData } from "@/lib/form-sanitize";
import apiClient from "@/lib/api";
import { isValidEmailAddressFormat } from "@/lib/utils";
import { ArrowLeft, Info, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import toast from "react-hot-toast";

type CreatableRole = "buyer" | "seller";

export default function DashboardCreateNewUser() {
  const router = useRouter();
  const [userInput, setUserInput] = useState<{ email: string; password: string; role: CreatableRole }>({
    email: "",
    password: "",
    role: "buyer",
  });
  const [saving, setSaving] = useState(false);

  const addNewUser = async () => {
    if (!isValidEmailAddressFormat(userInput.email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (userInput.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post("/api/users", sanitizeFormData(userInput));
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to create account");
      }

      toast.success("User added successfully");
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col bg-gray-50 xl:flex-row">
      <DashboardSidebar />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:p-8">
        <Link href="/admin/users" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-700">
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase text-purple-600">Platform Access</p>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Add user</h1>
          <p className="mt-1 text-sm text-gray-500">Create a buyer or seller account for marketplace access.</p>
        </div>

        <div className="max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900">Account details</h2>
              <p className="text-sm text-gray-500">Login credentials and marketplace role.</p>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <Field label="Email address">
              <input
                type="email"
                autoComplete="email"
                value={userInput.email}
                onChange={(event) => setUserInput({ ...userInput, email: event.target.value })}
                placeholder="customer@example.com"
                className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </Field>
            <Field label="Temporary password" hint="Minimum 8 characters">
              <input
                type="password"
                autoComplete="new-password"
                value={userInput.password}
                onChange={(event) => setUserInput({ ...userInput, password: event.target.value })}
                className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </Field>
            <Field label="Account role">
              <select
                value={userInput.role}
                onChange={(event) => setUserInput({ ...userInput, role: event.target.value as CreatableRole })}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </Field>
            <div className="flex gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Administrator roles can only be granted by updating an existing account under controlled access.
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <Link href="/admin/users" className="inline-flex h-11 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="button"
              disabled={saving}
              onClick={addNewUser}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
