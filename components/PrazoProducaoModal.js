import { useEffect, useState } from 'react'

export default function PrazoProducaoModal({
  open,
  onClose,
  pedido,
  onConfirmar
}) {
  const [prazoDias, setPrazoDias] = useState('')

  useEffect(() => {
    if (open) {
      setPrazoDias(
        pedido?.prazo_producao_dias
          ? String(pedido.prazo_producao_dias)
          : ''
      )
    }
  }, [open, pedido])

  if (!open || !pedido) return null

  function confirmarPrazo() {
    const prazo = Number(prazoDias)

    if (!Number.isInteger(prazo) || prazo <= 0) {
      alert('Informe um prazo válido em dias.')
      return
    }

    onConfirmar(prazo)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Iniciar produção
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Informe o prazo estimado para este pedido.
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
            {pedido.clientes?.nome || '-'}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Pedido #{pedido.id.slice(0, 8)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prazo de produção (dias úteis)
          </label>

          <input
            type="number"
            min="1"
            value={prazoDias}
            onChange={(e) => setPrazoDias(e.target.value)}
            placeholder="Ex.: 7"
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
          />

          <p className="text-xs text-gray-500 mt-2">
            A data prevista será calculada automaticamente a partir do início da produção.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmarPrazo}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Confirmar e iniciar produção
          </button>
        </div>
      </div>
    </div>
  )
}