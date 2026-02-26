"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoCall,
  IoMail,
  IoLocation,
  IoTime,
} from "react-icons/io5";

export default function ContactPage() {
  const router = useRouter();
  
  // Validation helper functions
  const handlePhoneChange = (value: string, setFormDataFn: any, formDataObj: any) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    // Allow only up to 10 digits
    if (cleaned.length <= 10) {
      setFormDataFn({ ...formDataObj, phone: cleaned });
    }
  };

  const handleTextChange = (field: string, value: string, setFormDataFn: any, formDataObj: any) => {
    // Allow only letters, spaces, and common punctuation for names
    const cleaned = value.replace(/[^a-zA-Z\s\.\-'']/g, '');
    setFormDataFn({ ...formDataObj, [field]: cleaned });
  };

  const validatePhone = (phone: string): boolean => {
    // Must be exactly 10 digits
    return /^\d{10}$/.test(phone);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    // Validation
    if (/\d/.test(formData.name)) {
      setErrorMessage("Name should only contain letters and spaces.");
      setIsSubmitting(false);
      setSubmitStatus("error");
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setErrorMessage("Phone number must be exactly 10 digits.");
      setIsSubmitting(false);
      setSubmitStatus("error");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        // Redirect to thank you page
        router.push("/thank-you");
      } else {
        setSubmitStatus("error");
        setErrorMessage(data.error || "Failed to send message. Please try again.");
        console.error("Submission error:", data.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Failed to submit contact form:", error);
      setSubmitStatus("error");
      if (error.message?.includes("fetch") || error.name === "TypeError") {
        setErrorMessage("Cannot connect to server. Please ensure the backend server is running on port 5000.");
      } else {
        setErrorMessage("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-44 pb-20 sm:pb-28 md:pb-32 lg:pb-40 bg-cover bg-center bg-no-repeat text-white" 
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/Contact.jpg')",
        }}>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">Contact Us</h1>
            <p className="text-base sm:text-lg md:text-xl text-white">
              Get in touch with our team - we're here to help
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitStatus === "error" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <p className="font-semibold mb-1">Failed to send message</p>
                    <p className="text-sm">{errorMessage || "Please check if the backend server is running and MongoDB is connected. Try again later."}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleTextChange('name', e.target.value, setFormData, formData)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your name (text only)"
                    pattern="[A-Za-z\s\.\-\'']+"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value, setFormData, formData)}
                    maxLength={10}
                    pattern="[0-9]{10}"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter 10 digit phone number"
                  />
                  {formData.phone && formData.phone.length !== 10 && (
                    <p className="text-xs text-red-600 mt-1">Phone number must be exactly 10 digits</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your message"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We're here to answer your questions and help you find the perfect elevator solution
                for your needs. Reach out to us through any of the following channels.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IoCall className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <p className="text-gray-600">+91 8019219911</p>
                    <p className="text-sm text-gray-500">Mon - Sat, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IoMail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600">assist@damsoletechnologies.com</p>
                    <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IoLocation className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Office Address</h3>
                    <p className="text-gray-600">
                      Damsole Technologies<br />
                      India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IoTime className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Saturday: 9:00 AM - 6:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



