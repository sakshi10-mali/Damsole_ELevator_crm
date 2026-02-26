"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { IoCheckmarkCircle, IoArrowBack, IoHome } from "react-icons/io5";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-primary-50">
      <Navigation />
      
      {/* Thank You Section */}
      <section className="py-20 sm:py-28 md:py-32 lg:py-40">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary-100 rounded-full flex items-center justify-center">
                <IoCheckmarkCircle className="w-16 h-16 sm:w-20 sm:h-20 text-primary-600" />
              </div>
            </motion.div>

            {/* Thank You Message */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4"
            >
              Thank You!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8"
            >
              Your message has been sent successfully.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-base sm:text-lg text-gray-600 mb-12 leading-relaxed"
            >
              We've received your message and our team will get back to you soon. 
              We appreciate your interest in Damsole Technologies and look forward to assisting you.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-accent-600 text-white rounded-lg font-semibold hover:bg-accent-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <IoHome className="w-5 h-5" />
                Back to Home
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                <IoArrowBack className="w-5 h-5" />
                Back to Contact
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

