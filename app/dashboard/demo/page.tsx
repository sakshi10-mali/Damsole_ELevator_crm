"use client";

import { useState, useEffect, useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { IoMail, IoCall, IoBusiness, IoSearch } from "react-icons/io5";
import AnimatedDeleteButton from "@/components/AnimatedDeleteButton";

interface DemoRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  message?: string;
  createdAt: string;
  status: "Pending" | "Contacted" | "Completed";
}

export default function DemoRequestsPage() {
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<DemoRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [demoToDelete, setDemoToDelete] = useState<DemoRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Load immediately without blocking
    loadDemoRequests();
  }, []);

  const loadDemoRequests = async () => {
    try {
      // Don't block UI - show content immediately
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/demo`, {
        cache: 'no-cache',
      });
      if (!response.ok) {
        throw new Error("Failed to fetch demo requests");
      }
      const data = await response.json();
      // Ensure data is always an array
      setDemoRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load demo requests:", error);
      // Set empty array on error to prevent map error
      setDemoRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: DemoRequest["status"]) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      await fetch(`${apiUrl}/demo/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      // Ensure demoRequests is an array before mapping
      if (Array.isArray(demoRequests)) {
        setDemoRequests(demoRequests.map(demo =>
          demo.id === id ? { ...demo, status: newStatus } : demo
        ));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleViewDetails = (demo: DemoRequest) => {
    setSelectedDemo(demo);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (demo: DemoRequest) => {
    setDemoToDelete(demo);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!demoToDelete) return;

    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/demo/${demoToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete demo request");
      }

      // Remove from state
      setDemoRequests(demoRequests.filter(demo => demo.id !== demoToDelete.id));
      setDeleteConfirmOpen(false);
      setDemoToDelete(null);
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error: any) {
      console.error("Failed to delete demo request:", error);
      alert(error.message || "Failed to delete demo request. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDemoToDelete(null);
  };

  // Filter demo requests based on search query
  const filteredDemoRequests = useMemo(() => {
    if (!searchQuery.trim()) {
      return demoRequests;
    }

    const query = searchQuery.toLowerCase().trim();
    return demoRequests.filter((demo) => {
      // Search in Request ID
      if (demo.id.toLowerCase().includes(query)) return true;
      
      // Search in Name
      if (demo.name.toLowerCase().includes(query)) return true;
      
      // Search in Company
      if (demo.company && demo.company.toLowerCase().includes(query)) return true;
      
      // Search in Email
      if (demo.email.toLowerCase().includes(query)) return true;
      
      // Search in Phone
      if (demo.phone.includes(query)) return true;
      
      // Search in Date
      const dateStr = new Date(demo.createdAt).toLocaleDateString().toLowerCase();
      if (dateStr.includes(query)) return true;
      
      return false;
    });
  }, [demoRequests, searchQuery]);

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Requests</h1>
          <p className="text-gray-600">Manage demo requests from website visitors</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, Name, Company, Contact, Date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
          />
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && filteredDemoRequests.length > 0 && (
        <div className="mb-4 text-sm text-gray-600 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2 inline-block">
          Showing <span className="font-semibold text-primary-700">{filteredDemoRequests.length}</span> of <span className="font-semibold">{demoRequests.length}</span> results
        </div>
      )}

      {searchQuery && filteredDemoRequests.length === 0 && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 inline-block">
          No results found for "<span className="font-semibold">{searchQuery}</span>"
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        ) : !Array.isArray(demoRequests) || demoRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No demo requests yet
          </div>
        ) : filteredDemoRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No results found for "{searchQuery}"
          </div>
        ) : (
          filteredDemoRequests.map((demo) => (
            <div key={demo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3 w-full overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{demo.id}</h3>
                  <p className="text-sm text-gray-900 truncate">{demo.name}</p>
                  {demo.company && (
                    <p className="text-xs text-gray-500 truncate">{demo.company}</p>
                  )}
                </div>
                <StatusBadge status={demo.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-gray-900 truncate">{demo.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-gray-900">{demo.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-gray-900">{new Date(demo.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleViewDetails(demo)}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  View Details
                </button>
                <AnimatedDeleteButton
                  onClick={() => handleDeleteClick(demo)}
                  size="sm"
                  title="Delete"
                />
                <select
                  value={demo.status}
                  onChange={(e) => handleStatusChange(demo.id, e.target.value as DemoRequest["status"])}
                  className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Company
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      <span className="text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(demoRequests) || demoRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                    No demo requests yet
                  </td>
                </tr>
              ) : filteredDemoRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredDemoRequests.map((demo) => (
                  <tr key={demo.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {demo.id}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{demo.name}</div>
                      {demo.company && (
                        <div className="text-sm text-gray-500">{demo.company}</div>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-[200px]">{demo.email}</div>
                      <div className="text-sm text-gray-500">{demo.phone}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(demo.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <select
                        value={demo.status}
                        onChange={(e) => handleStatusChange(demo.id, e.target.value as DemoRequest["status"])}
                        className="text-sm border-2 border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                      >
                        <option value="Pending" className={demo.status === "Pending" ? "bg-primary-600 text-white font-semibold" : ""}>Pending</option>
                        <option value="Contacted" className={demo.status === "Contacted" ? "bg-primary-600 text-white font-semibold" : ""}>Contacted</option>
                        <option value="Completed" className={demo.status === "Completed" ? "bg-primary-600 text-white font-semibold" : ""}>Completed</option>
                      </select>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewDetails(demo)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <span className="hidden lg:inline">View Details</span>
                        <span className="lg:hidden">View</span>
                      </button>
                        <AnimatedDeleteButton
                          onClick={() => handleDeleteClick(demo)}
                          size="sm"
                          title="Delete"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen && selectedDemo !== null}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDemo(null);
        }}
        title="Demo Request Details"
        size="lg"
      >
        {selectedDemo && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedDemo.name}</h3>
              <StatusBadge status={selectedDemo.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <IoMail className="w-4 h-4" />
                  Email
                </p>
                <p className="font-medium text-gray-900">{selectedDemo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <IoCall className="w-4 h-4" />
                  Phone
                </p>
                <p className="font-medium text-gray-900">{selectedDemo.phone}</p>
              </div>
              {selectedDemo.company && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <IoBusiness className="w-4 h-4" />
                    Company
                  </p>
                  <p className="font-medium text-gray-900">{selectedDemo.company}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Request Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedDemo.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {selectedDemo.message && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Message</p>
                <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedDemo.message}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        title="Delete Demo Request"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this demo request? This action cannot be undone.
          </p>
          {demoToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Name:</span> {demoToDelete.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Email:</span> {demoToDelete.email}
              </p>
              {demoToDelete.company && (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Company:</span> {demoToDelete.company}
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}





