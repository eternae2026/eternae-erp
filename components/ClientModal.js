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
  const [salvando, setSalvando] = useState(false)

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

    setSalvando(false)
  }, [cliente, open])

  if (!open) return null

  function formatarWhatsapp(valor) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11)

    if (numeros.length <= 2) {
      return numeros
    }

    if (numeros.length <= 6) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
    }

    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(
        2,
        6
      )}-${numeros.slice(6)}`
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7
    )}-${numeros.slice(7)}`
  }

  async function handleSubmit() {
    if (salvando) return

    const nomeNormalizado = nome.trim()

    if (!nomeNormalizado) {
      alert('Informe o nome do cliente.')
      return
    }

    setSalvando(true)

    try {
      const resultado = await onSave({
        nome: nomeNormalizado,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
        aniversario: aniversario || null,
        observacoes: observacoes.trim() || null
      })

      if (resultado === false) {
        setSalvando(false)
      }
    } catch (error) {
      console.log('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente.')
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Nome <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={salvando}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100"
              placeholder="Nome do cliente"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              WhatsApp
            </label>

            <input
              type="text"
              value={whatsapp}
              onChange={(e) =>
                setWhatsapp(formatarWhatsapp(e.target.value))
              }
              disabled={salvando}
              inputMode="numeric"
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100"
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
              disabled={salvando}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100"
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
              disabled={salvando}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100"
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
            disabled={salvando}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100"
            placeholder="Observações sobre o cliente..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="px-5 py-3 rounded-xl border disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={salvando}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
