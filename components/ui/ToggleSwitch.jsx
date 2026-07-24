import { forwardRef, useId } from 'react'

const ToggleSwitch = forwardRef(function ToggleSwitch(
  {
    label = '',
    description = '',
    checked = false,
    onChange,
    disabled = false,
    error = '',
    className = '',
    id,
    name,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const fieldId = id || name || generatedId

  const descriptionId = `${fieldId}-description`
  const errorId = `${fieldId}-error`

  function handleChange(event) {
    onChange?.(event.target.checked, event)
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        {(label || description) && (
          <div className="min-w-0 flex-1">
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
                className="
                  mt-1
                  text-sm
                  leading-5
                  text-gray-500
                "
              >
                {description}
              </p>
            )}
          </div>
        )}

        <label
          htmlFor={fieldId}
          className={`
            relative
            inline-flex
            flex-shrink-0
            items-center
            ${
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'
            }
          `}
        >
          <input
            ref={ref}
            id={fieldId}
            name={name}
            type="checkbox"
            role="switch"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            aria-checked={checked}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? errorId
                : description
                  ? descriptionId
                  : undefined
            }
            className="peer sr-only"
            {...props}
          />

          <span
            className="
              relative
              h-6
              w-11
              rounded-full
              bg-gray-300
              transition-colors
              duration-200
              peer-checked:bg-green-600
              peer-focus-visible:ring-2
              peer-focus-visible:ring-green-200
              peer-focus-visible:ring-offset-2
              peer-disabled:cursor-not-allowed
            "
          >
            <span
              className="
                absolute
                left-0.5
                top-0.5
                h-5
                w-5
                rounded-full
                bg-white
                shadow-sm
                transition-transform
                duration-200
                peer-checked:translate-x-5
              "
            />
          </span>
        </label>
      </div>

      {error && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
})

export default ToggleSwitch