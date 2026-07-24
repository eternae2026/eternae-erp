import React from "react";

export default function Card({
  children,
  className = "",
  hover = false,
}) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        border
        border-gray-200
        shadow-sm
        p-6
        transition-all
        duration-200
        ${
          hover
            ? "hover:shadow-md hover:-translate-y-0.5"
            : ""
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}