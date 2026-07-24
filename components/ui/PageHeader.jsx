import React from 'react'

export default function PageHeader({
  title,
  description = '',
  action = null,
  className = ''
}) {
  return (
    <div
      className={`
        flex
        flex-col
        gap-4
        mb-8
        md:flex-row
        md:items-start
        md:justify-between
        ${className}
      `}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-gray-800">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-gray-500">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}