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
  if (!open) {
    return null
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget && !loading) {
      onCancel?.()
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
        bg-black/40
        px-4
      "
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          bg-white
          p-6
          shadow-2xl
        "
      >
        <div className="mb-6">
          <h2
            id="confirm-dialog-title"
            className="text-xl font-bold text-gray-800"
          >
            {title}
          </h2>

          {description && (
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {description}
            </p>
          )}

          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>

        <div
          className="
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:justify-end
          "
        >
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}