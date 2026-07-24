export default function Alert({
  title = '',
  children,
  variant = 'info',
  icon = null,
  className = ''
}) {
  const variants = {
    success: {
      container: 'border-green-200 bg-green-50',
      title: 'text-green-800',
      text: 'text-green-700'
    },
    warning: {
      container: 'border-yellow-200 bg-yellow-50',
      title: 'text-yellow-800',
      text: 'text-yellow-700'
    },
    danger: {
      container: 'border-red-200 bg-red-50',
      title: 'text-red-800',
      text: 'text-red-700'
    },
    info: {
      container: 'border-blue-200 bg-blue-50',
      title: 'text-blue-800',
      text: 'text-blue-700'
    },
    neutral: {
      container: 'border-gray-200 bg-gray-50',
      title: 'text-gray-800',
      text: 'text-gray-600'
    }
  }

  const selectedVariant =
    variants[variant] || variants.info

  return (
    <div
      className={`
        flex
        items-start
        gap-3
        rounded-xl
        border
        p-4
        ${selectedVariant.container}
        ${className}
      `}
      role="alert"
    >
      {icon && (
        <div className="mt-0.5 flex-shrink-0">
          {icon}
        </div>
      )}

      <div className="min-w-0">
        {title && (
          <h3
            className={`
              text-sm
              font-semibold
              ${selectedVariant.title}
            `}
          >
            {title}
          </h3>
        )}

        {children && (
          <div
            className={`
              text-sm
              leading-6
              ${title ? 'mt-1' : ''}
              ${selectedVariant.text}
            `}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  )
}