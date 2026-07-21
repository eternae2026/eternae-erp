import { useEffect, useState } from 'react'

export default function ContaPagarModal({
  open,
  onClose,
  onSalvar,
  categorias
}) {
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!open) return

    const primeiraCategoria = categorias?.[0]?.id || ''
    setCategoriaId(primeiraCategoria)
  }, [open, categorias])

  if (!open) return null

  function limparCampos() {
    setDescricao('')
    setCategoriaId(categorias?.[0]?.id || '')
    setFornecedor('')
    setValor('')
    setVencimento('')
    setObservacoes('')
  }

  function fecharModal() {
    limparCampos()
    onClose()
  }

  async function salvar() {
    if (!descricao.trim()) {
      alert('Informe a descrição da conta.')
      return
    }

    const valorConvertido = Number(
      String(valor).replace(',', '.')
    )

    if (!valor || Number.isNaN(valorConvertido) || valorConvertido <= 0) {
      alert('Informe um valor válido.')
      return
    }

    if (!vencimento) {
      alert('Informe a data de vencimento.')
      return
    }

    setSalvando(true)

    const salvou = await onSalvar({
      descricao: descricao.trim(),
      categoria_id: categoriaId || null,
      fornecedor: fornecedor.trim() || null,
      valor: valorConvertido,
      data_vencimento: vencimento,
      observacoes: observacoes.trim() || null
    })

    setSalvando(false)

    if (salvou) {
      limparCampos()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Nova Conta a Pagar
            </h2>

            <p className="text-gray-500 mt-1">
              Cadastre uma despesa ou obrigação futura.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            className="text-gray-400 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição *
            </label>

            <input
              type="text"
              placeholder="Ex.: Conta de internet"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>

            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 bg-white"
            >
              <option value="">
                Sem categoria
              </option>

              {(categorias || []).map((categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fornecedor
            </label>

            <input
              type="text"
              placeholder="Ex.: Operadora de internet"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimento *
              </label>

              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>

            <textarea
              rows={3}
              placeholder="Informações adicionais"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={fecharModal}
            disabled={salvando}
            className="border px-5 py-3 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar Conta'}
          </button>
        </div>
      </div>
    </div>
  )
}