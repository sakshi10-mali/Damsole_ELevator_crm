"use client";

import { memo } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  IoCheckmarkCircle,
  IoPeople,
  IoFlash,
  IoBuild,
} from "react-icons/io5";

// Animation variants for consistent animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const slideInRight = {
  initial: { opacity: 0, x: 30 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

// Data constants
const coreValues = [
  {
    icon: <IoCheckmarkCircle className="w-12 h-12" />,
    title: "Quality First",
    description: "We never compromise on quality, ensuring every product meets the highest standards.",
    color: "text-primary-500 bg-primary-50",
  },
  {
    icon: <IoPeople className="w-12 h-12" />,
    title: "Customer Focus",
    description: "Our customers are at the heart of everything we do. Their satisfaction is our success.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: <IoFlash className="w-12 h-12" />,
    title: "Technology",
    description: "We leverage advanced technology and smart systems to deliver efficient, future-ready, and high-performance solutions.",
    color: "text-orange-600 bg-orange-50",
  },
  {
    icon: <IoBuild className="w-12 h-12" />,
    title: "Safety",
    description: "We prioritize safety at every stage, following strict standards and protocols to ensure secure, reliable, and worry-free operation.",
    color: "text-purple-600 bg-purple-50",
  },
] as const;

const stats = [
  { number: "800+", label: "Installations" },
  { number: "85+", label: "Experienced Team" },
  { number: "15+", label: "Years Experience" },
  { number: "7+", label: "Products" },
] as const;

const products = [
  {
    name: "Damsole Elevate X",
    description: "Luxury home elevator with cutting-edge features and elegant design.",
  },
  {
    name: "Damsole GX 630",
    description: "Compact, reliable, and perfect for modern homes.",
  },
  {
    name: "Damsole 360",
    description: "Shaft Free - Home elevator for effortless installation and modern living.",
  },
  {
    name: "Damsole SafeRise X5",
    description: "Advanced safety and smooth performance in every ride.",
  },
] as const;

function AboutPage() {
  return (
    <div className="min-h-screen bg-primary-50">
      <Navigation />
      
      {/* Hero Section - About Us with Elevator Shaft Background */}
      <section
        className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-44 pb-20 sm:pb-28 md:pb-32 lg:pb-40 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/about.jpg')",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            {...fadeInUp}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
              About Us
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Company Introduction Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            <motion.div {...slideInLeft}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Damsole Technologies
              </h2>
              <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-base sm:text-lg">
                Damsole Technologies is a trusted name in home mobility solutions, dedicated to making every home accessible, stylish, and comfortable. With years of industry expertise, we specialize in designing, installing, and maintaining premium elevators and stair lifts that combine advanced technology, safety, and aesthetic appeal.
              </p>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our range of products includes:</h3>
                <ul className="space-y-3">
                  {products.map((product, index) => (
                    <motion.li
                      key={product.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="flex items-start gap-3"
                    >
                      <IoCheckmarkCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                      <div>
                        <span className="font-semibold text-gray-900">{product.name}</span>
                        <span className="text-gray-600"> — {product.description}</span>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>    
              <p className="text-gray-600 leading-relaxed text-lg">
                At Damsole Technologies, we understand that an elevator is more than a convenience it's an investment in safety, comfort, and lifestyle. From consultation and installation to maintenance and repairs, our skilled team ensures a seamless experience at every stage. By combining innovation, craftsmanship, and customer care, we don't just lift you between floors — we elevate the way you live.
              </p>
            </motion.div>
            <motion.div
              {...slideInRight}
              className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-2xl"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('about_home.jpg')",
                }}
                role="img"
                aria-label="Modern home elevator installation"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section id="values" className="py-12 sm:py-16 md:py-20 bg-primary-100 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="p-8 rounded-2xl bg-primary-50 border border-primary-100/50 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 ${value.color} rounded-xl flex items-center justify-center mb-6`}>
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                {...scaleIn}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2">{stat.number}</div>
                <div className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section id="vision-mission" className="py-12 sm:py-16 md:py-20 bg-primary-50 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide world-class elevator solutions that enhance the quality of life for our
                customers. We strive to deliver innovative, safe, and reliable vertical transportation
                systems that exceed expectations while maintaining the highest standards of service
                and professionalism.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 rounded-2xl bg-primary-50 border border-primary-200"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become India's most trusted and innovative elevator solutions provider, recognized
                for excellence in engineering, customer service, and sustainable practices. We envision
                a future where every building has access to safe, efficient, and smart vertical
                transportation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default memo(AboutPage);
