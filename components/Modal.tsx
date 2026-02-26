"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 p-2 sm:p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-white rounded-lg sm:rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-140px)] overflow-hidden border-2 border-gray-100 pointer-events-auto mb-4`}
            >
              <div className="sticky top-0 bg-gradient-to-r from-accent-600 to-accent-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
                <h2 className="text-lg sm:text-xl font-bold text-white pr-2">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors text-white flex-shrink-0"
                  aria-label="Close modal"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 bg-white overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)] pb-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}






