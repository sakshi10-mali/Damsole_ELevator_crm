"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { IoCalendar, IoPerson, IoArrowBack } from "react-icons/io5";
import { blogsAPI, Blog } from "@/lib/api";

export default function BlogDetailPage({ params }: { params: { id: string } }) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlog();
  }, [params.id]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedBlog = await blogsAPI.getById(params.id);
      setBlog(fetchedBlog);
    } catch (error) {
      console.error("Failed to load blog:", error);
      setError("Blog not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-gray-500">Loading blog...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-primary-50">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-red-500">{error || "Blog not found"}</p>
          <Link href="/blogs" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Blogs
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const blogDate = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'Unknown date';

  return (
    <div className="min-h-screen bg-primary-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-primary-200 hover:text-white mb-6 transition-colors"
            >
              <IoArrowBack className="w-5 h-5" />
              <span>Back to Blogs</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{blog.title}</h1>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <IoPerson className="w-5 h-5" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoCalendar className="w-5 h-5" />
                <span>{blogDate}</span>
              </div>
              <span className="px-3 py-1 bg-primary-500 rounded-full text-sm">
                {blog.category}
              </span>
              <span className="px-3 py-1 bg-primary-400 rounded-full text-sm">
                {blog.views} views
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-12 sm:py-16 md:py-20 bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-96 rounded-2xl overflow-hidden mb-8"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${blog.image}')` }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg max-w-none"
            >
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {blog.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
