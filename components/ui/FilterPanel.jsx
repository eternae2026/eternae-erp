export default function FilterPanel({
  children,
  title = '',
  description = '',
  className = ''
}) {
  return (
    <div
      className={`
        bg-white
        border
        border-gray-200
        rounded-2xl
        shadow-sm
        p-5
        mb-6
        ${className}
      `}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-base font-semibold text-gray-800">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}