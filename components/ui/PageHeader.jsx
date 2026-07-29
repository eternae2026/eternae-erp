import React from 'react'

export default function PageHeader({
  title,
  description = '',
  action = null,
  eyebrow = '',
  className = ''
}) {
  return (
    <header
      className={`
        mb-8
        flex
        flex-col
        gap-5
        md:flex-row
        md:items-start
        md:justify-between
        ${className}
      `}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            {eyebrow}
          </p>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[2rem]">
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-gray-500 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex flex-shrink-0 items-center">
          {action}
        </div>
      )}
    </header>
  )
}
