"use client";

import { useState, useMemo, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { IoAdd, IoPerson, IoSearch, IoEye, IoShieldCheckmark, IoCheckmarkCircle, IoSettings, IoLockClosed } from "react-icons/io5";
import AnimatedDeleteButton from "@/components/AnimatedDeleteButton";
import AnimatedEditButton from "@/components/AnimatedEditButton";
import { usersAPI } from "@/lib/api";
import { PERMISSION_GROUPS } from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Superadmin" | "Admin" | "Sales Executive" | "Service Engineer" | "Project Manager" | "Accounts" | "Manager" | "Technician" | "Accountant";
  status: "Active" | "Inactive" | "Pending";
  lastLogin: string;
  password?: string; // Password field for admin view
  permissions?: string[]; // Array of permission strings
  createdAt?: string;
}

// Role-based permissions
const getRolePermissions = (role: User["role"]) => {
  switch (role) {
    case "Superadmin":
    case "Admin":
      return {
        canViewLeads: true,
        canEditLeads: true,
        canViewProjects: true,
        canEditProjects: true,
        canViewAMC: true,
        canEditAMC: true,
        canViewReports: true,
        canManageUsers: true,
      };
    case "Sales Executive":
      return {
        canViewLeads: true,
        canEditLeads: true,
        canViewProjects: false,
        canEditProjects: false,
        canViewAMC: false,
        canEditAMC: false,
        canViewReports: true,
        canManageUsers: false,
      };
    case "Service Engineer":
      return {
        canViewLeads: false,
        canEditLeads: false,
        canViewProjects: true,
        canEditProjects: false,
        canViewAMC: true,
        canEditAMC: true,
        canViewReports: false,
        canManageUsers: false,
      };
    case "Project Manager":
      return {
        canViewLeads: true,
        canEditLeads: false,
        canViewProjects: true,
        canEditProjects: true,
        canViewAMC: true,
        canEditAMC: false,
        canViewReports: true,
        canManageUsers: false,
      };
    case "Accounts":
      return {
        canViewLeads: true,
        canEditLeads: false,
        canViewProjects: true,
        canEditProjects: false,
        canViewAMC: true,
        canEditAMC: false,
        canViewReports: true,
        canManageUsers: false,
      };
    case "Manager":
      return {
        canViewLeads: true,
        canEditLeads: true,
        canViewProjects: true,
        canEditProjects: true,
        canViewAMC: true,
        canEditAMC: true,
        canViewReports: true,
        canManageUsers: false,
      };
    case "Technician":
      return {
        canViewLeads: false,
        canEditLeads: false,
        canViewProjects: true,
        canEditProjects: false,
        canViewAMC: true,
        canEditAMC: true,
        canViewReports: false,
        canManageUsers: false,
      };
    case "Accountant":
      return {
        canViewLeads: true,
        canEditLeads: false,
        canViewProjects: true,
        canEditProjects: false,
        canViewAMC: true,
        canEditAMC: false,
        canViewReports: true,
        canManageUsers: false,
      };
    default:
      return {
        canViewLeads: false,
        canEditLeads: false,
        canViewProjects: false,
        canEditProjects: false,
        canViewAMC: false,
        canEditAMC: false,
        canViewReports: false,
        canManageUsers: false,
      };
  }
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReject, setUserToReject] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Get current user role to check if admin
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    // Get current user role and ID from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserRole(user.role || "");
        setCurrentUserId(user.id || "");
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  // Fetch users from API on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("authToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        
        // Fetch with passwords if admin
        const isAdmin = currentUserRole === "Admin" || currentUserRole === "Superadmin";
        const url = isAdmin 
          ? `${apiUrl}/users?includePasswords=true`
          : undefined;
        
        const fetchedUsers = url 
          ? await fetch(url, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }).then(res => res.json())
          : await usersAPI.getAll();
        
        // Separate active/inactive users from pending users
        const activeUsers = fetchedUsers.filter((u: User) => u.status !== "Pending");
        const pending = fetchedUsers.filter((u: User) => u.status === "Pending");
        
        setUsers(activeUsers);
        setPendingUsers(pending);
        
        // Also fetch pending users separately if admin
        if (isAdmin) {
          try {
            const pendingResponse = await fetch(`${apiUrl}/users/pending`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (pendingResponse.ok) {
              const pendingData = await pendingResponse.json();
              setPendingUsers(pendingData);
            }
          } catch (error) {
            console.error("Failed to fetch pending users:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // Fallback to empty array on error
        setUsers([]);
        setPendingUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserRole) {
      fetchUsers();
    }
  }, [currentUserRole]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Sales Executive" as User["role"],
  });
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    password: "", // Optional password change
    role: "Sales Executive" as User["role"],
    status: "Active" as User["status"],
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPermissionsSection, setShowPermissionsSection] = useState(false);

  const handleAddUser = async () => {
    // Validation
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Name, email, and password are required");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        status: "Active" as User["status"],
      };
      const createdUser = await usersAPI.create(userData);
      const userWithPermissions: User = {
        ...createdUser,
        permissions: getRolePermissions(createdUser.role),
      };
      setUsers([...users, userWithPermissions]);
      setIsModalOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "Sales Executive" });
      toast.success("User created successfully");
      
      // Refresh users list to get password
      if (currentUserRole === "Admin" || currentUserRole === "Superadmin") {
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users?includePasswords=true`;
        const fetchedUsers = await fetch(url).then(res => res.json());
        const usersWithPermissions = fetchedUsers.map((user: User) => ({
          ...user,
          permissions: getRolePermissions(user.role),
        }));
        setUsers(usersWithPermissions);
      }
    } catch (error: any) {
      console.error("Failed to create user:", error);
      const errorMessage = error?.message || "Failed to create user. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setSelectedPermissions(Array.isArray(user.permissions) ? user.permissions : []);
    setEditErrors({});
    setShowPasswordField(false);
    setShowPermissionsSection(false);
    setIsEditModalOpen(true);
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    
    if (!editUser.name.trim()) {
      errors.name = "Name is required";
    } else if (editUser.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    if (!editUser.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUser.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (showPasswordField && editUser.password) {
      if (editUser.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    }
    
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.includes(permission)
        ? prevArray.filter((p) => p !== permission)
        : [...prevArray, permission];
    });
  };

  const handleOpenPermissions = (user: User) => {
    setPermissionsUser(user);
    setSelectedPermissions(Array.isArray(user.permissions) ? user.permissions : []);
    setIsPermissionsModalOpen(true);
  };

  const handleUpdatePermissions = async () => {
    if (!permissionsUser) return;
    
    setIsUpdating(true);
    
    try {
      const token = localStorage.getItem("authToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const permissionsResponse = await fetch(`${apiUrl}/users/${permissionsUser.id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });

      if (!permissionsResponse.ok) {
        const errorData = await permissionsResponse.json().catch(() => ({}));
        console.error("Permission update error:", {
          status: permissionsResponse.status,
          statusText: permissionsResponse.statusText,
          errorData
        });
        const errorMessage = errorData.error || errorData.message || `Failed to update permissions (${permissionsResponse.status})`;
        throw new Error(errorMessage);
      }
      
      const responseData = await permissionsResponse.json();
      console.log("Permission update success:", responseData);

      // Fetch updated user data from backend to get latest permissions
      const updatedUserResponse = await fetch(`${apiUrl}/users/${permissionsUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedUserData = await updatedUserResponse.json();
      
      // Update user in list with new permissions from backend
      const userWithPermissions: User = {
        ...updatedUserData,
        permissions: updatedUserData.permissions || selectedPermissions,
      };
      const updatedUsers = users.map((u) =>
        u.id === permissionsUser.id ? userWithPermissions : u
      );
      setUsers(updatedUsers);
      
      // If updating current logged-in user, update localStorage immediately
      const currentUserStr = localStorage.getItem("user");
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser.id === permissionsUser.id) {
            const updatedCurrentUser = {
              ...currentUser,
              role: updatedUserData.role || currentUser.role,
              permissions: updatedUserData.permissions || selectedPermissions,
            };
            localStorage.setItem("user", JSON.stringify(updatedCurrentUser));
            // Dispatch event to update sidebar and dashboard immediately
            window.dispatchEvent(new CustomEvent('userPermissionsUpdated', { 
              detail: { permissions: updatedUserData.permissions || selectedPermissions } 
            }));
            // Also trigger a storage event for cross-tab sync
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'user',
              newValue: JSON.stringify(updatedCurrentUser),
              storageArea: localStorage
            }));
          }
        } catch (e) {
          console.error("Failed to update current user data");
        }
      }
      
      setIsPermissionsModalOpen(false);
      setPermissionsUser(null);
      setSelectedPermissions([]);
      toast.success("Permissions updated successfully. Changes are now active!");
    } catch (error: any) {
      console.error("Failed to update permissions:", error);
      const errorMessage = error?.message || "Failed to update permissions. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    // Only Superadmin or Admin can change roles
    if (editUser.role !== editingUser.role && currentUserRole !== "Admin" && currentUserRole !== "Superadmin") {
      toast.error("Only administrators can change user roles.");
      return;
    }
    
    // Prevent users from changing their own role
    if (editingUser.id === currentUserId && editUser.role !== editingUser.role) {
      toast.error("You cannot change your own role. Please contact another administrator.");
      return;
    }
    
    // Validate form
    if (!validateEditForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    
    setIsUpdating(true);
    setEditErrors({});
    
    try {
      // Prepare update data
      const updateData: any = {
        name: editUser.name.trim(),
        email: editUser.email.trim(),
        status: editUser.status,
      };
      
      // Only include role if Superadmin/Admin is changing someone else's role
      if ((currentUserRole === "Admin" || currentUserRole === "Superadmin") && editingUser.id !== currentUserId && editUser.role) {
        updateData.role = editUser.role;
      }
      
      // Only include password if it's provided
      if (showPasswordField && editUser.password) {
        updateData.password = editUser.password;
      }
      
      // Update user basic info
      const updatedUser = await usersAPI.update(editingUser.id, updateData);

      // Update permissions
      const token = localStorage.getItem("authToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const permissionsResponse = await fetch(`${apiUrl}/users/${editingUser.id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });

      if (!permissionsResponse.ok) {
        throw new Error("Failed to update permissions");
      }

      // Fetch updated user data from backend to get latest permissions
      const updatedUserResponse = await fetch(`${apiUrl}/users/${editingUser.id}`);
      const updatedUserData = await updatedUserResponse.json();
      
      // Update user in list with new permissions from backend
      const userWithPermissions: User = {
        ...updatedUserData,
        permissions: updatedUserData.permissions || selectedPermissions,
      };
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id ? userWithPermissions : u
      );
      setUsers(updatedUsers);
      
      // If updating current logged-in user, update localStorage immediately
      const currentUserStr = localStorage.getItem("user");
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser.id === editingUser.id) {
            const updatedCurrentUser = {
              ...currentUser,
              role: updatedUserData.role || currentUser.role,
              permissions: updatedUserData.permissions || selectedPermissions,
            };
            localStorage.setItem("user", JSON.stringify(updatedCurrentUser));
            // Dispatch event to update sidebar and dashboard immediately
            window.dispatchEvent(new CustomEvent('userPermissionsUpdated', { 
              detail: { permissions: updatedUserData.permissions || selectedPermissions } 
            }));
            // Also trigger a storage event for cross-tab sync
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'user',
              newValue: JSON.stringify(updatedCurrentUser),
              storageArea: localStorage
            }));
          }
        } catch (e) {
          console.error("Failed to update current user data");
        }
      }
      
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditUser({ name: "", email: "", password: "", role: "Sales Executive", status: "Active" });
      setSelectedPermissions([]);
      setShowPasswordField(false);
      setShowPermissionsSection(false);
      setEditErrors({});
      toast.success("User and permissions updated successfully. Changes are now active!");
    } catch (error: any) {
      console.error("Failed to update user:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to update user. Please try again.";
      toast.error(errorMessage);
      if (error?.response?.data?.errors) {
        setEditErrors(error.response.data.errors);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    // Prevent deletion of Superadmin and Admin users
    if (user.role === "Superadmin" || user.role === "Admin") {
      toast.error("Superadmin and Admin users cannot be deleted.");
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleteModalOpen(false);
      await usersAPI.delete(userToDelete.id);
      setUsers(users.filter((u) => u.id !== userToDelete.id));
      setPendingUsers(pendingUsers.filter((u) => u.id !== userToDelete.id));
      toast.success(`User "${userToDelete.name}" deleted successfully`);
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user. Please try again.");
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/users/${userId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to approve user");
      }

      const data = await response.json();
      
      // Remove from pending list and add to active users
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      setUsers([...users, data.user]);
      
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      
      toast.success(`User ${data.user.name} approved successfully!`);
    } catch (error: any) {
      console.error("Failed to approve user:", error);
      toast.error(error.message || "Failed to approve user. Please try again.");
    }
  };

  const handleRejectClick = (user: User) => {
    setUserToReject(user);
    setIsRejectModalOpen(true);
  };

  const handleRejectUser = async () => {
    if (!userToReject) return;

    try {
      setIsRejectModalOpen(false);
      const token = localStorage.getItem("authToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/users/${userToReject.id}/reject`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reject user");
      }

      // Remove from pending list
      setPendingUsers(pendingUsers.filter((u) => u.id !== userToReject.id));
      
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      
      toast.success(`Signup request from "${userToReject.name}" rejected successfully`);
      setUserToReject(null);
    } catch (error: any) {
      console.error("Failed to reject user:", error);
      toast.error(error.message || "Failed to reject user. Please try again.");
      setUserToReject(null);
    }
  };

  const handleCancelReject = () => {
    setIsRejectModalOpen(false);
    setUserToReject(null);
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter((user) => {
      return (
        user.id.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query) ||
        user.lastLogin.includes(query)
      );
    });
  }, [users, searchQuery]);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">User Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage system users and their permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-48 md:w-56">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <IoAdd className="w-4 h-4 sm:w-5 sm:h-5" />
            Add User
          </button>
        </div>
      </div>

      {/* Pending Signup Requests Section - Only for Admin */}
      {(currentUserRole === "Admin" || currentUserRole === "Superadmin") && (
        <div className={`mb-6 ${pendingUsers.length > 0 ? "bg-yellow-50 border-2 border-yellow-200" : "bg-gray-50 border-2 border-gray-200"} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IoShieldCheckmark className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Signup Requests {pendingUsers.length > 0 && `(${pendingUsers.length})`}
              </h2>
            </div>
          </div>
          {pendingUsers.length > 0 ? (
            <div className="space-y-3">
              {pendingUsers.map((pendingUser) => (
                <div
                  key={pendingUser.id}
                  className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{pendingUser.name}</h3>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{pendingUser.email}</p>
                      <p className="text-xs text-gray-500">Role: {pendingUser.role}</p>
                      {pendingUser.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Requested: {new Date(pendingUser.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveUser(pendingUser.id)}
                        className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <IoCheckmarkCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <AnimatedDeleteButton
                        onClick={() => handleRejectClick(pendingUser)}
                        size="sm"
                        title="Delete User"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">No pending signup requests</p>
          )}
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-2 inline-block ${
          filteredUsers.length > 0
            ? "bg-primary-50 border border-primary-200 text-gray-600"
            : "bg-red-50 border border-red-200 text-red-600"
        }`}>
          {filteredUsers.length > 0 ? (
            <>Showing <span className="font-semibold text-primary-700">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> users</>
          ) : (
            <>No users found for "<span className="font-semibold">{searchQuery}</span>"</>
          )}
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <span className="text-sm">Loading users...</span>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500 text-sm">
            {users.length === 0 ? "No users yet" : "No results found"}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{user.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{user.id}</p>
                </div>
                <StatusBadge status={user.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-gray-900 truncate">{user.email}</p>
                  {(currentUserRole === "Admin" || currentUserRole === "Superadmin") && (
                    <>
                      <p className="text-xs text-gray-500 mb-1 mt-2">Password</p>
                      <p className="text-gray-900 truncate font-mono text-xs">{user.password || "Not set"}</p>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {user.role}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Last Login</p>
                  <p className="text-gray-900">{user.lastLogin}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setViewingUser(user);
                    setIsViewModalOpen(true);
                  }}
                  className="flex-1 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <IoEye className="w-4 h-4" />
                  View
                </button>
                <AnimatedEditButton
                  onClick={() => handleEditUser(user)}
                  size="sm"
                  title="Edit User"
                  className="flex-shrink-0"
                />
                {(currentUserRole === "Admin" || currentUserRole === "Superadmin") && (
                  <button 
                    onClick={() => handleOpenPermissions(user)}
                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                    title="Update Permissions"
                  >
                    <IoLockClosed className="w-4 h-4" />
                    Permissions
                  </button>
                )}
                {user.role !== "Admin" && user.role !== "Superadmin" && (
                  <AnimatedDeleteButton
                    onClick={() => handleDeleteClick(user)}
                    size="sm"
                    title="Delete User"
                    className="flex-1"
                  />
                )}
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
                  User
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      <span className="text-sm">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                    {users.length === 0 ? "No users yet" : "No results found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                        <div className="text-sm text-gray-500 truncate">{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-[200px]">
                    <div>
                      <div className="truncate">{user.email}</div>
                      {(currentUserRole === "Admin" || currentUserRole === "Superadmin") && (
                        <div className="text-xs text-gray-600 font-mono mt-1 truncate">
                          {user.password || "Not set"}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setViewingUser(user);
                          setIsViewModalOpen(true);
                        }}
                        className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                        title="View User Details"
                      >
                        <IoEye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <AnimatedEditButton
                        onClick={() => handleEditUser(user)}
                        size="sm"
                        title="Edit User"
                      />
                      {(currentUserRole === "Admin" || currentUserRole === "Superadmin") && (
                        <button 
                          onClick={() => handleOpenPermissions(user)}
                          className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                          title="Update Permissions"
                        >
                          <IoLockClosed className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                      {user.role !== "Admin" && user.role !== "Superadmin" && (
                        <AnimatedDeleteButton
                          onClick={() => handleDeleteClick(user)}
                          size="sm"
                          title="Delete User"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter user name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password (min 6 characters)"
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User["role"] })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            >
              <option value="Superadmin" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Superadmin</option>
              <option value="Admin" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Admin</option>
              <option value="Sales Executive" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Sales Executive</option>
              <option value="Manager" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Manager</option>
              <option value="Service Engineer" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Service Engineer</option>
              <option value="Project Manager" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Project Manager</option>
              <option value="Technician" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Technician</option>
              <option value="Accountant" style={{ color: '#1f2937', backgroundColor: '#ffffff' }}>Accountant</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddUser}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add User
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isUpdating) {
          setIsEditModalOpen(false);
          setEditingUser(null);
            setEditUser({ name: "", email: "", password: "", role: "Sales Executive", status: "Active" });
            setSelectedPermissions([]);
            setShowPasswordField(false);
            setShowPermissionsSection(false);
            setEditErrors({});
          }
        }}
        title="Edit User"
        size="lg"
      >
        {editingUser && (
          <div className="space-y-5">
            {/* User Header Card */}
            <div className="bg-gradient-to-br from-primary-50 via-primary-50/80 to-primary-50 rounded-xl p-5 border-2 border-primary-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-600 to-primary-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {editingUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{editingUser.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <span>📧</span> {editingUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                      {editingUser.role}
                    </span>
                    <StatusBadge status={editingUser.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg border-2 border-gray-100 p-5">
              <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <IoPerson className="w-4 h-4 text-primary-600" />
                </div>
                Basic Information
              </h4>
              <div className="space-y-4 mt-4">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editUser.name}
                    onChange={(e) => {
                      setEditUser({ ...editUser, name: e.target.value });
                      if (editErrors.name) setEditErrors({ ...editErrors, name: "" });
                    }}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      editErrors.name
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-accent-500 focus:border-accent-500"
                    }`}
                    placeholder="Enter full name"
                    disabled={isUpdating}
                  />
                  {editErrors.name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span>⚠</span> {editErrors.name}
                    </p>
                  )}
          </div>

          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={editUser.email}
                    onChange={(e) => {
                      setEditUser({ ...editUser, email: e.target.value });
                      if (editErrors.email) setEditErrors({ ...editErrors, email: "" });
                    }}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      editErrors.email
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-accent-500 focus:border-accent-500"
                    }`}
                    placeholder="user@example.com"
                    disabled={isUpdating}
                  />
                  {editErrors.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span>⚠</span> {editErrors.email}
                    </p>
                  )}
          </div>

                {/* Password Change Option */}
          <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordField(!showPasswordField);
                        if (showPasswordField) {
                          setEditUser({ ...editUser, password: "" });
                          setEditErrors({ ...editErrors, password: "" });
                        }
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      disabled={isUpdating}
                    >
                      {showPasswordField ? "Cancel Change" : "Change Password"}
                    </button>
                  </div>
                  {showPasswordField && (
                    <div>
                      <input
                        type="password"
                        value={editUser.password}
                        onChange={(e) => {
                          setEditUser({ ...editUser, password: e.target.value });
                          if (editErrors.password) setEditErrors({ ...editErrors, password: "" });
                        }}
                        className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                          editErrors.password
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-accent-500 focus:border-accent-500"
                        }`}
                        placeholder="Enter new password (leave empty to keep current)"
                        disabled={isUpdating}
                      />
                      {editErrors.password && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <span>⚠</span> {editErrors.password}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-gray-500">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Role & Status */}
            <div className="bg-white rounded-lg border-2 border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <IoSettings className="w-4 h-4 text-blue-600" />
                  </div>
                  Role & Status
                </h4>
                {(currentUserRole === "Admin" || currentUserRole === "Superadmin") && (
                  <button
                    type="button"
                    onClick={() => setShowPermissionsSection(!showPermissionsSection)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors text-sm font-medium"
                    disabled={isUpdating}
                    title="Update Permissions"
                  >
                    <IoLockClosed className="w-4 h-4" />
                    <span>Permissions</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
            </label>
            <select
              value={editUser.role}
              onChange={(e) => setEditUser({ ...editUser, role: e.target.value as User["role"] })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white text-gray-900 font-medium"
                    disabled={isUpdating || (editingUser && editingUser.id === currentUserId) || (currentUserRole !== "Admin" && currentUserRole !== "Superadmin")}
            >
                    <option value="Superadmin">Superadmin</option>
                    <option value="Admin">Admin</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Manager">Manager</option>
                    <option value="Service Engineer">Service Engineer</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Technician">Technician</option>
                    <option value="Accountant">Accountant</option>
            </select>
            {editingUser && editingUser.id === currentUserId && (
              <p className="text-sm text-red-600 mt-1">You cannot change your own role</p>
            )}
            {currentUserRole !== "Admin" && currentUserRole !== "Superadmin" && (
              <p className="text-sm text-red-600 mt-1">Only administrators can change user roles</p>
            )}
          </div>
          <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
            </label>
            <select
              value={editUser.status}
              onChange={(e) => setEditUser({ ...editUser, status: e.target.value as User["status"] })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white text-gray-900 font-medium"
                    disabled={isUpdating}
            >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
            </select>
          </div>
              </div>
            </div>

            {/* Permissions Section - Only for Admin */}
            {(currentUserRole === "Admin" || currentUserRole === "Superadmin") && showPermissionsSection && (
              <div className="bg-white rounded-lg border-2 border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <IoShieldCheckmark className="w-4 h-4 text-purple-600" />
                    </div>
                    Access Permissions
                  </h4>
                  <span className="px-3 py-1.5 bg-primary-100 text-primary-800 rounded-lg text-sm font-bold">
                    {selectedPermissions.length} Selected
                  </span>
                </div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto border-2 border-gray-200 rounded-lg p-4 bg-gray-50 mt-4">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.label} className="bg-white rounded-lg p-3 border border-gray-200">
                      <h6 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                        {group.label}
                      </h6>
                      <div className="space-y-2">
                        {group.permissions.map((perm) => (
                          <label
                            key={perm.key}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              selectedPermissions.includes(perm.key)
                                ? "bg-primary-50 border-2 border-primary-200"
                                : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-accent-500 focus:ring-2"
                              disabled={isUpdating}
                            />
                            <span className={`text-sm flex-1 ${selectedPermissions.includes(perm.key) ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                              {perm.label}
                            </span>
                            {selectedPermissions.includes(perm.key) && (
                              <span className="text-primary-600 text-xs">✓</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons - Clean Design */}
            <div className="mt-6 pt-4 pb-2">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Update Button */}
            <button
              onClick={handleUpdateUser}
                  disabled={isUpdating}
                  className="group relative flex-1 px-5 py-2.5 bg-gradient-to-r from-accent-600 to-accent-700 text-white rounded-lg hover:from-accent-700 hover:to-accent-800 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99]"
            >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <IoCheckmarkCircle className="w-4 h-4" />
                      <span>Update User</span>
                    </>
                  )}
            </button>
                
                {/* Cancel Button */}
            <button
              onClick={() => {
                    if (!isUpdating) {
                setIsEditModalOpen(false);
                setEditingUser(null);
                      setEditUser({ name: "", email: "", password: "", role: "Sales Executive", status: "Active" });
                      setSelectedPermissions([]);
                      setShowPasswordField(false);
                      setShowPermissionsSection(false);
                      setEditErrors({});
                    }
                  }}
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full flex items-center justify-center gap-2"
            >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
            </button>
          </div>
        </div>
          </div>
        )}
      </Modal>

      {/* Permissions Update Modal */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          if (!isUpdating) {
            setIsPermissionsModalOpen(false);
            setPermissionsUser(null);
            setSelectedPermissions([]);
          }
        }}
        title="Update Permissions"
        size="lg"
      >
        {permissionsUser && (
          <div className="space-y-5">
            {/* User Header Card */}
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 rounded-xl p-5 border-2 border-purple-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {permissionsUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{permissionsUser.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <span>📧</span> {permissionsUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                      {permissionsUser.role}
                    </span>
                    <StatusBadge status={permissionsUser.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="bg-white rounded-lg border-2 border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <IoShieldCheckmark className="w-4 h-4 text-purple-600" />
                  </div>
                  Access Permissions
                </h4>
                <span className="px-3 py-1.5 bg-primary-100 text-primary-800 rounded-lg text-sm font-bold">
                  {selectedPermissions.length} Selected
                </span>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto border-2 border-gray-200 rounded-lg p-4 bg-gray-50 mt-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.label} className="bg-white rounded-lg p-3 border border-gray-200">
                    <h6 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                      {group.label}
                    </h6>
                    <div className="space-y-2">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            selectedPermissions.includes(perm.key)
                              ? "bg-primary-50 border-2 border-primary-200"
                              : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-accent-500 focus:ring-2"
                            disabled={isUpdating}
                          />
                          <span className={`text-sm flex-1 ${selectedPermissions.includes(perm.key) ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                            {perm.label}
                          </span>
                          {selectedPermissions.includes(perm.key) && (
                            <span className="text-primary-600 text-xs">✓</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 pb-2">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <button
                  onClick={handleUpdatePermissions}
                  disabled={isUpdating}
                  className="group relative flex-1 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <IoLockClosed className="w-4 h-4" />
                      <span>Update Permissions</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    if (!isUpdating) {
                      setIsPermissionsModalOpen(false);
                      setPermissionsUser(null);
                      setSelectedPermissions([]);
                    }
                  }}
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full flex items-center justify-center gap-2"
            >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
            </button>
          </div>
        </div>
          </div>
        )}
      </Modal>

      {/* View User Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingUser(null);
        }}
        title="User Details"
        size="lg"
      >
        {viewingUser && (
          <div className="space-y-5">
            {/* User Header Card */}
            <div className="bg-gradient-to-br from-primary-50 via-primary-50/80 to-primary-50 rounded-xl p-6 border-2 border-primary-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-primary-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                  {viewingUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{viewingUser.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                    <span>📧</span> {viewingUser.email}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                      {viewingUser.role}
                    </span>
                    <StatusBadge status={viewingUser.status} />
                </div>
                </div>
              </div>
            </div>

            {/* User Information Card */}
            <div className="bg-white rounded-lg border-2 border-gray-100 p-5">
              <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <IoPerson className="w-4 h-4 text-blue-600" />
                  </div>
                User Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Email Address</label>
                  <p className="text-sm text-gray-900 font-medium break-words">{viewingUser.email}</p>
                </div>
                {(currentUserRole === "Admin" || currentUserRole === "Superadmin") && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Password</label>
                    <p className="text-sm text-gray-900 font-mono break-words">
                      {viewingUser.password || <span className="text-gray-400 italic">Not set</span>}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">User ID</label>
                  <p className="text-xs text-gray-600 font-mono break-all">{viewingUser.id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Last Login</label>
                  <p className="text-sm text-gray-900 font-medium">{viewingUser.lastLogin || "Never"}</p>
                  </div>
                </div>
                  </div>

            {/* Permissions Section */}
            <div className="bg-white rounded-lg border-2 border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <IoShieldCheckmark className="w-4 h-4 text-purple-600" />
                </div>
                  Access Permissions
                </h4>
                <span className="px-3 py-1.5 bg-primary-100 text-primary-800 rounded-lg text-sm font-bold">
                  {viewingUser.permissions?.length || 0} Permissions
                    </span>
                  </div>
              {viewingUser.permissions && viewingUser.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4">
                  {viewingUser.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-3 py-1.5 bg-primary-50 border border-primary-200 text-primary-800 rounded-lg text-xs font-semibold"
                    >
                      ✓ {permission}
                    </span>
                  ))}
                  </div>
              ) : (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <p className="text-sm text-gray-500 font-medium">No permissions assigned</p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-2 pb-2">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingUser(null);
                }}
                className="w-full px-5 py-2.5 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDelete} title="Delete User">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center">
                  <AnimatedDeleteButton
                    size="md"
                    title="Delete"
                    className="cursor-default pointer-events-none"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are you sure you want to delete this user?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. The user will be permanently removed from the system.
                </p>
                
                {/* User Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {userToDelete.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{userToDelete.name}</p>
                      <p className="text-sm text-gray-600">{userToDelete.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Role</p>
                      <p className="text-sm font-medium text-gray-900">{userToDelete.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <StatusBadge status={userToDelete.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 33 39" className="w-4 h-4">
                  <path fill="white" d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
                  <path strokeWidth={4} stroke="white" d="M12 6L12 29" />
                  <path strokeWidth={4} stroke="white" d="M21 6V29" />
                </svg>
                Yes, Delete User
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Signup Request Confirmation Modal */}
      {isRejectModalOpen && userToReject && (
        <Modal isOpen={isRejectModalOpen} onClose={handleCancelReject} title="Reject Signup Request">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center">
                  <AnimatedDeleteButton
                    size="md"
                    title="Reject"
                    className="cursor-default pointer-events-none border-yellow-500 bg-yellow-500"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are you sure you want to reject this signup request?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. The signup request will be permanently deleted and the user will not be able to login.
                </p>
                
                {/* User Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {userToReject.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{userToReject.name}</p>
                      <p className="text-sm text-gray-600">{userToReject.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Role</p>
                      <p className="text-sm font-medium text-gray-900">{userToReject.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <StatusBadge status={userToReject.status} />
                    </div>
                    {userToReject.createdAt && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Requested Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(userToReject.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelReject}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectUser}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 33 39" className="w-4 h-4">
                  <path fill="white" d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
                  <path strokeWidth={4} stroke="white" d="M12 6L12 29" />
                  <path strokeWidth={4} stroke="white" d="M21 6V29" />
                </svg>
                Yes, Reject Request
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

