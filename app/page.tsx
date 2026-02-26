"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import Navigation from "@/components/Navigation";
import { IoMail, IoLockClosed, IoEye, IoEyeOff, IoLogIn, IoCall, IoLocation } from "react-icons/io5";

const DEFAULT_EMAIL = "admin@kas.com";
const DEFAULT_PASSWORD = "K@SElev@toradmin";

export default function LandingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      apiUrl = apiUrl.trim().replace(/\/+$/, "");
      apiUrl = apiUrl.replace(/^http\/\//, "http://").replace(/^https\/\//, "https://");
      if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
        apiUrl = `http://${apiUrl}`;
      }
      const loginUrl = `${apiUrl}/auth/login`;

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Login failed" }));
        if (response.status === 401) {
          setError(errorData.error || "Invalid email or password. Please check your credentials and try again.");
        } else {
          setError(errorData.error || "Login failed. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();

      if (data.token && data.user) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError("Login failed. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (
        error.message?.includes("fetch") ||
        error.message?.includes("network") ||
        error.message?.includes("Failed to fetch") ||
        error.name === "TypeError" ||
        error.message?.includes("ERR_CONNECTION_REFUSED") ||
        error.message?.includes("ECONNREFUSED")
      ) {
        setError("Failed to connect to server. Please ensure the backend server is running on port 5000.");
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* <Navigation /> */}

      {/* Login Section */}
      <section className="flex-1 py-12 sm:py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-primary-100/50"
            >
              <div className="text-center mb-6 sm:mb-8">
                {logoError ? (
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Damsole Technologies</div>
                ) : (
                  <img
                    src="/kas%20img.png"
                    alt="Damsole Technologies"
                    className="h-28 sm:h-32 md:h-40 w-auto object-contain mx-auto"
                    onError={() => setLogoError(true)}
                  />
                )}
                <p className="text-sm sm:text-base text-gray-600">Welcome back to Damsole Elevator CRM</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <IoMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white/50"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <IoLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white/50"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <IoEyeOff className="w-5 h-5" />
                      ) : (
                        <IoEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ background: "linear-gradient(to right, #c41e2a, #b91c1c)" }}
                  className="w-full px-6 py-3 text-white rounded-lg font-semibold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <IoLogIn className="w-5 h-5" />
                      <span>Login</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-white font-semibold text-lg mb-4">AiDamsole Agile Services Pvt Ltd</p>
          <div className="flex flex-col items-center gap-3 text-sm">
            <a href="mailto:sales@damsole.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <IoMail className="h-4 w-4 text-accent-400" />
              sales@damsole.com
            </a>
            <a href="tel:+919356917424" className="flex items-center gap-2 hover:text-white transition-colors">
              <IoCall className="h-4 w-4 text-accent-400" />
              +91 93569 17424
            </a>
            <div className="flex items-center gap-2">
              <IoLocation className="h-4 w-4 text-accent-400 flex-shrink-0" />
              <span>1st Floor, Madhuban Complex, Office no. 103, 104, near Maxcare Hospital, Manchar, Maharashtra 410503</span>
            </div>
          </div>
          <p className="mt-8 pt-6 border-t border-gray-700 text-xs text-gray-500">
            Copyright@2026. AiDamsole Agile services Pvt Ltd.
          </p>
        </div>
      </footer>
    </div>
  );
}
