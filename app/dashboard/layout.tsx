"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ToastContainer, toast as toastManager, Toast } from "@/components/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Memoize toggle function to prevent dependency array issues
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Subscribe to toast notifications
  useEffect(() => {
    const unsubscribe = toastManager.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Verify token with backend and refresh user data
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Clean up the URL - fix common typos
    apiUrl = apiUrl.trim().replace(/\/+$/, '');
    // Fix http// or https// to http:// or https://
    apiUrl = apiUrl.replace(/^http\/\//, 'http://').replace(/^https\/\//, 'https://');
    // Ensure it starts with http:// or https://
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `http://${apiUrl}`;
    }
    fetch(`${apiUrl}/auth/verify`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      .then(async (res) => {
          if (!res.ok) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            router.push("/login");
          } else {
          // Refresh user data from backend to get latest permissions
          const userStr = localStorage.getItem("user");
          if (userStr) {
            try {
              const currentUser = JSON.parse(userStr);
              // Fetch latest user data including permissions and role
              const userResponse = await fetch(`${apiUrl}/users/${currentUser.id}`);
              if (userResponse.ok) {
                const updatedUser = await userResponse.json();
                const updatedUserData = {
                  ...currentUser,
                  role: updatedUser.role || currentUser.role,
                  permissions: updatedUser.permissions || currentUser.permissions || [],
                };
                localStorage.setItem("user", JSON.stringify(updatedUserData));
                // Trigger sidebar update
                window.dispatchEvent(new CustomEvent('userPermissionsUpdated', { 
                  detail: { permissions: updatedUser.permissions || [] } 
                }));
              }
            } catch (e) {
              console.error("Failed to refresh user data");
            }
          }
          setIsLoading(false);
          }
        })
        .catch(() => {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          router.push("/login");
        });
  }, [router]);

  // Listen for permission updates
  useEffect(() => {
    const handlePermissionsUpdate = () => {
      // Refresh page data if needed
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Permissions updated, sidebar will handle the update
          // Dashboard pages can check permissions on mount
        } catch (e) {
          // Ignore
        }
      }
    };

    window.addEventListener('userPermissionsUpdated', handlePermissionsUpdate);
    return () => {
      window.removeEventListener('userPermissionsUpdated', handlePermissionsUpdate);
    };
  }, []);

  // Close sidebar on mobile when route changes and prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    // Only run if not loading (to avoid hooks order issues)
    if (isLoading) return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop: keep sidebar state
        document.body.style.overflow = 'unset';
        return;
      } else {
        // Mobile: close sidebar by default
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
        }
      }
    };

    // Prevent body scroll when sidebar is open on mobile
    if (isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 relative overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={handleToggleSidebar} />
      <div className="flex-1 flex flex-col w-full lg:w-auto relative z-10 min-w-0 overflow-hidden">
        <Topbar onSidebarToggle={handleToggleSidebar} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-white via-primary-50/20 to-white min-w-0 w-full">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
        <footer className="flex-shrink-0 py-3 px-4 border-t border-gray-200 bg-white/80 text-center text-xs sm:text-sm text-gray-500">
          Copyright@2026. AiDamsole Agile services Pvt Ltd.
        </footer>
      </div>
      <ToastContainer toasts={toasts} onRemove={toastManager.remove} />
    </div>
  );
}




