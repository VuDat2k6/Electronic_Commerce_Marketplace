"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { AlertCircle, ChevronLeft, ChevronRight, Plus, ShieldCheck, Store, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type UserRole = "buyer" | "seller" | "admin";

interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  shopName?: string | null;
  shopStatus?: string | null;
  createdAt?: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const roleStyle: Record<UserRole, { label: string; className: string; icon: typeof UserRound }> = {
  buyer: { label: "Buyer", className: "bg-sky-50 text-sky-700", icon: UserRound },
  seller: { label: "Seller", className: "bg-emerald-50 text-emerald-700", icon: Store },
  admin: { label: "Admin", className: "bg-purple-50 text-purple-700", icon: ShieldCheck },
};

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-700",
};

export default function DashboardUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get(`/api/users?page=${page}&limit=20`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
        setPagination({ page: 1, limit: data.length || 20, total: data.length, totalPages: 1 });
      } else {
        setUsers(Array.isArray(data?.users) ? data.users : []);
        setPagination(data?.pagination || { page, limit: 20, total: 0, totalPages: 1 });
      }
    } catch (requestError) {
      console.error("Error fetching users:", requestError);
      setUsers([]);
      setError("Unable to load user accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const counts = useMemo(() => ({
    buyer: users.filter((user) => user.role === "buyer").length,
    seller: users.filter((user) => user.role === "seller").length,
    admin: users.filter((user) => user.role === "admin").length,
  }), [users]);

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col bg-gray-50 xl:flex-row">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:p-8">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-purple-600">Platform Access</p>
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">Users</h1>
            <p className="mt-1 text-sm text-gray-500">Review customer, seller and administrator accounts.</p>
          </div>
          <Link
            href="/admin/users/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <Plus className="h-4 w-4" />
            Add user
          </Link>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="User metrics">
          <Metric label="Total accounts" value={pagination.total} icon={UsersRound} tone="text-gray-900" />
          <Metric label="Buyers on page" value={counts.buyer} icon={UserRound} tone="text-sky-700" />
          <Metric label="Sellers on page" value={counts.seller} icon={Store} tone="text-emerald-700" />
          <Metric label="Admins on page" value={counts.admin} icon={ShieldCheck} tone="text-purple-700" />
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Account directory</h2>
              <p className="text-sm text-gray-500">
                Showing page {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </p>
            </div>
            <span className="text-sm text-gray-500">{pagination.total} total records</span>
          </div>

          {loading ? (
            <TableLoading columns={5} />
          ) : error ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-red-500" />
              <p className="text-sm text-gray-600">{error}</p>
              <button
                type="button"
                onClick={fetchUsers}
                className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <UsersRound className="mx-auto mb-3 h-9 w-9 text-gray-300" />
              <p className="font-medium text-gray-800">No user accounts found</p>
              <p className="mt-1 text-sm text-gray-500">New accounts will appear here after registration.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="bg-gray-50">
                  <tr>
                    <HeaderCell>Account</HeaderCell>
                    <HeaderCell>Role</HeaderCell>
                    <HeaderCell>Seller status</HeaderCell>
                    <HeaderCell>Created</HeaderCell>
                    <HeaderCell className="text-right">Action</HeaderCell>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const role = roleStyle[user.role] || roleStyle.buyer;
                    const Icon = role.icon;
                    return (
                      <tr key={user.id} className="transition hover:bg-gray-50/80">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{user.shopName || "Personal account"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${role.className}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {role.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {user.role === "seller" ? (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[user.shopStatus || "PENDING"] || "bg-gray-100 text-gray-600"}`}>
                              {user.shopStatus || "PENDING"}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Not applicable</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "-"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                          >
                            Details
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <PaginationButton disabled={page <= 1} onClick={() => setPage((current) => current - 1)} label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </PaginationButton>
                <PaginationButton disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} label="Next">
                  <ChevronRight className="h-4 w-4" />
                </PaginationButton>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof UsersRound; tone: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className={`mt-3 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function HeaderCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500 ${className}`}>{children}</th>;
}

function TableLoading({ columns }: { columns: number }) {
  return (
    <div className="animate-pulse p-5">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="mb-4 grid grid-cols-5 gap-4 last:mb-0">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-gray-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

function PaginationButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
