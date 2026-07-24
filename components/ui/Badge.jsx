import React from 'react'

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) {
  const estilosBase = `
    inline-flex
    items-center
    justify-center
    rounded-full
    font-medium
    whitespace-nowrap
  `

  const variantes = {
    success: `
      bg-green-100
      text-green-700
    `,

    warning: `
      bg-yellow-100
      text-yellow-700
    `,

    danger: `
      bg-red-100
      text-red-700
    `,

    info: `
      bg-blue-100
      text-blue-700
    `,

    neutral: `
      bg-gray-100
      text-gray-600
    `,

    dark: `
      bg-gray-900
      text-white
    `
  }

  const tamanhos = {
    sm: `
      px-2
      py-0.5
      text-xs
    `,

    md: `
      px-3
      py-1
      text-sm
    `
  }

  return (
    <span
      className={`
        ${estilosBase}
        ${variantes[variant] || variantes.neutral}
        ${tamanhos[size] || tamanhos.md}
        ${className}
      `}
    >
      {children}
    </span>
  )
}