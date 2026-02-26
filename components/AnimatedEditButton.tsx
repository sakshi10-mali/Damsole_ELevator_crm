"use client"; 

import React, { useState } from "react";

interface AnimatedEditButtonProps {
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
}

export default function AnimatedEditButton({
  onClick,
  className = "",
  size = "md",
  title = "Edit",
}: AnimatedEditButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "w-[40px] h-[40px]",
    md: "w-[55px] h-[55px]",
    lg: "w-[70px] h-[70px]",
  };

  const iconSizes = {
    sm: "h-[12px]",
    md: "h-[17px]",
    lg: "h-[22px]",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group
        relative
        ${sizeClasses[size]}
        rounded-[20px]
        border-none
        bg-[rgb(93,93,116)]
        flex items-center justify-center
        shadow-[0px_5px_10px_rgba(0,0,0,0.123)]
        cursor-pointer
        overflow-hidden
        transition-all duration-300
        hover:shadow-[0px_5px_10px_rgba(0,0,0,0.336)]
        ${className}
      `}
    >
      {/* Animated background circle */}
      <div
        className={`
          absolute
          w-[200%] h-[200%]
          bg-[rgb(102,102,141)]
          rounded-full
          blur-[10px]
          z-[1]
          transition-all duration-300
          ${isHovered ? "scale-100" : "scale-0"}
        `}
      />
      
      {/* Edit icon SVG */}
      <svg
        height="1em"
        viewBox="0 0 512 512"
        className={`
          ${iconSizes[size]}
          fill-white
          z-[3]
          relative
          transition-all duration-200
          origin-bottom
          ${isHovered ? "-rotate-[15deg] translate-x-[5px]" : ""}
        `}
      >
        <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
      </svg>
      
      {/* Animated line */}
      <div
        className={`
          absolute
          w-[25px]
          h-[1.5px]
          bottom-[19px]
          bg-white
          rounded-[2px]
          z-[2]
          transition-all duration-500 ease-out
          ${isHovered ? "scale-x-100 left-0" : "scale-x-0 -left-[5px]"}
        `}
        style={{
          transformOrigin: isHovered ? "right" : "left",
        }}
      />
    </button>
  );
}

