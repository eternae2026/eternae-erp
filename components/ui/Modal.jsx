import { useEffect } from 'react'

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
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[calc(100vw-2rem)]'
  }

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeyDown(event) {
      if (
        event.key === 'Escape' &&
        closeOnEscape
      ) {
        onClose?.()
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown
    )

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      )

      document.body.style.overflow =
        previousOverflow
    }
  }, [open, closeOnEscape, onClose])

  if (!open) {
    return null
  }

  function handleOverlayClick(event) {
    if (
      event.target === event.currentTarget &&
      closeOnOverlay
    ) {
      onClose?.()
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-black/40
        px-4
        py-6
      "
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
          bg-white
          shadow-2xl
          ${sizes[size] || sizes.md}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          title ? 'modal-title' : undefined
        }
        aria-describedby={
          description
            ? 'modal-description'
            : undefined
        }
      >
        {(title ||
          description ||
          showCloseButton) && (
          <div
            className="
              flex
              flex-shrink-0
              items-start
              justify-between
              gap-4
              border-b
              border-gray-100
              px-6
              py-5
            "
          >
            <div className="min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="
                    text-xl
                    font-bold
                    text-gray-800
                  "
                >
                  {title}
                </h2>
              )}

              {description && (
                <p
                  id="modal-description"
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-gray-500
                  "
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="
                  inline-flex
                  h-9
                  w-9
                  flex-shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-gray-400
                  transition
                  hover:bg-gray-100
                  hover:text-gray-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-green-100
                "
                aria-label="Fechar modal"
                title="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            px-6
            py-5
          "
        >
          {children}
        </div>

        {footer && (
          <div
            className="
              flex
              flex-shrink-0
              flex-col-reverse
              gap-3
              border-t
              border-gray-100
              bg-gray-50/70
              px-6
              py-4
              sm:flex-row
              sm:items-center
              sm:justify-end
            "
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}