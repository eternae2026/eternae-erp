import React, { forwardRef, useId } from 'react'

const Select = forwardRef(function Select(
  {
    label = '',
    error = '',
    hint = '',
    required = false,
    className = '',
    selectClassName = '',
    id,
    children,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const selectId = id || props.name || generatedId
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`
            min-h-12
            w-full
            appearance-none
            rounded-xl
            border
            bg-white
            px-4
            py-3
            pr-10
            text-sm
            text-gray-900
            shadow-sm
            outline-none
            transition-all
            duration-200
            focus:ring-2
            disabled:cursor-not-allowed
            disabled:bg-gray-100
            disabled:text-gray-500
            ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-200 hover:border-gray-300 focus:border-green-600 focus:ring-green-100'
            }
            ${selectClassName}
          `}
          {...props}
        >
          {children}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {error && <p id={errorId} className="mt-2 text-sm text-red-600">{error}</p>}
      {!error && hint && <p id={hintId} className="mt-2 text-sm text-gray-500">{hint}</p>}
    </div>
  )
})

export default Select
