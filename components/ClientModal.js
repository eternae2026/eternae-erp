import { useEffect, useState } from 'react'

export default function ClientModal({
  open,
  onClose,
  onSave,
  cliente
}) {
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [aniversario, setAniversario] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome || '')
      setWhatsapp(cliente.whatsapp || '')
      setInstagram(cliente.instagram || '')
      setAniversario(cliente.aniversario || '')
      setObservacoes(cliente.observacoes || '')
    } else {
      setNome('')
      setWhatsapp('')
      setInstagram('')
      setAniversario('')
      setObservacoes('')
    }
  }, [cliente])

  if (!open) return null

  function handleSubmit() {
    onSave({
      nome,
      whatsapp,
      instagram,
      aniversario,
      observacoes
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
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
              Nome
            </label>

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              WhatsApp
            </label>

            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Instagram
            </label>

            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="@instagram"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Aniversário
            </label>

            <input
              type="date"
              value={aniversario}
              onChange={(e) => setAniversario(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900"
            />
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
            placeholder="Observações sobre o cliente..."
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
            Salvar Cliente
          </button>

        </div>

      </div>
    </div>
  )
}