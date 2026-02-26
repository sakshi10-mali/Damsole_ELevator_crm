"use client";

import { useState, type FormEvent } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  IoCheckmarkCircle,
  IoArrowForward,
  IoHammer,
  IoShieldCheckmark,
  IoTime,
  IoPeople,
  IoDocumentText,
  IoConstruct,
} from "react-icons/io5";

export default function ServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/amc-quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitStatus(null);
        }, 2000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Failed to submit request:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    {
      icon: <IoHammer className="w-12 h-12" />,
      title: "Installation Services",
      description: "Professional installation by certified technicians ensuring optimal performance and safety compliance.",
      points: [
        "Expert installation team",
        "Minimal disruption",
        "Quality assurance",
        "Post-installation support",
      ],
      color: "text-gray-600 bg-gray-100",
      showLearnMore: true,
    },
    {
      icon: <IoShieldCheckmark className="w-12 h-12" />,
      title: "AMC & Maintenance",
      description: "Comprehensive Annual Maintenance Contracts to keep your elevators running smoothly and safely.",
      points: [
        "Regular inspections",
        "Preventive maintenance",
        "24/7 support",
        "Priority service",
      ],
      color: "text-gray-600 bg-gray-100",
      showLearnMore: true,
    },
    {
      icon: <IoTime className="w-12 h-12" />,
      title: "Emergency Repairs",
      description: "Round-the-clock emergency repair services to minimize downtime and ensure safety.",
      points: [
        "24/7 availability",
        "Rapid response",
        "Expert technicians",
        "Genuine parts",
      ],
      color: "text-red-600 bg-red-50",
      showLearnMore: true,
    },
    {
      icon: <IoPeople className="w-12 h-12" />,
      title: "Modernization",
      description: "Upgrade your existing elevators with latest technology for improved performance and efficiency.",
      points: [
        "Technology upgrade",
        "Energy efficiency",
        "Enhanced safety",
        "Extended lifespan",
      ],
      color: "text-purple-600 bg-purple-50",
      showLearnMore: true,
    },
    {
      icon: <IoDocumentText className="w-12 h-12" />,
      title: "Consultation Services",
      description: "Expert guidance on elevator selection, design, and compliance with building codes.",
      points: [
        "Technical consultation",
        "Design assistance",
        "Code compliance",
        "Cost optimization",
      ],
      color: "text-orange-600 bg-orange-50",
      showLearnMore: true,
    },
    {
      icon: <IoConstruct className="w-12 h-12" />,
      title: "Spare Parts Supply",
      description: "Genuine spare parts and components available for all our elevator models.",
      points: [
        "Original parts",
        "Quick delivery",
        "Competitive pricing",
        "Quality guarantee",
      ],
      color: "text-blue-600 bg-blue-50",
      showLearnMore: true,
    },
  ];

  const processSteps = [
    {
      number: "01",
      title: "Request",
      description: "Contact us with your service requirements",
    },
    {
      number: "02",
      title: "Assessment",
      description: "Our experts evaluate your needs and provide a quote",
    },
    {
      number: "03",
      title: "Service",
      description: "Professional execution by certified technicians",
    },
    {
      number: "04",
      title: "Follow-up",
      description: "Quality check and ongoing support",
    },
  ];

  return (
    <div className="min-h-screen bg-primary-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
        {/* Background Image/Video */}
        <div className="absolute inset-0 w-full h-full">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/premium_home.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-6 drop-shadow-2xl"
              style={{ textShadow: "0 4px 20px rgba(0, 0, 0, 0.6), 0 2px 10px rgba(0, 0, 0, 0.5)" }}
            >
              Our Services
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl text-white font-light drop-shadow-lg"
              style={{ textShadow: "0 2px 15px rgba(0, 0, 0, 0.5), 0 1px 5px rgba(0, 0, 0, 0.4)" }}
            >
              Comprehensive elevator solutions from installation to maintenance
            </motion.p>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2"
              >
                {/* Icon */}
                <div className={`w-20 h-20 ${service.color} rounded-full flex items-center justify-center mb-6`}>
                  {service.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-6 text-base sm:text-lg">
                  {service.description}
                </p>

                {/* Bullet Points */}
                <ul className="space-y-2 mb-6">
                  {service.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-2 text-gray-700">
                      <IoCheckmarkCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{point}</span>
                    </li>
                  ))}
                </ul>

                {/* Learn More Link */}
                {service.showLearnMore && (
                  <Link
                    href="#contact"
                    className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors text-sm sm:text-base"
                  >
                    Learn More <IoArrowForward className="ml-2" />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Annual Maintenance Contract Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 sm:mb-8">
                Annual Maintenance Contract
              </h2>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg mb-6">
                Our AMC services ensure your elevators operate at peak performance throughout the year. We offer comprehensive maintenance packages tailored to your specific needs.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Monthly scheduled inspections and maintenance",
                  "Priority emergency response (24/7)",
                  "Replacement of consumables and minor parts",
                  "Lubrication and cleaning services",
                  "Compliance with safety regulations",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <IoCheckmarkCircle className="w-6 h-6 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span className="text-base sm:text-lg">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition-all transform hover:scale-105 shadow-lg"
              >
                Get AMC Quote
              </button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative h-[400px] sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src="/maintainance_main.jpg"
                alt="Elevator maintenance"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Service Process Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-6">
              Our Service Process
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              A systematic approach to ensure quality and customer satisfaction
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="text-center"
              >
                {/* Step Number Circle */}
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-white text-2xl font-bold">{step.number}</span>
                </div>
                
                {/* Step Title */}
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                
                {/* Step Description */}
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 sm:mb-8 px-4">
              Need Professional Elevator Services?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-200 mb-10 sm:mb-12 max-w-3xl mx-auto px-4 font-light leading-relaxed">
              Contact us today to discuss your requirements and get a customized service plan.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
              <Link
                href="/contact"
                className="px-8 py-4 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-all transform hover:scale-105 shadow-lg w-full sm:w-auto"
              >
                Contact Us
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-slate-900 transition-all transform hover:scale-105 w-full sm:w-auto"
              >
                Request Service
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* AMC Quote Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Get AMC Quote</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSubmitStatus(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-2xl text-gray-500">&times;</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitStatus === "success" && (
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg text-primary-800">
                  <div className="flex items-center gap-2">
                    <IoCheckmarkCircle className="w-5 h-5" />
                    <span>Request submitted successfully! We'll contact you soon.</span>
                  </div>
                </div>
              )}
              {submitStatus === "error" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  Failed to submit request. Please try again.
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your name"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tell us about your requirements..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSubmitStatus(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

