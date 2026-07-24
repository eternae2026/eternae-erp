import React, { forwardRef } from 'react'

const Select = forwardRef(function Select(
  {
    label = '',
    error = '',
    hint = '',
    className = '',
    selectClassName = '',
    id,
    children,
    ...props
  },
  ref
) {
  const selectId =
    id || props.name || undefined

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="
            mb-2
            block
            text-sm
            font-medium
            text-gray-700
          "
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full
            appearance-none
            rounded-xl
            border
            border-gray-200
            bg-white
            px-4
            py-3
            pr-10
            text-sm
            text-gray-800
            outline-none
            transition
            focus:border-green-500
            focus:ring-2
            focus:ring-green-100
            disabled:cursor-not-allowed
            disabled:bg-gray-100
            disabled:text-gray-500
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : ''
            }
            ${selectClassName}
          `}
          {...props}
        >
          {children}
        </select>

        <div
          className="
            pointer-events-none
            absolute
            inset-y-0
            right-0
            flex
            items-center
            pr-4
            text-gray-400
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {!error && hint && (
        <p className="mt-2 text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  )
})

export default Select