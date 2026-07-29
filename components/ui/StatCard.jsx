export default function StatCard({
  title,
  value,
  color = 'text-gray-900',
  icon = null,
  description = '',
  className = ''
}) {
  return (
    <div
      className={`
        min-h-[128px]
        rounded-2xl
        border
        border-gray-200/80
        bg-white
        p-5
        shadow-[0_1px_2px_rgba(15,23,42,0.04)]
        transition-all
        duration-200
        hover:border-gray-300
        hover:shadow-md
        sm:p-6
        ${className}
      `}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className={`mt-2 text-2xl font-bold tracking-tight ${color}`}>
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs leading-5 text-gray-400">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
