export function DropdownMenu({
  open = false,
  onToggle,
  children,
  className = ''
}) {
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()

          if (onToggle) {
            onToggle(event)
          }
        }}
        className="
          inline-flex
          h-9
          w-9
          items-center
          justify-center
          rounded-lg
          border
          border-gray-200
          bg-white
          text-gray-600
          transition
          hover:bg-gray-50
          hover:text-gray-900
        "
        title="Ações"
        aria-label="Abrir menu de ações"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div
          onClick={(event) =>
            event.stopPropagation()
          }
          className="
            absolute
            right-0
            top-11
            z-50
            w-48
            rounded-xl
            border
            border-gray-100
            bg-white
            p-2
            shadow-xl
          "
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  icon = null,
  variant = 'default',
  onClick,
  disabled = false,
  className = ''
}) {
  const variants = {
    default: `
      text-gray-700
      hover:bg-gray-50
    `,
    success: `
      text-green-700
      hover:bg-green-50
    `,
    warning: `
      text-amber-700
      hover:bg-amber-50
    `,
    danger: `
      text-red-600
      hover:bg-red-50
    `
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-3
        py-2.5
        text-left
        text-sm
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {icon && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}

      <span>
        {children}
      </span>
    </button>
  )
}

export function DropdownMenuDivider({
  className = ''
}) {
  return (
    <div
      className={`
        my-1
        h-px
        bg-gray-100
        ${className}
      `}
    />
  )
}