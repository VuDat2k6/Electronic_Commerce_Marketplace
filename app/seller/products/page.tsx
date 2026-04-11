"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaArchive } from "react-icons/fa";

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  rating: number;
  description: string;
  manufacturer: string;
  inStock: number;
  mainImage: string;
  categoryId: string;
  category?: { id: string; name: string };
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
}

interface Category {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-800",
  DRAFT: "bg-yellow-100 text-yellow-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

const SellerProductsPage = () => {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    price: 0,
    description: "",
    manufacturer: "",
    inStock: 0,
    mainImage: "",
    categoryId: "",
    status: "DRAFT" as "PUBLISHED" | "DRAFT" | "ARCHIVED",
  });

  useEffect(() => {
    initializeMerchant();
    fetchCategories();
  }, [session]);

  useEffect(() => {
    if (merchantId) {
      fetchProducts();
    }
  }, [merchantId, statusFilter]);

  const initializeMerchant = async () => {
    if (!session?.user?.email) return;

    try {
      const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.merchantId) {
          setMerchantId(userData.merchantId);
        } else {
          const merchantsResponse = await apiClient.get("/api/merchants");
          if (merchantsResponse.ok) {
            const merchants = await merchantsResponse.json();
            if (merchants.length > 0) {
              setMerchantId(merchants[0].id);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error initializing merchant:", e);
    }
  };

  const fetchProducts = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/merchants/${merchantId}`);
      if (response.ok) {
        const data = await response.json();
        let prods = data.products || [];
        
        // Filter by status
        if (statusFilter) {
          prods = prods.filter((p: Product) => p.status === statusFilter);
        }
        
        // Filter by search term
        if (searchTerm) {
          prods = prods.filter((p: Product) => 
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setProducts(prods);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: "",
      slug: "",
      price: 0,
      description: "",
      manufacturer: "",
      inStock: 0,
      mainImage: "",
      categoryId: categories[0]?.id || "",
      status: "DRAFT",
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      slug: product.slug,
      price: product.price,
      description: product.description,
      manufacturer: product.manufacturer,
      inStock: product.inStock,
      mainImage: product.mainImage,
      categoryId: product.categoryId,
      status: product.status || "DRAFT",
    });
    setShowModal(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return;

    try {
      const payload = {
        ...formData,
        merchantId,
        slug: formData.slug || generateSlug(formData.title),
      };

      let response;
      if (editingProduct) {
        response = await apiClient.put(`/api/products/${editingProduct.id}`, payload);
      } else {
        response = await apiClient.post("/api/products", payload);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save product");
      }

      toast.success(editingProduct ? "Product updated successfully" : "Product created successfully");
      setShowModal(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    }
  };

  const updateProductStatus = async (productId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/api/products/${productId}`, {
        status: newStatus,
      });
      
      if (!response.ok) throw new Error("Failed to update status");
      
      toast.success(`Product status updated to ${newStatus}`);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to update product status");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await apiClient.delete(`/api/products/${productId}`);
      
      if (!response.ok) throw new Error("Failed to delete product");
      
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  if (!merchantId && !loading) {
    return (
      <div className="bg-white">
        <SectionTitle title="My Products" path="Home | Seller | Products" />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Shop Associated</h2>
          <p className="text-gray-500 mb-6">
            Your account is not linked to any shop yet. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <SectionTitle title="My Products" path="Home | Seller | Products" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
            <p className="text-sm text-gray-500">Manage your product catalog</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <FaPlus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchProducts();
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["", "PUBLISHED", "DRAFT", "ARCHIVED"].map((status) => (
              <button
                key={status || "ALL"}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status || "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.mainImage ? (
                            <Image
                              src={`/${product.mainImage}`}
                              alt={product.title}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                          <p className="text-xs text-gray-500 truncate">{product.manufacturer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.inStock > 0 ? (
                        <span className="text-green-600">{product.inStock}</span>
                      ) : (
                        <span className="text-red-600">Out of stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[product.status] || STATUS_COLORS.DRAFT}`}>
                        {product.status || "DRAFT"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        
                        {/* Status toggle buttons */}
                        {product.status !== "PUBLISHED" && (
                          <button
                            onClick={() => updateProductStatus(product.id, "PUBLISHED")}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Publish"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                        )}
                        {product.status === "PUBLISHED" && (
                          <button
                            onClick={() => updateProductStatus(product.id, "DRAFT")}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Unpublish"
                          >
                            <FaEyeSlash className="w-4 h-4" />
                          </button>
                        )}
                        {product.status !== "ARCHIVED" && (
                          <button
                            onClick={() => updateProductStatus(product.id, "ARCHIVED")}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Archive"
                          >
                            <FaArchive className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (!editingProduct) {
                        setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }));
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (cents) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.inStock}
                      onChange={(e) => setFormData({ ...formData, inStock: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.mainImage}
                    onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
                    placeholder="e.g., product1.webp"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available images: product1.webp - product12.webp
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
