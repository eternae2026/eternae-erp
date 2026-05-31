import { useState } from 'react'

export default function ReceberPagamentoModal({
  open,
  onClose,
  onConfirmar,
  lancamento
}) {
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [dataPagamento, setDataPagamento] = useState('')
  const [observacoes, setObservacoes] = useState('')

  if (!open) return null

  function confirmarRecebimento() {
    onConfirmar({
      forma_pagamento: formaPagamento,
      data_pagamento: dataPagamento || new Date().toISOString().slice(0, 10),
      observacoes,
      status: 'Recebido'
    })

    setFormaPagamento('PIX')
    setDataPagamento('')
    setObservacoes('')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-2xl p-8">

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Receber Pagamento
        </h2>

        <p className="text-gray-500 mb-6">
          Confirme o recebimento deste lançamento.
        </p>

        <div className="space-y-4">

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Forma de pagamento
            </label>

            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            >
              <option value="PIX">PIX</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de crédito">Cartão de crédito</option>
              <option value="Cartão de débito">Cartão de débito</option>
              <option value="Transferência">Transferência</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Data do pagamento
            </label>

            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Observações
            </label>

            <textarea
              rows="3"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Observações sobre o pagamento..."
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border"
          >
            Cancelar
          </button>

          <button
            onClick={confirmarRecebimento}
            className="bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition"
          >
            Confirmar Recebimento
          </button>
        </div>

      </div>
    </div>
  )
}