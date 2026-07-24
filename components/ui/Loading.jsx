export default function Loading({
  text = 'Carregando...',
  size = 'md',
  fullPage = false,
  className = ''
}) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-4'
  }

  const content = (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        gap-3
        text-center
        ${className}
      `}
    >
      <div
        className={`
          animate-spin
          rounded-full
          border-gray-200
          border-t-green-600
          ${sizes[size] || sizes.md}
        `}
        role="status"
        aria-label={text}
      />

      {text && (
        <p className="text-sm text-gray-500">
          {text}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div
        className="
          flex
          min-h-[50vh]
          items-center
          justify-center
        "
      >
        {content}
      </div>
    )
  }

  return content
}