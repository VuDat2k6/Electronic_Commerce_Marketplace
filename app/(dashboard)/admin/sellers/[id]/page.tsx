"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Store, Mail, Phone, MapPin, Package, Calendar } from "lucide-react";
import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

interface Product {
  id: string;
  title: string;
  price: number;
  inStock: number;
  slug: string;
}

interface SellerDetails {
  id: string;
  email: string;
  shopName: string | null;
  shopDescription: string | null;
  shopPhone: string | null;
  shopAddress: string | null;
  shopStatus: string;
  shopApprovedAt: string | null;
  shopCreatedAt: string | null;
  products: Product[];
  _count: { products: number };
}

export default function AdminSellerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [seller, setSeller] = useState<SellerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSeller = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/admin/sellers/${id}`);
      if (!res.ok) throw new Error("Seller not found");
      const data = await res.json();
      setSeller(data);
    } catch (err) {
      toast.error("Failed to load seller details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSeller();
  }, [fetchSeller]);

  const handleApprove = async () => {
    try {
      const res = await apiClient.patch(`/api/admin/sellers/${id}/approve`);
      if (res.ok) {
        toast.success("Seller approved!");
        fetchSeller();
      } else {
        toast.error("Error approving seller");
      }
    } catch {
      toast.error("Error approving seller");
    }
  };

  const handleSuspend = async () => {
    if (!confirm("Suspend this seller?")) return;
    try {
      const res = await apiClient.patch(`/api/admin/sellers/${id}/suspend`, { reason: "Admin action" });
      if (res.ok) {
        toast.success("Seller suspended!");
        fetchSeller();
      } else {
        toast.error("Error suspending seller");
      }
    } catch {
      toast.error("Error suspending seller");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading seller details...</div>;
  if (!seller) return <div className="p-8 text-center text-red-500">Seller not found</div>;

  return (
    <div className="bg-white flex justify-start max-w-screen-2xl mx-auto h-full max-xl:flex-col max-xl:h-fit max-xl:gap-y-4">
      <DashboardSidebar />
      <div className="w-full">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/sellers" className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold">Seller Details</h1>

        <div className="ml-auto flex gap-2">
          {seller.shopStatus === "PENDING" && (
            <button onClick={handleApprove} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
              Approve Seller
            </button>
          )}
          {seller.shopStatus === "ACTIVE" && (
            <button onClick={handleSuspend} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
              Suspend Seller
            </button>
          )}
          {seller.shopStatus === "SUSPENDED" && (
            <button onClick={handleApprove} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
              Reactivate Seller
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-500" />
              Shop Information
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><span className="font-medium text-gray-900">Name:</span> {seller.shopName || "N/A"}</p>
              <p><span className="font-medium text-gray-900">Description:</span> {seller.shopDescription || "N/A"}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {seller.shopAddress || "N/A"}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {seller.shopPhone || "N/A"}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              Products ({seller._count.products})
            </h2>
            {seller.products.length === 0 ? (
              <p className="text-gray-500">This seller hasn&apos;t added any products yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seller.products.map(p => (
                      <tr key={p.id} className="border-b">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                        <td className="px-4 py-3 text-green-600">{p.price.toLocaleString()}Ä‘</td>
                        <td className="px-4 py-3">{p.inStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Account Details</h2>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">Status</span>
                <div className="mt-1">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                    ${seller.shopStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      seller.shopStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}>
                    {seller.shopStatus}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">Email</span>
                <p className="mt-1 flex items-center gap-2 text-sm"><Mail className="w-4 h-4" /> {seller.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">Joined Date</span>
                <p className="mt-1 flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" /> {seller.shopCreatedAt ? new Date(seller.shopCreatedAt).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
