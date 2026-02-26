"use client";

import { useState, useEffect } from "react";
import { blogsAPI, Blog } from "@/lib/api";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { IoAdd, IoSearch, IoEye, IoEyeOff } from "react-icons/io5";
import AnimatedDeleteButton from "@/components/AnimatedDeleteButton";
import AnimatedEditButton from "@/components/AnimatedEditButton";
import Link from "next/link";

export default function BlogsPage() {
  const [blogList, setBlogList] = useState<Blog[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newBlog, setNewBlog] = useState({
    title: "",
    excerpt: "",
    content: "",
    author: "",
    category: "",
    image: "",
    googleReviewUrl: "",
    published: true,
  });

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const blogs = await blogsAPI.getAll(true); // Get all blogs including unpublished
      setBlogList(blogs);
    } catch (error) {
      console.error("Failed to load blogs:", error);
      toast.error("Failed to load blogs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async () => {
    try {
      if (
        !newBlog.title ||
        !newBlog.excerpt ||
        !newBlog.content ||
        !newBlog.author ||
        !newBlog.category ||
        (!newBlog.image && !newBlog.googleReviewUrl)
      ) {
        toast.error("Title, excerpt, content, author, category aur image ya Google review link zaroori hai");
        return;
      }

      const createdBlog = await blogsAPI.create(newBlog);
      setBlogList([createdBlog, ...blogList]);
      setIsCreateModalOpen(false);
      setNewBlog({
        title: "",
        excerpt: "",
        content: "",
        author: "",
        category: "",
        image: "",
        googleReviewUrl: "",
        published: true,
      });
      toast.success("Blog created successfully!");
    } catch (error) {
      console.error("Failed to create blog:", error);
      toast.error("Failed to create blog. Please try again.");
    }
  };

  const handleEditClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setNewBlog({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      image: blog.image,
      googleReviewUrl: blog.googleReviewUrl || "",
      published: blog.published,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateBlog = async () => {
    if (!selectedBlog) return;

    try {
      if (
        !newBlog.title ||
        !newBlog.excerpt ||
        !newBlog.content ||
        !newBlog.author ||
        !newBlog.category ||
        (!newBlog.image && !newBlog.googleReviewUrl)
      ) {
        toast.error("Title, excerpt, content, author, category aur image ya Google review link zaroori hai");
        return;
      }

      const updatedBlog = await blogsAPI.update(selectedBlog._id || selectedBlog.id || "", newBlog);
      setBlogList(blogList.map(blog => 
        (blog._id || blog.id) === (selectedBlog._id || selectedBlog.id) ? updatedBlog : blog
      ));
      setIsEditModalOpen(false);
      setSelectedBlog(null);
      setNewBlog({
        title: "",
        excerpt: "",
        content: "",
        author: "",
        category: "",
        image: "",
        googleReviewUrl: "",
        published: true,
      });
      toast.success("Blog updated successfully!");
    } catch (error) {
      console.error("Failed to update blog:", error);
      toast.error("Failed to update blog. Please try again.");
    }
  };

  const handleDeleteClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBlog) return;

    try {
      await blogsAPI.delete(selectedBlog._id || selectedBlog.id || "");
      setBlogList(blogList.filter(blog => 
        (blog._id || blog.id) !== (selectedBlog._id || selectedBlog.id)
      ));
      setIsDeleteModalOpen(false);
      setSelectedBlog(null);
      toast.success("Blog deleted successfully!");
    } catch (error) {
      console.error("Failed to delete blog:", error);
      toast.error("Failed to delete blog. Please try again.");
    }
  };

  const filteredBlogs = blogList.filter(blog =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ["Technology", "Sustainability", "Safety", "Residential", "Commercial", "Maintenance"];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-600 mt-1">Manage your blog posts</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-48 md:w-56">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search blogs by title, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <IoAdd className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Create Blog</span>
          </button>
        </div>
      </div>

      {/* Blogs List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading blogs...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {blogList.length === 0 ? "No blogs yet. Create your first blog!" : "No blogs found matching your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div key={blog._id || blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x400?text=Blog+Image";
                  }}
                />
                <div className="absolute top-2 right-2">
                  {blog.published ? (
                    <span className="px-2 py-1 bg-primary-500 text-white text-xs rounded">Published</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">Draft</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">{blog.category}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{blog.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{blog.author}</span>
                  <span>{blog.views} views</span>
                </div>
                <div className="flex gap-2">
                  <AnimatedEditButton
                    onClick={() => handleEditClick(blog)}
                    size="sm"
                    title="Edit Blog"
                    className="flex-shrink-0"
                  />
                  <AnimatedDeleteButton
                    onClick={() => handleDeleteClick(blog)}
                    size="sm"
                    title="Delete Blog"
                  />
                  <Link
                    href={`/blogs/${blog._id || blog.id}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                    title="View Blog"
                  >
                    <IoEye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Blog Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
            setNewBlog({
              title: "",
              excerpt: "",
              content: "",
              author: "",
              category: "",
              image: "",
              googleReviewUrl: "",
              published: true,
            });
        }}
        title="Create New Blog"
        size="lg"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={newBlog.title}
              onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter blog title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt *</label>
            <textarea
              value={newBlog.excerpt}
              onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="Enter brief excerpt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={newBlog.content}
              onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={8}
              placeholder="Enter full blog content"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
            <input
              type="text"
              value={newBlog.author}
              onChange={(e) => setNewBlog({ ...newBlog, author: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter author name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={newBlog.category}
              onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
            <input
              type="url"
              value={newBlog.image}
              onChange={(e) => setNewBlog({ ...newBlog, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Google Review Link (Optional)
            </label>
            <input
              type="url"
              value={newBlog.googleReviewUrl}
              onChange={(e) => setNewBlog({ ...newBlog, googleReviewUrl: e.target.value })}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="https://share.google/ylYusSKK26Wr94Ifo"
            />
            <p className="mt-2 text-xs text-blue-700">
              Google review share link paste karein. Review automatically 5-star rating ke saath display hogi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={newBlog.published}
              onChange={(e) => setNewBlog({ ...newBlog, published: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="published" className="text-sm text-gray-700">Publish immediately</label>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleCreateBlog}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Blog
            </button>
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
            setNewBlog({
              title: "",
              excerpt: "",
              content: "",
              author: "",
              category: "",
              image: "",
              googleReviewUrl: "",
              published: true,
            });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Blog Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBlog(null);
            setNewBlog({
              title: "",
              excerpt: "",
              content: "",
              author: "",
              category: "",
              image: "",
              googleReviewUrl: "",
              published: true,
            });
        }}
        title="Edit Blog"
        size="lg"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={newBlog.title}
              onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt *</label>
            <textarea
              value={newBlog.excerpt}
              onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={newBlog.content}
              onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
            <input
              type="text"
              value={newBlog.author}
              onChange={(e) => setNewBlog({ ...newBlog, author: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={newBlog.category}
              onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
            <input
              type="url"
              value={newBlog.image}
              onChange={(e) => setNewBlog({ ...newBlog, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Google Review Link (Optional)
            </label>
            <input
              type="url"
              value={newBlog.googleReviewUrl}
              onChange={(e) => setNewBlog({ ...newBlog, googleReviewUrl: e.target.value })}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="https://share.google/ylYusSKK26Wr94Ifo"
            />
            <p className="mt-2 text-xs text-blue-700">
              Google review share link paste karein. Review automatically 5-star rating ke saath display hogi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-published"
              checked={newBlog.published}
              onChange={(e) => setNewBlog({ ...newBlog, published: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="edit-published" className="text-sm text-gray-700">Published</label>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleUpdateBlog}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Update Blog
            </button>
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedBlog(null);
            setNewBlog({
              title: "",
              excerpt: "",
              content: "",
              author: "",
              category: "",
              image: "",
              googleReviewUrl: "",
              published: true,
            });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen && selectedBlog !== null}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBlog(null);
        }}
        title="Confirm Delete"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-shrink-0">
              <AnimatedDeleteButton
                size="md"
                title="Delete"
                className="cursor-default pointer-events-none"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">Delete Blog</h3>
              <p className="text-sm text-red-700">
                Are you sure you want to delete this blog? This action cannot be undone.
              </p>
            </div>
          </div>

          {selectedBlog && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Title:</span>
                <span className="text-sm text-gray-900">{selectedBlog.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Author:</span>
                <span className="text-sm text-gray-900">{selectedBlog.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Category:</span>
                <span className="text-sm text-gray-900">{selectedBlog.category}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleDeleteConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedBlog(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

