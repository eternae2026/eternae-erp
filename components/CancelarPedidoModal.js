import { useEffect, useState } from 'react'

export default function CancelarPedidoModal({
  open,
  onClose,
  pedido,
  onConfirmar
}) {
  const [motivo, setMotivo] = useState('')
  const [outroMotivo, setOutroMotivo] = useState('')

  useEffect(() => {
    if (open) {
      setMotivo('')
      setOutroMotivo('')
    }
  }, [open])

  if (!open || !pedido) return null

  function confirmarCancelamento() {
    const motivoFinal =
      motivo === 'Outro'
        ? outroMotivo.trim()
        : motivo

    if (!motivoFinal) {
      alert('Informe o motivo do cancelamento.')
      return
    }

    const confirmar = window.confirm(
      'Deseja realmente cancelar este pedido? Essa ação ficará registrada no histórico.'
    )

    if (!confirmar) return

    onConfirmar(motivoFinal)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70]">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Cancelar pedido
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Informe o motivo para manter o histórico organizado.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-sm text-gray-500">
            Cliente
          </p>

          <p className="font-semibold text-gray-800 mt-1">
            {pedido.clientes?.nome || 'Cliente'}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Pedido #{pedido.id.slice(0, 8)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo do cancelamento
          </label>

          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">
              Selecione um motivo
            </option>

            <option value="Cliente desistiu da compra">
              Cliente desistiu da compra
            </option>

            <option value="Prazo não atendido">
              Prazo não atendido
            </option>

            <option value="Pedido duplicado">
              Pedido duplicado
            </option>

            <option value="Outro">
              Outro
            </option>
          </select>
        </div>

        {motivo === 'Outro' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descreva o motivo
            </label>

            <textarea
              rows="3"
              value={outroMotivo}
              onChange={(e) => setOutroMotivo(e.target.value)}
              placeholder="Informe o motivo do cancelamento..."
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        )}

        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-5">
          <p className="font-semibold text-red-800">
            Atenção
          </p>

          <p className="text-sm text-red-700 mt-1">
            O pedido será marcado como cancelado e deixará de aparecer entre os pedidos ativos.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={confirmarCancelamento}
            className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition"
          >
            Confirmar cancelamento
          </button>
        </div>

      </div>
    </div>
  )
}