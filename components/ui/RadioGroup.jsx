import { useId } from 'react'

export default function RadioGroup({
  label = '',
  name,
  value,
  options = [],
  onChange,
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  direction = 'vertical',
  className = ''
}) {
  const generatedId = useId()

  const groupId = name || generatedId
  const helperId = `${groupId}-helper`
  const errorId = `${groupId}-error`

  const directions = {
    vertical: 'flex-col',
    horizontal: 'flex-row flex-wrap'
  }

  return (
    <fieldset
      className={`w-full ${className}`}
      disabled={disabled}
      aria-describedby={
        error
          ? errorId
          : helperText
            ? helperId
            : undefined
      }
    >
      {label && (
        <legend className="mb-3 text-sm font-medium text-gray-700">
          {label}

          {required && (
            <span
              className="ml-1 text-red-500"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </legend>
      )}

      <div
        className={`
          flex
          gap-3
          ${directions[direction] || directions.vertical}
        `}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`
          const isDisabled = disabled || option.disabled

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`
                flex
                items-start
                gap-3
                rounded-xl
                border
                px-4
                py-3
                transition
                ${
                  value === option.value
                    ? `
                      border-green-500
                      bg-green-50
                    `
                    : `
                      border-gray-200
                      bg-white
                      hover:border-gray-300
                      hover:bg-gray-50
                    `
                }
                ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                }
              `}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                required={required}
                disabled={isDisabled}
                onChange={() => onChange?.(option.value)}
                className="
                  mt-0.5
                  h-4
                  w-4
                  flex-shrink-0
                  cursor-pointer
                  border-gray-300
                  text-green-600
                  accent-green-600
                  focus:ring-2
                  focus:ring-green-100
                  disabled:cursor-not-allowed
                "
              />

              <div className="min-w-0">
                <span className="block text-sm font-medium text-gray-700">
                  {option.label}
                </span>

                {option.description && (
                  <span className="mt-1 block text-sm leading-5 text-gray-500">
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          )
        })}
      </div>

      {error && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={helperId}
          className="mt-2 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </fieldset>
  )
}