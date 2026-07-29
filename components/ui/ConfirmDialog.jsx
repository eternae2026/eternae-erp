import { useEffect, useId } from 'react'
import Button from './Button'

export default function ConfirmDialog({
  open = false,
  title = 'Confirmar ação',
  description = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  children = null
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !loading) onCancel?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, loading, onCancel])

  if (!open) return null

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget && !loading) onCancel?.()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/45 px-4 py-6 backdrop-blur-[1px]"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mb-6">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>

          {description && <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>}
          {children && <div className="mt-4">{children}</div>}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>
            {cancelText}
          </Button>
          <Button type="button" variant={variant} loading={loading} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
