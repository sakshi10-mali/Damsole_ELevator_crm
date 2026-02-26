"use client";

import { useState, useEffect } from "react";
import { IoCalendar, IoTime, IoCheckmarkCircle, IoCloseCircle, IoAdd, IoSearch } from "react-icons/io5";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import AnimatedDeleteButton from "@/components/AnimatedDeleteButton";

interface Reminder {
  id: string;
  leadId: string;
  leadName: string;
  type: "Follow-up" | "Quotation" | "Meeting" | "Call";
  dueDate: string;
  dueTime: string;
  status: "Pending" | "Completed" | "Overdue";
  notes: string;
  assignedTo: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Completed" | "Overdue">("All");
  const [newReminder, setNewReminder] = useState({
    leadId: "",
    leadName: "",
    type: "Follow-up" as Reminder["type"],
    dueDate: "",
    dueTime: "",
    notes: "",
    assignedTo: "Sales Executive 1",
  });

  useEffect(() => {
    // Load reminders from API
    loadReminders();
  }, []);

  // Lock body scroll when delete modal is open
  useEffect(() => {
    if (isDeleteModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDeleteModalOpen]);

  const loadReminders = async () => {
    // TODO: Replace with actual API call
    // Mock data for now
    const mockReminders: Reminder[] = [
      {
        id: "R001",
        leadId: "L001",
        leadName: "Rajesh Kumar",
        type: "Follow-up",
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        dueTime: "10:00",
        status: "Pending",
        notes: "Follow up on quotation sent",
        assignedTo: "Sales Executive 1",
      },
      {
        id: "R002",
        leadId: "L002",
        leadName: "Priya Sharma",
        type: "Call",
        dueDate: new Date().toISOString().split("T")[0],
        dueTime: "14:00",
        status: "Overdue",
        notes: "Call to discuss pricing",
        assignedTo: "Sales Executive 2",
      },
    ];
    setReminders(mockReminders);
  };

  const handleAddReminder = async () => {
    if (!newReminder.leadName || !newReminder.dueDate || !newReminder.dueTime) {
      toast.warning("Please fill all required fields");
      return;
    }

    const reminder: Reminder = {
      id: `R${String(reminders.length + 1).padStart(3, "0")}`,
      leadId: newReminder.leadId || `L${String(reminders.length + 1).padStart(3, "0")}`,
      leadName: newReminder.leadName,
      type: newReminder.type,
      dueDate: newReminder.dueDate,
      dueTime: newReminder.dueTime,
      status: "Pending",
      notes: newReminder.notes,
      assignedTo: newReminder.assignedTo,
    };

    setReminders([...reminders, reminder]);
    setIsModalOpen(false);
    setNewReminder({
      leadId: "",
      leadName: "",
      type: "Follow-up",
      dueDate: "",
      dueTime: "",
      notes: "",
      assignedTo: "Sales Executive 1",
    });
  };

  const handleCompleteReminder = (id: string) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, status: "Completed" as Reminder["status"] } : r
    ));
  };

  const handleDeleteClick = (reminder: Reminder) => {
    setReminderToDelete(reminder);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reminderToDelete) return;

    try {
      // TODO: Replace with actual API call
      setReminders(reminders.filter(reminder => reminder.id !== reminderToDelete.id));
      toast.success("Reminder deleted successfully!");
      setIsDeleteModalOpen(false);
      setReminderToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete reminder:", error);
      toast.error(error?.message || "Failed to delete reminder. Please try again.");
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = 
      reminder.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "All" || reminder.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === "Pending").length,
    completed: reminders.filter(r => r.status === "Completed").length,
    overdue: reminders.filter(r => {
      return r.status === "Pending" && new Date(`${r.dueDate}T${r.dueTime}`) < new Date();
    }).length,
  };

  const getStatusColor = (status: Reminder["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-primary-100 text-primary-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: Reminder["type"]) => {
    switch (type) {
      case "Follow-up":
        return <IoTime className="w-4 h-4" />;
      case "Quotation":
        return <IoCalendar className="w-4 h-4" />;
      case "Meeting":
        return <IoCalendar className="w-4 h-4" />;
      case "Call":
        return <IoTime className="w-4 h-4" />;
      default:
        return <IoCalendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Follow-up Reminders</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage follow-ups, calls, and meetings</p>
      </div>

        {/* Search, Filter and Add Button Row - Right Top Corner */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="relative w-48 md:w-56">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white placeholder-gray-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-4 py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white w-full sm:w-auto font-medium cursor-pointer"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
        >
            <option value="All" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>All Status</option>
            <option value="Pending" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Pending</option>
            <option value="Completed" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Completed</option>
            <option value="Overdue" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Overdue</option>
        </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg whitespace-nowrap w-full sm:w-auto text-sm sm:text-base transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <IoAdd className="w-5 h-5" />
            Add Reminder
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {reminders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-yellow-700 mb-1">Pending</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-primary-50 rounded-lg border-2 border-primary-200 p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-primary-700 mb-1">Completed</p>
            <p className="text-xl sm:text-2xl font-bold text-primary-800">{stats.completed}</p>
          </div>
          <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-red-700 mb-1">Overdue</p>
            <p className="text-xl sm:text-2xl font-bold text-red-800">{stats.overdue}</p>
          </div>
        </div>
      )}

      {/* Reminders List */}
      <div className="grid gap-4">
        {filteredReminders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg font-medium">No reminders found</p>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filter</p>
            )}
          </div>
        ) : (
          filteredReminders.map((reminder) => {
            const isOverdue = reminder.status === "Pending" && 
              new Date(`${reminder.dueDate}T${reminder.dueTime}`) < new Date();
            
            return (
              <div
                key={reminder.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-4 sm:p-6 hover:shadow-lg transition-all duration-200 ${
                  isOverdue ? "border-red-200 bg-red-50/30" : "border-gray-200 hover:border-primary-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg text-primary-600 flex-shrink-0">
                        {getTypeIcon(reminder.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{reminder.leadName}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Lead ID: {reminder.leadId}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm font-medium text-gray-900">{reminder.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Due Date & Time</p>
                        <div className="flex items-center gap-2">
                          <IoCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(reminder.dueDate).toLocaleDateString()} at {reminder.dueTime}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{reminder.assignedTo}</p>
                      </div>
                    </div>

                    {reminder.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed">{reminder.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      isOverdue ? "Overdue" : reminder.status
                    )}`}>
                      {isOverdue ? "Overdue" : reminder.status}
                    </span>
                    <div className="flex items-center gap-2">
                      {reminder.status === "Pending" && (
                        <button
                          onClick={() => handleCompleteReminder(reminder.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                        >
                          <IoCheckmarkCircle className="w-4 h-4" />
                          Mark Complete
                        </button>
                      )}
                      <AnimatedDeleteButton
                        onClick={() => handleDeleteClick(reminder)}
                        size="sm"
                        title="Delete Reminder"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Follow-up Reminder"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Name *
            </label>
            <input
              type="text"
              value={newReminder.leadName}
              onChange={(e) => setNewReminder({ ...newReminder, leadName: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Enter lead name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder Type *
            </label>
            <select
              value={newReminder.type}
              onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value as Reminder["type"] })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            >
              <option value="Follow-up">Follow-up</option>
              <option value="Quotation">Quotation</option>
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={newReminder.dueDate}
                onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Time *
              </label>
              <input
                type="time"
                value={newReminder.dueTime}
                onChange={(e) => setNewReminder({ ...newReminder, dueTime: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={newReminder.notes}
              onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
              rows={3}
              placeholder="Add reminder notes..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To *
            </label>
            <select
              value={newReminder.assignedTo}
              onChange={(e) => setNewReminder({ ...newReminder, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            >
              <option value="Sales Executive 1">Sales Executive 1</option>
              <option value="Sales Executive 2">Sales Executive 2</option>
              <option value="Sales Executive 3">Sales Executive 3</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddReminder}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Add Reminder
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal - Dark Theme */}
      {isDeleteModalOpen && reminderToDelete && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setReminderToDelete(null);
            }}
          />
          
          {/* Dark Theme Card - Exact match to provided design */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="group select-none w-[250px] flex flex-col p-4 relative items-center justify-center bg-gray-800 border border-gray-800 shadow-lg rounded-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
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
                    />
                  </svg>
                  <h2 className="text-xl font-bold py-4 text-gray-200">Are you sure?</h2>
                  <p className="font-bold text-sm text-gray-500 px-2">
                    Do you really want to continue ? This process cannot be undone
                  </p>
                </div>
                <div className="p-2 mt-2 text-center space-x-1 md:block">
                  <button 
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setReminderToDelete(null);
                    }}
                    className="mb-2 md:mb-0 bg-gray-700 px-5 py-2 text-sm shadow-sm font-medium tracking-wider border-2 border-gray-600 hover:border-gray-700 text-gray-300 rounded-full hover:shadow-lg hover:bg-gray-800 transition ease-in duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteConfirm}
                    className="bg-red-500 hover:bg-transparent px-5 ml-4 py-2 text-sm shadow-sm hover:shadow-lg font-medium tracking-wider border-2 border-red-500 hover:border-red-500 text-white hover:text-red-500 rounded-full transition ease-in duration-300"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

















