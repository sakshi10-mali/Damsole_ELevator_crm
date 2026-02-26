"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMail, IoCall, IoDocumentText, IoTime, IoCheckmarkCircle, IoCloseCircle, IoSearch } from "react-icons/io5";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import AnimatedDeleteButton from "@/components/AnimatedDeleteButton";

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "New" | "Read" | "Replied";
  createdAt: string;
  updatedAt: string;
}

interface Demo {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  elevatorType?: string;
  message?: string;
  status: "Pending" | "Contacted" | "Completed";
  createdAt: string;
  updatedAt: string;
}

export default function SubmissionsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"contacts" | "demos">("contacts");
  const [selectedItem, setSelectedItem] = useState<Contact | Demo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemName: string;
    itemType: "contact" | "demo";
  }>({
    isOpen: false,
    itemId: null,
    itemName: "",
    itemType: "contact",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    contacts: { total: 0, new: 0, read: 0, replied: 0, contacted: 0 },
    demos: { total: 0, pending: 0, contacted: 0 },
  });

  useEffect(() => {
    // Load both in parallel for faster loading
    const token = localStorage.getItem("authToken");
    Promise.all([
      loadSubmissions(token),
      loadStats(token)
    ]);
  }, []);

  // Handle body overflow when delete modal is open
  useEffect(() => {
    if (deleteConfirmModal.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [deleteConfirmModal.isOpen]);

  const loadSubmissions = async (token: string | null) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/admin/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setDemos(data.demos || []);
      } else if (response.status === 401) {
        // Redirect to login if not authenticated
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (token: string | null) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const updateContactStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/contact/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        loadSubmissions(token);
        loadStats(token);
      }
    } catch (error) {
      console.error("Failed to update contact status:", error);
    }
  };

  const updateDemoStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/demo/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        loadSubmissions(token);
        loadStats(token);
      }
    } catch (error) {
      console.error("Failed to update demo status:", error);
    }
  };

  const handleDeleteContact = (id: string) => {
    const contact = contacts.find(c => c._id === id);
    setDeleteConfirmModal({
      isOpen: true,
      itemId: id,
      itemName: contact?.name || "this contact submission",
      itemType: "contact",
    });
  };

  const handleDeleteDemo = (id: string) => {
    const demo = demos.find(d => d._id === id);
    setDeleteConfirmModal({
      isOpen: true,
      itemId: id,
      itemName: demo?.name || "this demo request",
      itemType: "demo",
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmModal.itemId) return;

    try {
      const token = localStorage.getItem("authToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const endpoint = deleteConfirmModal.itemType === "contact" 
        ? `${apiUrl}/contact/${deleteConfirmModal.itemId}`
        : `${apiUrl}/demo/${deleteConfirmModal.itemId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadSubmissions(token);
        loadStats(token);
        // Trigger notification refresh
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
        // Close delete modal
        setDeleteConfirmModal({ isOpen: false, itemId: null, itemName: "", itemType: "contact" });
      } else {
        alert(`Failed to delete ${deleteConfirmModal.itemType === "contact" ? "contact submission" : "demo request"}`);
      }
    } catch (error) {
      console.error(`Failed to delete ${deleteConfirmModal.itemType}:`, error);
      alert(`Failed to delete ${deleteConfirmModal.itemType === "contact" ? "contact submission" : "demo request"}. Please try again.`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase().trim();
    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        contact.subject.toLowerCase().includes(query) ||
        contact.message.toLowerCase().includes(query) ||
        contact.status.toLowerCase().includes(query) ||
        formatDate(contact.createdAt).toLowerCase().includes(query)
      );
    });
  }, [contacts, searchQuery]);

  // Filter demos based on search query
  const filteredDemos = useMemo(() => {
    if (!searchQuery.trim()) return demos;
    const query = searchQuery.toLowerCase().trim();
    return demos.filter((demo) => {
      return (
        demo.name.toLowerCase().includes(query) ||
        demo.email.toLowerCase().includes(query) ||
        demo.phone.includes(query) ||
        (demo.company && demo.company.toLowerCase().includes(query)) ||
        (demo.elevatorType && demo.elevatorType.toLowerCase().includes(query)) ||
        (demo.message && demo.message.toLowerCase().includes(query)) ||
        demo.status.toLowerCase().includes(query) ||
        formatDate(demo.createdAt).toLowerCase().includes(query)
      );
    });
  }, [demos, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Form Submissions</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-600"></div>
              <span>Loading...</span>
            </div>
          )}
          {/* Search Bar */}
          <div className="relative w-48 md:w-56">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "contacts" ? "contacts" : "demo requests"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Contacts</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.contacts.total}</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.contacts.new} new, {(stats.contacts.contacted || stats.contacts.replied || 0)} contacted
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Demo Requests</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.demos.total}</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.demos.pending} pending, {stats.demos.contacted} contacted
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Contacted</div>
          <div className="text-2xl sm:text-3xl font-bold text-primary-600">{stats.contacts.contacted || stats.contacts.replied || 0}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Pending Demos</div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.demos.pending}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab("contacts")}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "contacts"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Contact Forms ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab("demos")}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "demos"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Demo Requests ({demos.length})
          </button>
        </nav>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-2 inline-block ${
          (activeTab === "contacts" && filteredContacts.length > 0) || 
          (activeTab === "demos" && filteredDemos.length > 0)
            ? "bg-primary-50 border border-primary-200 text-gray-600"
            : "bg-red-50 border border-red-200 text-red-600"
        }`}>
          {activeTab === "contacts" ? (
            filteredContacts.length > 0 ? (
              <>Showing <span className="font-semibold text-primary-700">{filteredContacts.length}</span> of <span className="font-semibold">{contacts.length}</span> contacts</>
            ) : (
              <>No contacts found for "<span className="font-semibold">{searchQuery}</span>"</>
            )
          ) : (
            filteredDemos.length > 0 ? (
              <>Showing <span className="font-semibold text-primary-700">{filteredDemos.length}</span> of <span className="font-semibold">{demos.length}</span> demo requests</>
            ) : (
              <>No demo requests found for "<span className="font-semibold">{searchQuery}</span>"</>
            )
          )}
        </div>
      )}

      {/* Contacts Table */}
      {activeTab === "contacts" && (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredContacts.length === 0 ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500 text-sm">
                {contacts.length === 0 ? "No contact submissions yet" : "No results found"}
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div key={contact._id} className="bg-white rounded-lg shadow border border-gray-200 p-4 space-y-3 w-full overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{contact.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{contact.email}</p>
                      <p className="text-xs text-gray-500">{contact.phone}</p>
                    </div>
                    <StatusBadge status={contact.status} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Subject</p>
                    <p className="text-sm text-gray-900">{contact.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-sm text-gray-900">{formatDate(contact.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedItem(contact);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                    >
                      View
                    </button>
                    {contact.status === "New" && (
                      <>
                        <button
                          onClick={() => updateContactStatus(contact._id, "Read")}
                          className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          Read
                        </button>
                        <button
                          onClick={() => updateContactStatus(contact._id, "Replied")}
                          className="flex-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                        >
                          Replied
                        </button>
                      </>
                    )}
                    {contact.status === "Read" && (
                      <button
                        onClick={() => updateContactStatus(contact._id, "Replied")}
                        className="flex-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                      >
                        Mark Replied
                      </button>
                    )}
                    <AnimatedDeleteButton
                      onClick={() => handleDeleteContact(contact._id)}
                      size="sm"
                      title="Delete"
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 lg:px-6 py-4 text-center text-gray-500">
                        {contacts.length === 0 ? "No contact submissions yet" : "No results found"}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact._id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 truncate max-w-[200px]">{contact.email}</div>
                          <div className="text-sm text-gray-500">{contact.phone}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-[200px]">{contact.subject}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={contact.status} />
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(contact.createdAt)}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedItem(contact);
                                setIsModalOpen(true);
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
                            {contact.status === "New" && (
                              <>
                                <button
                                  onClick={() => updateContactStatus(contact._id, "Read")}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Mark Read
                                </button>
                                <button
                                  onClick={() => updateContactStatus(contact._id, "Replied")}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  Mark Replied
                                </button>
                              </>
                            )}
                            {contact.status === "Read" && (
                              <button
                                onClick={() => updateContactStatus(contact._id, "Replied")}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Mark Replied
                              </button>
                            )}
                            <AnimatedDeleteButton
                              onClick={() => handleDeleteContact(contact._id)}
                              size="sm"
                              title="Delete"
                              className="ml-2"
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
        </>
      )}

      {/* Demos Table */}
      {activeTab === "demos" && (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredDemos.length === 0 ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center text-gray-500 text-sm">
                {demos.length === 0 ? "No demo requests yet" : "No results found"}
              </div>
            ) : (
              filteredDemos.map((demo) => (
                <div key={demo._id} className="bg-white rounded-lg shadow border border-gray-200 p-4 space-y-3 w-full overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{demo.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{demo.email}</p>
                      <p className="text-xs text-gray-500">{demo.phone}</p>
                    </div>
                    <StatusBadge status={demo.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company</p>
                      <p className="text-gray-900">{demo.company || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Elevator Type</p>
                      <p className="text-gray-900">{demo.elevatorType || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-sm text-gray-900">{formatDate(demo.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedItem(demo);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                    >
                      View
                    </button>
                    {demo.status === "Pending" && (
                      <button
                        onClick={() => updateDemoStatus(demo._id, "Contacted")}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        Mark Contacted
                      </button>
                    )}
                    <AnimatedDeleteButton
                      onClick={() => handleDeleteDemo(demo._id)}
                      size="sm"
                      title="Delete"
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Elevator Type
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDemos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 lg:px-6 py-4 text-center text-gray-500">
                        {demos.length === 0 ? "No demo requests yet" : "No results found"}
                      </td>
                    </tr>
                  ) : (
                    filteredDemos.map((demo) => (
                      <tr key={demo._id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{demo.name}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 truncate max-w-[200px]">{demo.email}</div>
                          <div className="text-sm text-gray-500">{demo.phone}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{demo.company || "-"}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{demo.elevatorType || "-"}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={demo.status} />
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(demo.createdAt)}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedItem(demo);
                                setIsModalOpen(true);
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
                            {demo.status === "Pending" && (
                              <button
                                onClick={() => updateDemoStatus(demo._id, "Contacted")}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Mark Contacted
                              </button>
                            )}
                            <AnimatedDeleteButton
                              onClick={() => handleDeleteDemo(demo._id)}
                              size="sm"
                              title="Delete"
                              className="ml-2"
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
        </>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedItem && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          title={activeTab === "contacts" ? "Contact Details" : "Demo Request Details"}
        >
          <div className="space-y-4">
            {"subject" in selectedItem ? (
              // Contact details
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="text-gray-900">{selectedItem.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-gray-900">{selectedItem.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="text-gray-900">{selectedItem.phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <div className="text-gray-900">{selectedItem.subject}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <div className="text-gray-900 whitespace-pre-wrap">{selectedItem.message}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <StatusBadge status={selectedItem.status} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <div className="text-gray-500 text-sm">{formatDate(selectedItem.createdAt)}</div>
                </div>
              </>
            ) : (
              // Demo details
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="text-gray-900">{selectedItem.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-gray-900">{selectedItem.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="text-gray-900">{selectedItem.phone}</div>
                </div>
                {selectedItem.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <div className="text-gray-900">{selectedItem.company}</div>
                  </div>
                )}
                {selectedItem.elevatorType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Elevator Type</label>
                    <div className="text-gray-900">{selectedItem.elevatorType}</div>
                  </div>
                )}
                {selectedItem.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <div className="text-gray-900 whitespace-pre-wrap">{selectedItem.message}</div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <StatusBadge status={selectedItem.status} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <div className="text-gray-500 text-sm">{formatDate(selectedItem.createdAt)}</div>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmModal.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDeleteConfirmModal({ isOpen: false, itemId: null, itemName: "", itemType: "contact" })}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="group select-none w-[250px] sm:w-[300px] flex flex-col p-4 relative items-center justify-center bg-gray-800 border border-gray-800 shadow-lg rounded-2xl pointer-events-auto"
              >
                <div className="w-full">
                  <div className="text-center p-3 flex-auto justify-center">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      className="group-hover:animate-bounce w-12 h-12 flex items-center text-gray-600 fill-red-500 mx-auto"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        fillRule="evenodd"
                      ></path>
                    </svg>
                    <h2 className="text-xl font-bold py-4 text-gray-200">Are you sure?</h2>
                    <p className="font-bold text-sm text-gray-500 px-2 mb-2">
                      Do you really want to delete <span className="text-gray-300">{deleteConfirmModal.itemName}</span>? This process cannot be undone.
                    </p>
                  </div>
                  <div className="p-2 mt-2 text-center space-x-1 md:block">
                    <button
                      onClick={() => setDeleteConfirmModal({ isOpen: false, itemId: null, itemName: "", itemType: "contact" })}
                      className="mb-2 md:mb-0 bg-gray-700 px-5 py-2 text-sm shadow-sm font-medium tracking-wider border-2 border-gray-600 hover:border-gray-700 text-gray-300 rounded-full hover:shadow-lg hover:bg-gray-800 transition ease-in duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="bg-red-500 hover:bg-transparent px-5 ml-4 py-2 text-sm shadow-sm hover:shadow-lg font-medium tracking-wider border-2 border-red-500 hover:border-red-500 text-white hover:text-red-500 rounded-full transition ease-in duration-300"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


