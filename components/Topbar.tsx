"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoNotifications, IoLogOut, IoPerson, IoSettings, IoMenu, IoTrash, IoClose } from "react-icons/io5";
import { notificationsAPI, Notification } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TopbarProps {
  onSidebarToggle?: () => void;
}

// Helper function to format time
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
};

export default function Topbar({ onSidebarToggle }: TopbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load user data and refresh from backend
  useEffect(() => {
    const loadUserData = async () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          
          // Refresh user data from backend to get latest role
          if (userData.id) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            try {
              const userResponse = await fetch(`${apiUrl}/users/${userData.id}`);
              if (userResponse.ok) {
                const updatedUser = await userResponse.json();
                const updatedUserData = {
                  ...userData,
                  role: updatedUser.role || userData.role,
                  permissions: updatedUser.permissions || userData.permissions || [],
                };
                setUser(updatedUserData);
                localStorage.setItem("user", JSON.stringify(updatedUserData));
              }
            } catch (error) {
              console.error("Failed to refresh user data:", error);
            }
          }
        } catch (e) {
          console.error("Failed to parse user data");
        }
      }
    };
    
    loadUserData();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch (e) {
          console.error("Failed to parse user data");
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for localStorage changes (for same-tab updates)
    const interval = setInterval(() => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(prevUser => {
            if (prevUser?.id !== userData.id || prevUser?.role !== userData.role) {
              return userData;
            }
            return prevUser;
          });
        } catch (e) {
          console.error("Failed to parse user data");
        }
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      if (!user?.id) return;
      
      const data = await notificationsAPI.getAll(user.id);
      // Ensure all notifications have an id field (fallback to _id if needed)
      const normalizedData = Array.isArray(data) ? data.map((notif: any) => ({
        ...notif,
        id: notif.id || notif._id || notif._id?.toString(),
      })).filter((notif: any) => notif.id && notif.id !== "undefined") : [];
      
      setNotifications(normalizedData);
      
      // Update unread count
      const unread = await notificationsAPI.getUnreadCount(user.id);
      setUnreadCount(unread.count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      
      // Listen for custom event to refresh notifications immediately
      const handleRefresh = () => {
        fetchNotifications();
      };
      window.addEventListener('refreshNotifications', handleRefresh);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshNotifications', handleRefresh);
      };
    }
  }, [user?.id]);

  // Mark notification as read
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationsAPI.markAsRead(notification.id);
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Refresh count from server
        if (user?.id) {
          const unread = await notificationsAPI.getUnreadCount(user.id);
          setUnreadCount(unread.count);
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    setShowNotifications(false);
  };

  // Delete notification
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent triggering the click handler
    
    // Validate notification ID
    if (!notificationId || notificationId === "undefined") {
      console.error("Invalid notification ID:", notificationId);
      return;
    }
    
    try {
      // Remove from local state immediately
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const newNotifications = prev.filter(n => n.id !== notificationId);
        // If deleted notification was unread, update count
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return newNotifications;
      });
      
      // Delete from server
      await notificationsAPI.delete(notificationId);
      
      // Refresh count from server
      if (user?.id) {
        const unread = await notificationsAPI.getUnreadCount(user.id);
        setUnreadCount(unread.count);
        // Refresh notifications list
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      // Revert on error - refresh from server
      if (user?.id) {
        fetchNotifications();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-16 bg-gradient-to-r from-white via-primary-50/50 to-white border-b border-primary-200/50 flex items-center justify-between px-3 sm:px-4 md:px-6 relative z-[60] shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4">
        {onSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-accent-600"
            aria-label="Toggle sidebar"
          >
            <IoMenu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
        <h2 
          className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 cursor-pointer hover:text-accent-600 transition-colors whitespace-nowrap"
          onClick={() => router.push("/dashboard")}
        >
          Damsole CRM
        </h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {/* Notifications - Clickable with Dropdown */}
        <div className="relative">
          {notifications.length > 0 && (
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              title="Notifications"
            >
              <IoNotifications className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          
          {/* Notifications Dropdown */}
          {showNotifications && notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Close"
                >
                  <IoClose className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500">Loading...</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 relative group ${
                      !notif.read ? "bg-primary-50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                      </div>
                      {notif.id && notif.id !== "undefined" && (
                        <button
                          onClick={(e) => handleDeleteNotification(e, notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all flex-shrink-0"
                          title="Delete notification"
                        >
                          <IoTrash className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Info and Avatar - Clickable with Dropdown */}
        <div className="relative">
          <div 
            className="flex items-center gap-1.5 sm:gap-2 md:gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-1 sm:px-2 py-1 transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="text-right hidden lg:block">
              <div className="text-xs sm:text-sm font-semibold text-gray-900">{user?.name || "User"}</div>
              <div className="text-[10px] sm:text-xs text-gray-500">{user?.role || "Role"}</div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-accent-600 to-accent-700 flex items-center justify-center text-white text-xs sm:text-sm font-semibold cursor-pointer hover:from-accent-700 hover:to-accent-800 transition-all shadow-md">
              {user ? getInitials(user.name) : "U"}
            </div>
          </div>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="font-semibold text-gray-900">{user?.name || "User"}</p>
                <p className="text-sm text-gray-500">{user?.email || ""}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push("/dashboard/settings");
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <IoSettings className="w-4 h-4" />
                Settings
              </button>
              <div className="border-t border-gray-200 mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <IoLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </div>
  );
}






