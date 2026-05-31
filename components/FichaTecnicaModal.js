import { useEffect, useState } from 'react'

export default function FichaTecnicaModal({
  open,
  onClose,
  produto,
  insumos,
  composicao,
  onAdicionarInsumo,
  onRemoverInsumo,
  onSalvarTempo
}) {
  const [insumoId, setInsumoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [tempoProducao, setTempoProducao] = useState('')

  useEffect(() => {
    if (open && produto) {
      setInsumoId('')
      setQuantidade('1')
      setTempoProducao(produto.tempo_producao || '')
    }
  }, [open, produto])

  if (!open || !produto) return null

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function calcularTotal() {
    return composicao.reduce((total, item) => {
      const custoUnitario = Number(item.estoque?.custo_unitario || 0)
      const qtd = Number(item.quantidade || 0)

      return total + custoUnitario * qtd
    }, 0)
  }

  function adicionar() {
    if (!insumoId) {
      alert('Selecione um insumo.')
      return
    }

    onAdicionarInsumo({
      produto_id: produto.id,
      insumo_id: insumoId,
      quantidade: Number(quantidade || 1)
    })

    setInsumoId('')
    setQuantidade('1')
  }

  function salvarTempo() {
    onSalvarTempo(produto.id, Number(tempoProducao || 0))
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Ficha Técnica
            </h2>

            <p className="text-gray-500">
              {produto.nome}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">
            Tempo de produção
          </h3>

          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Tempo em minutos"
              value={tempoProducao}
              onChange={(e) => setTempoProducao(e.target.value)}
              className="border rounded-xl px-4 py-3 flex-1"
            />

            <button
              onClick={salvarTempo}
              className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
            >
              Salvar Tempo
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">
            Adicionar insumo
          </h3>

          <div className="grid grid-cols-3 gap-4">

            <select
              value={insumoId}
              onChange={(e) => setInsumoId(e.target.value)}
              className="border rounded-xl px-4 py-3 col-span-2"
            >
              <option value="">Selecione um insumo</option>

              {insumos.map(insumo => (
                <option
                  key={insumo.id}
                  value={insumo.id}
                >
                  {insumo.nome} — {formatarMoeda(insumo.custo_unitario)}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

          </div>

          <button
            onClick={adicionar}
            className="mt-4 bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            + Adicionar Insumo
          </button>
        </div>

        <div className="border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Insumo</th>
                <th className="text-left p-4 text-gray-600">Quantidade</th>
                <th className="text-left p-4 text-gray-600">Custo Unit.</th>
                <th className="text-left p-4 text-gray-600">Subtotal</th>
                <th className="text-left p-4 text-gray-600">Ações</th>
              </tr>
            </thead>

            <tbody>
              {composicao.map(item => {
                const custoUnitario = Number(item.estoque?.custo_unitario || 0)
                const subtotal = custoUnitario * Number(item.quantidade || 0)

                return (
                  <tr key={item.id} className="border-t">
                    <td className="p-4">
                      {item.estoque?.nome || '-'}
                    </td>

                    <td className="p-4">
                      {item.quantidade}
                    </td>

                    <td className="p-4">
                      {formatarMoeda(custoUnitario)}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatarMoeda(subtotal)}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => onRemoverInsumo(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                )
              })}

              {composicao.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    Nenhum insumo adicionado à ficha técnica.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-xl font-semibold">
            Custo total dos insumos: {formatarMoeda(calcularTotal())}
          </div>
        </div>

      </div>
    </div>
  )
}