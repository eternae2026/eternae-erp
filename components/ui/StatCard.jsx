export default function StatCard({
  title,
  value,
  color = 'text-gray-800',
  icon = null,
  className = ''
}) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        shadow-sm
        p-6
        transition
        hover:shadow-md
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2 className={`text-2xl font-bold mt-2 ${color}`}>
            {value}
          </h2>
        </div>

        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}