"use client";

import Link from "next/link";
import {
  IoCall,
  IoMail,
  IoLocation,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoLinkedin,
} from "react-icons/io5";

export default function Footer() {
  const addresses = [
    {
      text: "GFH5 plot 243, 244, 2C6, Rami Reddy Nagar, Jeedimetla, Hyderabad, Telangana 500055",
      mapUrl: "https://share.google/EjPv6YDNow5AJlZz5"
    },
    {
      text: "Al Falah St - Al Danah - Zone 1 - Abu Dhabi",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Al+Falah+St+Al+Danah+Zone+1+Abu+Dhabi"
    },
    {
      text: "Level M1, 2A, Jalan Stesen Sentral 2, Kuala Lumpur Sentral, 50470 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Level+M1+2A+Jalan+Stesen+Sentral+2+Kuala+Lumpur+Sentral+50470"
    },
    {
      text: "212, 2nd Floor, Levana Cyber Heights, Vibhuti Khand, Gomti Nagar, Lucknow-226010",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=350-A+Vishal+Khand+Gomti+Nagar+Lucknow+UP"
    },
  ];

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/about#vision-mission", label: "Our Vision & Mission" },
    { href: "/about#values", label: "Why Choose Us" },
    { href: "/contact", label: "Contact Us" },
  ];

  const socialMediaLinks = {
    facebook: "https://www.facebook.com/damsoletechnologies",
    instagram: "https://www.instagram.com/damsoletechnologies",
    linkedin: "https://www.linkedin.com/company/damsoletechnologies",
  };

  return (
    <footer className="bg-primary-100 text-gray-700 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-4 sm:mb-5">
          {/* Company Introduction */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Link href="/" className="block">
                <div className="text-2xl sm:text-3xl font-bold mb-2 hover:opacity-80 transition-opacity cursor-pointer">
                  <span className="text-primary-600">Damsole</span>
                  <span className="text-gray-900"> Technologies</span>
                </div>
              </Link>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              We are pleased to introduce ourselves as one of the well known Elevator installation companies in Hyderabad serving to the customers from many years. Our services also include lift repair, lift installation and lift modernization.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-primary-700 font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Quick Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                </Link>
              </li>
              ))}
            </ul>
          </div>

          {/* Follow Us & Contact */}
          <div>
            <h4 className="text-primary-700 font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Follow us</h4>
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <a 
                href={socialMediaLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-accent-600 rounded-full flex items-center justify-center text-white hover:bg-accent-700 transition-colors shadow-md hover:shadow-lg"
                aria-label="Facebook"
              >
                <IoLogoFacebook className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a 
                href={socialMediaLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-accent-600 rounded-full flex items-center justify-center text-white hover:bg-accent-700 transition-colors shadow-md hover:shadow-lg"
                aria-label="Instagram"
              >
                <IoLogoInstagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a 
                href={socialMediaLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-accent-600 rounded-full flex items-center justify-center text-white hover:bg-accent-700 transition-colors shadow-md hover:shadow-lg"
                aria-label="LinkedIn"
              >
                <IoLogoLinkedin className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
          </div>
            <h4 className="text-primary-700 font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Contact</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <IoCall className="w-4 h-4 text-primary-700" />
                <a href="tel:+918019219911" className="hover:text-primary-600 transition-colors">
                  +91 8019219911
                </a>
              </li>
              <li className="flex items-center gap-2">
                <IoMail className="w-4 h-4 text-primary-700" />
                <a href="mailto:assist@damsoletechnologies.com" className="hover:text-primary-600 transition-colors">
                  assist@damsoletechnologies.com
                </a>
              </li>
            </ul>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-primary-700 font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Address</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {addresses.map((address, index) => (
                <li key={index} className="flex items-start gap-2">
                  <IoLocation className="w-3 h-3 sm:w-4 sm:h-4 text-primary-700 flex-shrink-0 mt-1" />
                  <a 
                    href={address.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 break-words hover:text-primary-600 transition-colors cursor-pointer"
                  >
                    {address.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-300 pt-2 sm:pt-3 pb-0 text-center text-xs sm:text-sm text-gray-600">
          <p>&copy; 2026 Damsole Technologies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
