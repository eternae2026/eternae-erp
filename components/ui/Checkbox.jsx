import { forwardRef, useId } from 'react'

const Checkbox = forwardRef(function Checkbox(
  {
    label = '',
    description = '',
    error = '',
    className = '',
    checkboxClassName = '',
    id,
    disabled = false,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const fieldId = id || props.name || generatedId
  const descriptionId = `${fieldId}-description`
  const errorId = `${fieldId}-error`

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? errorId
              : description
                ? descriptionId
                : undefined
          }
          className={`
            mt-0.5
            h-4
            w-4
            flex-shrink-0
            cursor-pointer
            rounded
            border-gray-300
            text-green-600
            accent-green-600
            transition
            focus:ring-2
            focus:ring-green-100
            disabled:cursor-not-allowed
            disabled:opacity-50
            ${checkboxClassName}
          `}
          {...props}
        />

        {(label || description) && (
          <div className="min-w-0">
            {label && (
              <label
                htmlFor={fieldId}
                className={`
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  ${
                    disabled
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  }
                `}
              >
                {label}
              </label>
            )}

            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-5 text-gray-500"
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          className="ml-7 mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
})

export default Checkbox