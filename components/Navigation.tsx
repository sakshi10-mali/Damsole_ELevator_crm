"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  IoMenu,
  IoClose,
} from "react-icons/io5";

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Modern Navigation Bar with Glassmorphism */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-white/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
        <div className="container mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex-1 flex items-center min-w-0 h-full py-2 group">
              {logoError ? (
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                  <span className="text-gray-900">Damsole</span>
                  <span className="text-gray-900 hidden sm:inline">HOME ELEVATORS</span>
                  <span className="text-gray-900 sm:hidden">ELEVATORS</span>
                </div>
              ) : (
                <img
                  src="/kas%20img.png"
                  alt="Damsole Technologies Logo"
                  className="h-full max-h-12 sm:max-h-14 md:max-h-16 w-auto max-w-full object-contain object-left cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  onError={() => setLogoError(true)}
                />
              )}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}





