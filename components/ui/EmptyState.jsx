export default function EmptyState({
  title = 'Nenhum registro encontrado',
  description = '',
  icon = null,
  action = null,
  className = ''
}) {
  return (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        px-6
        py-12
        text-center
        ${className}
      `}
    >
      {icon && (
        <div
          className="
            mb-4
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-gray-100
            text-gray-400
          "
        >
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-800">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm text-gray-500">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}