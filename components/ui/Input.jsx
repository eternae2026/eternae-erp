import React, { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label = '',
    error = '',
    hint = '',
    icon = null,
    className = '',
    inputClassName = '',
    id,
    ...props
  },
  ref
) {
  const inputId =
    id || props.name || undefined

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
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
        {icon && (
          <div
            className="
              pointer-events-none
              absolute
              inset-y-0
              left-0
              flex
              items-center
              pl-4
              text-gray-400
            "
          >
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`
            w-full
            rounded-xl
            border
            bg-white
            px-4
            py-3
            text-sm
            text-gray-800
            outline-none
            transition
            placeholder:text-gray-400
            focus:border-green-500
            focus:ring-2
            focus:ring-green-100
            disabled:cursor-not-allowed
            disabled:bg-gray-100
            disabled:text-gray-500
            ${
              icon
                ? 'pl-11'
                : ''
            }
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-200'
            }
            ${inputClassName}
          `}
          {...props}
        />
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

export default Input