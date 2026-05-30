import { useEffect, useState } from 'react'

export default function OrcamentoModal({
  open,
  onClose,
  onSave,
  clientes,
  orcamento
}) {
  const [clienteId, setClienteId] = useState('')
  const [valor, setValor] = useState('')
  const [status, setStatus] = useState('Pendente')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (orcamento) {
      setClienteId(orcamento.cliente_id || '')
      setValor(orcamento.valor || '')
      setStatus(orcamento.status || 'Pendente')
      setObservacoes(orcamento.observacoes || '')
    } else {
      setClienteId('')
      setValor('')
      setStatus('Pendente')
      setObservacoes('')
    }
  }, [orcamento])

  if (!open) return null

  function handleSubmit() {
    onSave({
      cliente_id: clienteId,
      valor: Number(valor || 0),
      status,
      observacoes
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {orcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Cliente
            </label>

            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Selecione um cliente</option>

              {clientes.map(cliente => (
                <option
                  key={cliente.id}
                  value={cliente.id}
                >
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Valor
            </label>

            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="Pendente">Pendente</option>
              <option value="Enviado">Enviado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Recusado">Recusado</option>
            </select>
          </div>

        </div>

        <div className="mt-4">
          <label className="block text-sm text-gray-600 mb-2">
            Observações
          </label>

          <textarea
            rows="4"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Detalhes do orçamento..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Salvar Orçamento
          </button>
        </div>

      </div>
    </div>
  )
}