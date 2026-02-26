"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { IoCalendar, IoPerson, IoArrowForward } from "react-icons/io5";
import { blogsAPI, Blog } from "@/lib/api";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const fetchedBlogs = await blogsAPI.getAll(false); // Get only published blogs
      console.log("Fetched blogs from API:", fetchedBlogs);
      setBlogs(fetchedBlogs || []); // Ensure it's always an array
    } catch (error) {
      console.error("Failed to load blogs:", error);
      setBlogs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-44 pb-20 sm:pb-28 md:pb-32 lg:pb-40 bg-cover bg-center bg-no-repeat text-white" 
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/all.jpg')",
        }}>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">Our Blogs</h1>
            <p className="text-base sm:text-lg md:text-xl text-white">
              Insights, tips, and updates from the world of elevators
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading blogs...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No blogs available at the moment.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {blogs.map((blog, index) => {
                const blogDate = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Unknown date';
                
                // Check if this is a Google review
                const isReview = blog.googleReviewUrl && blog.googleReviewUrl.length > 0;
                
                return (
              <motion.div
                key={blog._id || blog.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className={`bg-primary-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow ${isReview ? 'border-2 border-yellow-200' : 'border border-primary-100/50'}`}
              >
                {/* Top image area – show full image from admin panel link */}
                <div className="w-full bg-gray-100">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://via.placeholder.com/800x300?text=Blog+Image";
                    }}
                  />
                </div>
                <div className="p-6">
                  {/* Google Review Badge */}
                  {isReview && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full border border-yellow-300">
                        ⭐ Google Review
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {blog.title}
                  </h3>
                  
                  {/* Star Rating for Reviews */}
                  {isReview && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="text-2xl text-yellow-400"
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">5.0</span>
                    </div>
                  )}
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {blog.excerpt}
                  </p>
                  {!isReview && (
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <IoPerson className="w-4 h-4" />
                        <span>{blog.author}</span>
                      </div>
                      {blogDate !== 'Unknown date' && (
                        <div className="flex items-center gap-1">
                          <IoCalendar className="w-4 h-4" />
                          <span>{blogDate}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Google Review Link */}
                  {isReview && blog.googleReviewUrl && (
                    <div className="mb-4">
                      <a
                        href={blog.googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                      >
                        View on Google
                        <IoArrowForward className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  
                  {!isReview && (
                    <Link
                      href={`/blogs/${blog._id || blog.id}`}
                      className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                    >
                      Read More
                      <IoArrowForward className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </motion.div>
                );
              })}
          </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}


