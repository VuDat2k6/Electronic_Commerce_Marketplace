"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { isValidEmailAddressFormat } from "@/lib/utils";
import { ArrowLeft, Loader2, ShieldCheck, Trash2, UserRoundCog } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type UserRole = "buyer" | "seller" | "admin";

interface DashboardUserDetailsProps {
  params: Promise<{ id: string }>;
}

export default function DashboardSingleUserPage({ params }: DashboardUserDetailsProps) {
  const { id } = use(params);
  const router = useRouter();
  const [userInput, setUserInput] = useState<{ email: string; newPassword: string; role: UserRole }>({
    email: "",
    newPassword: "",
    role: "buyer",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get(`/api/users/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch user");
        const user = await response.json();
        setUserInput({ email: user?.email || "", newPassword: "", role: user?.role || "buyer" });
      } catch {
        toast.error("Unable to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const updateUser = async () => {
    if (!isValidEmailAddressFormat(userInput.email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (userInput.newPassword && userInput.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.put(`/api/users/${id}`, {
        email: userInput.email,
        role: userInput.role,
        ...(userInput.newPassword ? { password: userInput.newPassword } : {}),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to update user");
      }
      setUserInput((current) => ({ ...current, newPassword: "" }));
      toast.success("User updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!window.confirm("Delete this account permanently? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const response = await apiClient.delete(`/api/users/${id}`);
      if (response.status !== 204) throw new Error("Unable to delete user");
      toast.success("User deleted successfully");
      router.push("/admin/users");
      router.refresh();
    } catch {
      toast.error("Unable to delete user");
      setDeleting(false);
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
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">User details</h1>
          <p className="mt-1 text-sm text-gray-500">Update account identity, credentials and role assignment.</p>
        </div>

        <div className="max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <UserRoundCog className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900">Manage account</h2>
              <p className="text-sm text-gray-500">Changes take effect after saving.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading account...
            </div>
          ) : (
            <>
              <div className="space-y-5 p-6">
                <EditField label="Email address">
                  <input
                    type="email"
                    value={userInput.email}
                    onChange={(event) => setUserInput({ ...userInput, email: event.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </EditField>
                <EditField label="New password" hint="Leave blank to keep current password">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={userInput.newPassword}
                    onChange={(event) => setUserInput({ ...userInput, newPassword: event.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </EditField>
                <EditField label="Account role">
                  <select
                    value={userInput.role}
                    onChange={(event) => setUserInput({ ...userInput, role: event.target.value as UserRole })}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </EditField>
                <div className="flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  Admin and seller roles grant additional platform capabilities. Assign them only when approved.
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={deleting || saving}
                  onClick={deleteUser}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete user
                </button>
                <button
                  type="button"
                  disabled={saving || deleting}
                  onClick={updateUser}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function EditField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="text-right font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
