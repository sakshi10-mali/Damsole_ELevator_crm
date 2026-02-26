"use client";

import React, { useState } from "react";

interface AnimatedDeleteButtonProps {
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
}

export default function AnimatedDeleteButton({
  onClick,
  className = "",
  size = "md",
  title = "Delete",
}: AnimatedDeleteButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "w-[40px] h-[40px]",
    md: "w-[55px] h-[55px]",
    lg: "w-[70px] h-[70px]",
  };

  const iconSizes = {
    sm: { bottom: "w-[10px]", top: "w-[12px]", garbage: "w-[10px]" },
    md: { bottom: "w-[15px]", top: "w-[17px]", garbage: "w-[14px]" },
    lg: { bottom: "w-[20px]", top: "w-[22px]", garbage: "w-[18px]" },
  };

  // Generate unique ID for mask to avoid conflicts
  const maskId = `mask-delete-${size}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group
        flex flex-col items-center justify-center
        ${sizeClasses[size]}
        rounded-full
        bg-[rgb(255,95,95)]
        cursor-pointer
        border-2 border-[rgb(255,201,201)]
        transition-all duration-300
        relative
        overflow-hidden
        hover:bg-red-600
        active:scale-90
        ${className}
      `}
    >
      {/* Bin Top */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 39 7"
        className={`${iconSizes[size].top} z-[2] transition-transform duration-300 origin-right ${isHovered ? "rotate-45" : ""}`}
      >
        <line strokeWidth={4} stroke="white" y2={5} x2={39} y1={5} />
        <line strokeWidth={3} stroke="white" y2="1.5" x2="26.0357" y1="1.5" x1={12} />
      </svg>
      
      {/* Bin Bottom */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 33 39"
        className={`${iconSizes[size].bottom} z-[2]`}
      >
        <mask fill="white" id={maskId}>
          <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
        </mask>
        <path
          mask={`url(#${maskId})`}
          fill="white"
          d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
        />
        <path strokeWidth={4} stroke="white" d="M12 6L12 29" />
        <path strokeWidth={4} stroke="white" d="M21 6V29" />
      </svg>
      
      {/* Garbage Animation */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 89 80"
        className={`
          ${iconSizes[size].garbage}
          h-auto
          absolute
          z-[1]
          ${isHovered ? "garbage-animation opacity-100" : "opacity-0"}
        `}
      >
        <path
          fill="white"
          d="M20.5 10.5L37.5 15.5L42.5 11.5L51.5 12.5L68.75 0L72 11.5L79.5 12.5H88.5L87 22L68.75 31.5L75.5066 25L86 26L87 35.5L77.5 48L70.5 49.5L80 50L77.5 71.5L63.5 58.5L53.5 68.5L65.5 70.5L45.5 73L35.5 79.5L28 67L16 63L12 51.5L0 48L16 25L22.5 17L20.5 10.5Z"
        />
      </svg>
    </button>
  );
}

