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
    items-center
    justify-center
    gap-2
    rounded-xl
    font-medium
    transition
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
  `

  const variantes = {
    primary: `
      bg-gray-900
      text-white
      hover:bg-gray-800
      focus:ring-gray-500
    `,

    secondary: `
      bg-white
      text-gray-700
      border
      border-gray-200
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
      bg-yellow-500
      text-white
      hover:bg-yellow-600
      focus:ring-yellow-400
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
      hover:bg-gray-100
      focus:ring-gray-300
    `
  }

  const tamanhos = {
    sm: `
      px-3
      py-2
      text-sm
    `,

    md: `
      px-4
      py-2.5
      text-sm
    `,

    lg: `
      px-5
      py-3
      text-base
    `
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
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
            className="
              w-4
              h-4
              rounded-full
              border-2
              border-current
              border-t-transparent
              animate-spin
            "
          />

          Aguarde...
        </>
      ) : (
        children
      )}
    </button>
  )
}