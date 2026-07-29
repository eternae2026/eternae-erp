import React from 'react'

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) {
  const estilosBase = `
    inline-flex
    select-none
    items-center
    justify-center
    gap-2
    whitespace-nowrap
    rounded-xl
    font-medium
    shadow-sm
    transition-all
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    active:translate-y-px
    disabled:pointer-events-none
    disabled:opacity-50
  `

  const variantes = {
    primary: `
      bg-gray-900
      text-white
      hover:bg-gray-800
      focus:ring-gray-400
    `,
    secondary: `
      border
      border-gray-200
      bg-white
      text-gray-700
      hover:border-gray-300
      hover:bg-gray-50
      focus:ring-gray-300
    `,
    success: `
      bg-green-600
      text-white
      hover:bg-green-700
      focus:ring-green-400
    `,
    warning: `
      bg-amber-500
      text-white
      hover:bg-amber-600
      focus:ring-amber-400
    `,
    danger: `
      bg-red-600
      text-white
      hover:bg-red-700
      focus:ring-red-400
    `,
    ghost: `
      bg-transparent
      text-gray-700
      shadow-none
      hover:bg-gray-100
      focus:ring-gray-300
    `
  }

  const tamanhos = {
    sm: 'min-h-9 px-3 py-2 text-sm',
    md: 'min-h-11 px-4 py-2.5 text-sm',
    lg: 'min-h-12 px-5 py-3 text-base'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`
        ${estilosBase}
        ${variantes[variant] || variantes.primary}
        ${tamanhos[size] || tamanhos.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          Aguarde...
        </>
      ) : (
        children
      )}
    </button>
  )
}
