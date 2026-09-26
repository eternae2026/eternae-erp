import { useEffect, useState } from 'react'

export default function CustoOperacionalModal({
  open,
  onClose,
  onSave,
  custo
}) {
  const [nome, setNome] = useState('')
  const [valorMensal, setValorMensal] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (custo) {
      setNome(custo.nome || '')
      setValorMensal(
        custo.valor_mensal !== null &&
        custo.valor_mensal !== undefined
          ? String(custo.valor_mensal)
          : ''
      )
    } else {
      setNome('')
      setValorMensal('')
    }

    setSalvando(false)
  }, [custo, open])

  if (!open) return null

  async function handleSubmit() {
    if (salvando) return

    const nomeNormalizado = nome.trim()
    const valorNormalizado = String(valorMensal)
      .trim()
      .replace(',', '.')
    const valorNumerico = Number(valorNormalizado)

    if (!nomeNormalizado) {
      alert('Informe o nome do custo operacional.')
      return
    }

    if (!valorNormalizado) {
      alert('Informe o valor mensal do custo operacional.')
      return
    }

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico < 0
    ) {
      alert(
        'Informe um valor mensal válido, igual ou maior que zero.'
      )
      return
    }

    setSalvando(true)

    try {
      const resultado = await onSave({
        nome: nomeNormalizado,
        valor_mensal: valorNumerico
      })

      if (resultado === false) {
        setSalvando(false)
      }
    } catch (error) {
      console.log(
        'Erro ao salvar custo operacional:',
        error
      )

      alert('Erro ao salvar custo operacional.')
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {custo
                ? 'Editar Custo Operacional'
                : 'Novo Custo Operacional'}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Informe o custo mensal real da operação.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
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
              placeholder="Ex.: Energia elétrica"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Valor mensal{' '}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                R$
              </span>

              <input
                type="text"
                inputMode="decimal"
                value={valorMensal}
                onChange={(e) =>
                  setValorMensal(e.target.value)
                }
                disabled={salvando}
                className="w-full border rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100"
                placeholder="0,00"
              />
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Informe o valor mensal utilizado como custo
              operacional da empresa.
            </p>
          </div>
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
            {salvando
              ? 'Salvando...'
              : 'Salvar Custo'}
          </button>
        </div>
      </div>
    </div>
  )
}