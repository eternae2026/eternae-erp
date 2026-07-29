import { forwardRef, useId } from 'react'

const TextArea = forwardRef(function TextArea(
  {
    label = '',
    error = '',
    helperText = '',
    required = false,
    disabled = false,
    rows = 3,
    className = '',
    textareaClassName = '',
    id,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const fieldId = id || props.name || generatedId
  const helperId = `${fieldId}-helper`
  const errorId = `${fieldId}-error`

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`
          min-h-[104px]
          w-full
          resize-y
          rounded-xl
          border
          bg-white
          px-4
          py-3
          text-sm
          leading-6
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
          ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
              : 'border-gray-200 hover:border-gray-300 focus:border-green-600 focus:ring-green-100'
          }
          ${textareaClassName}
        `}
        {...props}
      />

      {error && <p id={errorId} className="mt-2 text-sm text-red-600">{error}</p>}
      {!error && helperText && <p id={helperId} className="mt-2 text-sm text-gray-500">{helperText}</p>}
    </div>
  )
})

export default TextArea
