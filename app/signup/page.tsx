"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IoPerson, IoMail, IoLockClosed, IoEye, IoEyeOff, IoCall, IoShieldCheckmark, IoChevronDown } from "react-icons/io5";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Sales Executive",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation helper functions
  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    // Allow only up to 10 digits
    if (cleaned.length <= 10) {
      setFormData({ ...formData, phone: cleaned });
    }
  };

  const handleTextChange = (field: 'firstName' | 'lastName', value: string) => {
    // Allow only letters, spaces, and common punctuation for names
    const cleaned = value.replace(/[^a-zA-Z\s\.\-'']/g, '');
    setFormData({ ...formData, [field]: cleaned });
  };

  const validatePhone = (phone: string): boolean => {
    // Must be exactly 10 digits
    return /^\d{10}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (/\d/.test(formData.firstName)) {
      setError("First name should only contain letters and spaces.");
      setIsSubmitting(false);
      return;
    }

    if (/\d/.test(formData.lastName)) {
      setError("Last name should only contain letters and spaces.");
      setIsSubmitting(false);
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setError("Phone number must be exactly 10 digits.");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create account" }));
        setError(errorData.error || "Failed to create account. Please try again.");
        return;
      }

      const data = await response.json();

      if (data.message) {
        setSuccess(true);
        // Show message that admin approval is needed
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Failed to create account. Please try again.");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.message?.includes("fetch") || error.message?.includes("network")) {
        setError("Failed to connect to server. Please ensure the backend server is running on port 5000.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <Navigation />
      
      {/* Signup Section */}
      <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
        {/* Background Gradient Elements */}
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
                <div className="w-16 h-16 bg-gradient-to-br from-accent-600 to-accent-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <IoPerson className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
                  Create Account
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Join Damsole Technologies CRM Platform</p>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Signup Request Submitted!</h3>
                  <p className="text-gray-600 mb-2">Your account request has been sent to the administrator.</p>
                  <p className="text-sm text-gray-500 mb-4">You will be able to login once your request is approved.</p>
                  <p className="text-sm text-gray-500">Redirecting to login page...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <div className="relative">
                        <IoPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => handleTextChange('firstName', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white/50"
                          placeholder="First name (text only)"
                          pattern="[A-Za-z\s\.\-\'']+"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <div className="relative">
                        <IoPerson className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => handleTextChange('lastName', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white/50"
                          placeholder="Last name (text only)"
                          pattern="[A-Za-z\s\.\-\'']+"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <IoCall className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white/50"
                        placeholder="Enter 10 digit phone number"
                      />
                      {formData.phone && formData.phone.length !== 10 && (
                        <p className="text-xs text-red-600 mt-1">Phone number must be exactly 10 digits</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <div className="relative">
                      <IoShieldCheckmark className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white/50 appearance-none cursor-pointer"
                      >
                        <option value="Sales Executive">Sales Executive</option>
                        <option value="Service Engineer">Service Engineer</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Accounts">Accounts</option>
                        <option value="Manager">Manager</option>
                        <option value="Technician">Technician</option>
                        <option value="Accountant">Accountant</option>
                      </select>
                      <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <IoLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white/50"
                        placeholder="Minimum 6 characters"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <IoLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all bg-white/50"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
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
                    className="w-full px-6 py-3 bg-gradient-to-r from-accent-600 to-accent-700 text-white rounded-lg font-semibold hover:from-accent-700 hover:to-accent-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <IoPerson className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link 
                    href="/login" 
                    className="font-medium bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent hover:from-primary-700 hover:to-primary-800 transition-all"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}




