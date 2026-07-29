import React from 'react'

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md'
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  return (
    <div
      className={`
        rounded-2xl
        border
        border-gray-200/80
        bg-white
        ${paddings[padding] || paddings.md}
        shadow-[0_1px_2px_rgba(15,23,42,0.04)]
        transition-all
        duration-200
        ${
          hover
            ? 'hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md'
            : ''
        }
        ${className}
      `}
    >
      {children}
    </div>
  )
}
