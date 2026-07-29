import React, { forwardRef, useId } from 'react'

const Input = forwardRef(function Input(
  {
    label = '',
    error = '',
    hint = '',
    icon = null,
    required = false,
    className = '',
    inputClassName = '',
    id,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const inputId = id || props.name || generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`
            min-h-12
            w-full
            rounded-xl
            border
            bg-white
            px-4
            py-3
            text-sm
            text-gray-900
            shadow-sm
            outline-none
            transition-all
            duration-200
            placeholder:text-gray-400
            focus:ring-2
            disabled:cursor-not-allowed
            disabled:bg-gray-100
            disabled:text-gray-500
            ${icon ? 'pl-11' : ''}
            ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-200 hover:border-gray-300 focus:border-green-600 focus:ring-green-100'
            }
            ${inputClassName}
          `}
          {...props}
        />
      </div>

      {error && <p id={errorId} className="mt-2 text-sm text-red-600">{error}</p>}
      {!error && hint && <p id={hintId} className="mt-2 text-sm text-gray-500">{hint}</p>}
    </div>
  )
})

export default Input
