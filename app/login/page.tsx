"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IoMail, IoLockClosed, IoEye, IoEyeOff, IoLogIn, IoCall, IoLocation } from "react-icons/io5";

const DEFAULT_EMAIL = "elevatoradmin@damsole.com";
const DEFAULT_PASSWORD = "K@SElev@toradmin";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      // Clean up the URL - fix common typos
      apiUrl = apiUrl.trim().replace(/\/+$/, '');
      // Fix http// or https// to http:// or https://
      apiUrl = apiUrl.replace(/^http\/\//, 'http://').replace(/^https\/\//, 'https://');
      // Ensure it starts with http:// or https://
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
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
      if (error.message?.includes("fetch") || 
          error.message?.includes("network") || 
          error.message?.includes("Failed to fetch") ||
          error.name === "TypeError" ||
          error.message?.includes("ERR_CONNECTION_REFUSED") ||
          error.message?.includes("ECONNREFUSED")) {
        setError("Failed to connect to server. Please ensure the backend server is running on port 5000.");
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8f7]">
      <Navigation />

      {/* Login Section - centered, clean layout */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-[400px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 p-6 sm:p-8"
          >
            {/* Header - compact logo */}
            <div className="text-center mb-7">
              <img
                src="/kas%20img.png"
                alt="Damsole"
                className="h-8 sm:h-10 w-auto object-contain mx-auto mb-2"
              />
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
              <p className="text-sm text-gray-500">Sign in to Damsole Elevator CRM</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm"
                >
                  <span className="flex-shrink-0 inline-flex w-5 h-5 rounded-full bg-red-200 items-center justify-center text-xs font-bold">!</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <IoMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 focus:bg-white transition-all"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="#" className="text-xs text-accent-600 hover:text-accent-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <IoLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50/80 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 focus:bg-white transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <IoEyeOff className="w-5 h-5" /> : <IoEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: isSubmitting ? "#b91c1c" : "#c41e2a" }}
                className="w-full py-3.5 rounded-xl text-white font-medium shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c41e2a] disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 mt-1 border-0"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <IoLogIn className="w-5 h-5" />
                    <span>Sign in</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don’t have an account?{" "}
              <Link href="/signup" className="font-medium text-accent-600 hover:text-accent-700 focus:outline-none focus:underline">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer - compact, scannable */}
      <footer className="bg-gray-900 text-gray-300 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
          <p className="text-white font-semibold text-base mb-4 text-center">AiDamsole Agile Services Pvt Ltd</p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <a href="mailto:sales@damsole.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <IoMail className="h-4 w-4 text-accent-400 flex-shrink-0" aria-hidden />
              sales@damsole.com
            </a>
            <a href="tel:+919356917424" className="flex items-center gap-2 hover:text-white transition-colors">
              <IoCall className="h-4 w-4 text-accent-400 flex-shrink-0" aria-hidden />
              +91 93569 17424
            </a>
            <div className="flex items-center gap-2 text-center sm:text-left max-w-xs sm:max-w-sm">
              <IoLocation className="h-4 w-4 text-accent-400 flex-shrink-0 mt-0.5" aria-hidden />
              <span className="text-gray-400">
                1st Floor, Madhuban Complex, Office no. 103, 104, near Maxcare Hospital, Manchar, Maharashtra 410503
              </span>
            </div>
          </div>
          <p className="mt-5 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
            © 2026 AiDamsole Agile Services Pvt Ltd
          </p>
        </div>
      </footer>
    </div>
  );
}
