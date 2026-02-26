"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { testimonialsAPI } from "@/lib/api";
import { IoAdd, IoSearch, IoFilter, IoTrash, IoCreate, IoCheckmarkDone, IoClose } from "react-icons/io5";

type Testimonial = {
  id?: number;
  customerName: string;
  companyName?: string;
  message: string;
  rating: number;
  image?: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
  createdBy?: string;
};

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

  const [form, setForm] = useState<Testimonial>({
    customerName: "",
    companyName: "",
    message: "",
    rating: 5,
    image: "",
    status: "pending",
  });

  const load = async () => {
    try {
      setLoading(true);
      const data = await testimonialsAPI.getAll(true); // admin view
      setTestimonials(data || []);
    } catch (err) {
      console.error("Failed to load testimonials", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      customerName: "",
      companyName: "",
      message: "",
      rating: 5,
      image: "",
      status: "pending",
    });
    setIsModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({ ...t });
    setIsModalOpen(true);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((s) => ({ ...s, image: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.customerName || !form.message) {
      alert("Customer name and message are required");
      return;
    }
    try {
      if (editing && editing.id) {
        await testimonialsAPI.update(String(editing.id), form);
      } else {
        await testimonialsAPI.create(form);
      }
      await load();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to save");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Delete this testimonial?")) return;
    try {
      await testimonialsAPI.delete(String(id));
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const handleStatusChange = async (id?: number, status?: Testimonial["status"]) => {
    if (!id || !status) return;
    try {
      await testimonialsAPI.update(String(id), { status });
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const filtered = testimonials.filter((t) => {
    const q = search.trim().toLowerCase();
    if (filter !== "all" && t.status !== filter) return false;
    if (!q) return true;
    return (
      (t.customerName || "").toLowerCase().includes(q) ||
      (t.companyName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Testimonials Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage customer testimonials shown on the public website.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-3 py-2 rounded-lg shadow-sm">
            <IoAdd className="w-4 h-4" /> Add Testimonial
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer or company"
              className="pl-10 pr-3 py-2 border rounded-lg w-64 bg-white"
            />
          </div>

          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="py-2 px-3 rounded-lg border bg-white">
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-600 border-b">
                <th className="py-2">Customer</th>
                <th className="py-2">Company</th>
                <th className="py-2">Rating</th>
                <th className="py-2">Status</th>
                <th className="py-2">Date Added</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-gray-500">No testimonials found</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{t.customerName}</div>
                    <div className="text-xs text-gray-500">{t.message.slice(0, 80)}{t.message.length > 80 ? "..." : ""}</div>
                  </td>
                  <td className="py-3">{t.companyName || "-"}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < (t.rating || 0) ? "" : "text-gray-300"}>★</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${t.status === "approved" ? "bg-primary-100 text-primary-700" : t.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)} className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1"><IoCreate /> Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600 hover:underline inline-flex items-center gap-1"><IoTrash /> Delete</button>
                      {t.status !== "approved" && <button onClick={() => handleStatusChange(t.id, "approved")} className="text-sm text-accent-700 inline-flex items-center gap-1"><IoCheckmarkDone /> Approve</button>}
                      {t.status !== "rejected" && <button onClick={() => handleStatusChange(t.id, "rejected")} className="text-sm text-red-700 inline-flex items-center gap-1"><IoClose /> Reject</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Edit Testimonial" : "Add Testimonial"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Customer Name *</label>
            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Company Name</label>
            <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Review Message *</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border rounded-lg p-2 min-h-[120px]" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Rating</label>
              <div className="flex items-center gap-1 text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => {
                  const val = i + 1;
                  return (
                    <button key={i} onClick={() => setForm({ ...form, rating: val })} className={`text-2xl ${form.rating >= val ? "" : "text-gray-300"}`}>★</button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Upload Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
              {form.image && <img src={form.image} alt="preview" className="mt-2 w-24 h-24 object-cover rounded" />}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="border rounded-lg p-2">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-end gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-accent-600 text-white">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

