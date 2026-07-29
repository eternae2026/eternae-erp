import { useEffect, useId } from 'react'

export default function Modal({
  open = false,
  title = '',
  description = '',
  children,
  footer = null,
  onClose,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = ''
}) {
  const titleId = useId()
  const descriptionId = useId()

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[calc(100vw-2rem)]'
  }

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape' && closeOnEscape) onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, closeOnEscape, onClose])

  if (!open) return null

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget && closeOnOverlay) onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-gray-950/45 px-4 py-6 backdrop-blur-[1px]"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className={`
          relative
          flex
          max-h-[calc(100vh-3rem)]
          w-full
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-white/70
          bg-white
          shadow-2xl
          ${sizes[size] || sizes.md}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        {(title || description || showCloseButton) && (
          <div className="flex flex-shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-8 sm:pt-7">
            <div className="min-w-0">
              {title && <h2 id={titleId} className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h2>}
              {description && <p id={descriptionId} className="mt-1.5 text-sm leading-6 text-gray-500">{description}</p>}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 -mt-2 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-100"
                aria-label="Fechar modal"
                title="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2 sm:px-8 sm:pb-7">
          {children}
        </div>

        {footer && (
          <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
