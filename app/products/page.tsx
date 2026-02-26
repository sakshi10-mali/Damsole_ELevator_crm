"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  IoCheckmarkCircle,
} from "react-icons/io5";

export default function ProductsPage() {

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#cef5db' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-44 pb-20 sm:pb-28 md:pb-32 lg:pb-40 bg-cover bg-center bg-no-repeat text-white"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/product.jpg')",
        }}>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">Our Products</h1>
            <p className="text-base sm:text-lg md:text-xl text-white">
              Comprehensive range of elevator solutions for every need
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Products Section */}
      <section className="pt-[62px] pb-16 sm:pt-[78px] sm:pb-20 md:pt-[94px] md:pb-24" style={{ backgroundColor: '#cef5db' }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="space-y-12 sm:space-y-16 rounded-3xl p-8 sm:p-12" style={{ backgroundColor: 'rgba(206, 245, 219, 0.5)' }}>
            {[
              {
                title: "Hydraulic Elevator",
                description:
                  "Reliable and cost-effective elevator solution for low to mid-rise buildings, engineered for smooth and stable performance in everyday use.",
                image: "/premium_lift7.jpeg",
                points: [
                  "Ideal for residential and commercial low to mid-rise buildings",
                  "Smooth ride quality with powerful hydraulic drive",
                  "Lower initial cost and easy installation",
                  "High load capacity for regular passenger movement",
                ],
              },
              {
                title: "Traction Elevators",
                description:
                  "Specialized elevator designed for hospitals and medical facilities, with wide cabins and safe, jerk-free movement for patients and medical staff.",
                image: "/premium_lift3.jpg",
                points: [
                  "Extra-wide cabin to accommodate stretchers and wheelchairs",
                  "Smooth acceleration and deceleration for patient comfort",
                  "Anti-skid flooring and strong handrails for safety",
                  "Suitable for hospitals, clinics, and healthcare centers",
                ],
              },
              {
                title: "Pneumatic Elevator",
                description:
                  "Compact, air-powered home elevator with minimal civil work, perfect for modern villas and low-rise homes.",
                image: "/Pneumatic.jpeg",
                points: [
                  "Space-saving cylindrical design for tight spaces",
                  "Works on air pressure technology with low power consumption",
                  "Quick installation with minimal shaft and pit requirements",
                  "Perfect for duplex homes, bungalows, and private residences",
                ],
              },
              {
                title: "MRL (Machine Room-Less) Elevator",
                description:
                  "Energy-efficient elevator without a separate machine room, designed for modern buildings that demand both space savings and premium aesthetics.",
                image: "/premium_lift5.jpg",
                points: [
                  "No dedicated machine room required – saves building space",
                  "Efficient gearless technology for smooth and quiet ride",
                  "Flexible design options for residential and commercial use",
                  "Ideal for apartments, offices, malls, and premium buildings",
                ],
              },
            ].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-150px" }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center bg-primary-50 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 sm:p-10 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
              >
                {/* Image side */}
                <motion.div
                  className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer"
                  initial={{
                    opacity: 0,
                    x: index % 2 === 0 ? -60 : 60,
                    scale: 0.95
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                    scale: 1
                  }}
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    delay: index * 0.1 + 0.2,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <motion.img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                    whileHover={{
                      scale: 1.1,
                      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                    }}
                  />
                  {/* Overlay gradient on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
                  />
                </motion.div>

                {/* Content side */}
                <motion.div
                  initial={{
                    opacity: 0,
                    x: index % 2 === 0 ? 60 : -60,
                    y: 20
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                    y: 0
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    delay: index * 0.1 + 0.3,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight">
                    {service.title}
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6">
                    {service.description}
                  </p>
                  <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 space-y-1 sm:space-y-2 mb-6 sm:mb-8">
                    {service.points.map((point, pointIndex) => (
                      <motion.li
                        key={point}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: index * 0.1 + 0.3 + (pointIndex * 0.1),
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                      >
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pt-[46px] pb-12 sm:pt-[62px] sm:pb-16 md:pt-[78px] md:pb-20" style={{ backgroundColor: '#cef5db' }}>
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Our Products?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced technology meets exceptional craftsmanship
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Advanced Safety Systems",
                description: "Multiple safety mechanisms including emergency brakes, backup power, and 24/7 monitoring.",
              },
              {
                title: "Energy Efficient",
                description: "Eco-friendly designs that reduce energy consumption by up to 40% compared to traditional systems.",
              },
              {
                title: "Smart Technology",
                description: "IoT-enabled elevators with predictive maintenance and intelligent destination control.",
              },
              {
                title: "Customizable Design",
                description: "Wide range of finishes, materials, and design options to match your aesthetic preferences.",
              },
              {
                title: "Quick Installation",
                description: "Streamlined installation process with minimal disruption to your daily operations.",
              },
              {
                title: "Comprehensive Warranty",
                description: "Industry-leading warranty coverage with dedicated support throughout the product lifecycle.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{
                  opacity: 0,
                  y: 50,
                  scale: 0.9,
                  rotateX: -10
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  rotateX: 0
                }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: index * 0.15,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: {
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1]
                  }
                }}
                className="group p-6 bg-primary-50 rounded-xl border border-primary-100/50 hover:shadow-2xl transition-all duration-300 hover:border-primary-400 relative overflow-hidden"
              >
                {/* Animated background gradient on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(to bottom right, rgba(206, 245, 219, 0.5), transparent, rgba(206, 245, 219, 0.5))' }}
                  initial={false}
                />

                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
                  initial={false}
                />

                <div className="relative z-10">
                  <motion.h3
                    className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.15 + 0.2,
                      duration: 0.5
                    }}
                  >
                    {feature.title}
                  </motion.h3>
                  <motion.p
                    className="text-gray-600 leading-relaxed text-sm sm:text-base"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.15 + 0.3,
                      duration: 0.5
                    }}
                  >
                    {feature.description}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-accent-600 via-accent-500 to-accent-400 text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Find the Perfect Elevator?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Our experts are here to help you choose the right solution for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-accent-700 rounded-lg font-semibold text-base sm:text-lg hover:bg-accent-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
