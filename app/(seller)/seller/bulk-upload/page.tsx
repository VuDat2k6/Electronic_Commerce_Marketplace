"use client";
import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";
import { FaUpload, FaFileExcel, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

interface BatchResult {
  id: string;
  fileName: string;
  status: string;
  itemCount: number;
  errorCount: number;
  createdAt: string;
}

const SellerBulkUploadPage = () => {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<BatchResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);
    try {
      const res = await apiClient.get(`/api/bulk-upload?userId=${userId}`);
      const data = await res.json();
      setHistory(data.batches || []);
    } catch {
      toast.error("Error loading upload history");
    } finally {
      setLoadingHistory(false);
    }
  };

  React.useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(session as any)?.user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Only CSV files are allowed");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File is too large (maximum 5MB)");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    if (!session?.user?.id) {
      toast.error("Please log in");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sellerId", session.user.id);

      const res = await fetch("/api/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Upload successful! ${data.successful} products were created.`);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchHistory();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <FaCheckCircle className="text-green-500" />;
      case "FAILED":
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bulk Product Upload</h1>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaUpload className="text-green-600" />
          Upload CSV
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <FaFileExcel className="text-5xl mx-auto mb-4 text-green-600" />
            <p className="text-lg font-medium text-gray-700">
              {file ? file.name : "Drag and drop a CSV file or click to select"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Maximum CSV file size is 5MB.{" "}
              <a href="/template.csv" download className="text-blue-500 hover:underline">
                Download template
              </a>
            </p>
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FaFileExcel className="text-2xl text-green-600" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-red-500 hover:bg-red-100 px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`mt-4 w-full py-3 rounded-lg font-medium transition ${
            !file || uploading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
              Uploading...
            </span>
          ) : (
            "Upload and Process"
          )}
        </button>

        {/* CSV Format Guide */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">CSV Format:</h3>
          <div className="text-sm text-gray-600 overflow-x-auto">
            <code className="block bg-gray-100 p-2 rounded">
              title,slug,price,manufacturer,description,mainImage,categoryName,inStock
            </code>
            <p className="mt-2">* slug must be unique. categoryName must match an existing category.</p>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upload History</h2>

        {loadingHistory ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upload history yet.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((batch) => (
              <div key={batch.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(batch.status)}
                    <div>
                      <p className="font-medium">{batch.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(batch.createdAt).toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      batch.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : batch.status === "FAILED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <span>Total: {batch.itemCount + batch.errorCount}</span>
                  <span className="text-green-600">Successful: {batch.itemCount}</span>
                  {batch.errorCount > 0 && (
                    <span className="text-red-600">Errors: {batch.errorCount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerBulkUploadPage;