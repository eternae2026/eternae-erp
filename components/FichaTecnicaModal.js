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
  const [salvandoTempo, setSalvandoTempo] = useState(false)
  const [adicionando, setAdicionando] = useState(false)
  const [removendoId, setRemovendoId] = useState(null)

  useEffect(() => {
    if (open && produto) {
      setInsumoId('')
      setQuantidade('1')
      setTempoProducao(
        produto.tempo_producao !== null &&
          produto.tempo_producao !== undefined
          ? String(produto.tempo_producao)
          : ''
      )
      setSalvandoTempo(false)
      setAdicionando(false)
      setRemovendoId(null)
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
      const custoUnitario = Number(
        item.estoque?.custo_unitario || 0
      )

      const qtd = Number(item.quantidade || 0)

      return total + custoUnitario * qtd
    }, 0)
  }

  async function adicionar() {
    if (adicionando) return

    if (!insumoId) {
      alert('Selecione um insumo.')
      return
    }

    const quantidadeNumero = Number(quantidade)

    if (
      !Number.isFinite(quantidadeNumero) ||
      quantidadeNumero <= 0
    ) {
      alert(
        'Informe uma quantidade maior que zero.'
      )
      return
    }

    const insumoDuplicado = composicao.some(
      (item) => item.insumo_id === insumoId
    )

    if (insumoDuplicado) {
      alert(
        'Este insumo já faz parte da ficha técnica. Remova a linha atual antes de cadastrá-lo novamente com outra quantidade.'
      )
      return
    }

    setAdicionando(true)

    try {
      const resultado = await onAdicionarInsumo({
        produto_id: produto.id,
        insumo_id: insumoId,
        quantidade: quantidadeNumero
      })

      if (resultado === false) {
        return
      }

      setInsumoId('')
      setQuantidade('1')
    } finally {
      setAdicionando(false)
    }
  }

  async function salvarTempo() {
    if (salvandoTempo) return

    const tempoNumero = Number(tempoProducao)

    if (
      !Number.isInteger(tempoNumero) ||
      tempoNumero <= 0
    ) {
      alert(
        'Informe o tempo de produção em minutos inteiros, maior que zero.'
      )
      return
    }

    setSalvandoTempo(true)

    try {
      await onSalvarTempo(
        produto.id,
        tempoNumero
      )
    } finally {
      setSalvandoTempo(false)
    }
  }

  async function remover(item) {
    if (removendoId) return

    const confirmar = confirm(
      `Deseja remover ${item.estoque?.nome || 'este insumo'} da ficha técnica?`
    )

    if (!confirmar) return

    setRemovendoId(item.id)

    try {
      await onRemoverInsumo(item.id)
    } finally {
      setRemovendoId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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
            type="button"
            onClick={onClose}
            disabled={
              salvandoTempo ||
              adicionando ||
              Boolean(removendoId)
            }
            className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">
            Tempo de produção
          </h3>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Tempo em minutos"
              value={tempoProducao}
              onChange={(e) =>
                setTempoProducao(e.target.value)
              }
              disabled={salvandoTempo}
              className="border rounded-xl px-4 py-3 flex-1 disabled:bg-gray-100"
            />

            <button
              type="button"
              onClick={salvarTempo}
              disabled={salvandoTempo}
              className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-60"
            >
              {salvandoTempo
                ? 'Salvando...'
                : 'Salvar Tempo'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">
            Adicionar insumo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={insumoId}
              onChange={(e) =>
                setInsumoId(e.target.value)
              }
              disabled={adicionando}
              className="border rounded-xl px-4 py-3 md:col-span-2 disabled:bg-gray-100"
            >
              <option value="">
                Selecione um insumo
              </option>

              {insumos.map((insumo) => (
                <option
                  key={insumo.id}
                  value={insumo.id}
                >
                  {insumo.nome} —{' '}
                  {formatarMoeda(
                    insumo.custo_unitario
                  )}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0.0001"
              step="any"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(e) =>
                setQuantidade(e.target.value)
              }
              disabled={adicionando}
              className="border rounded-xl px-4 py-3 disabled:bg-gray-100"
            />
          </div>

          <button
            type="button"
            onClick={adicionar}
            disabled={adicionando}
            className="mt-4 bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-60"
          >
            {adicionando
              ? 'Adicionando...'
              : '+ Adicionar Insumo'}
          </button>
        </div>

        <div className="border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-gray-600">
                    Insumo
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Quantidade
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Custo Unit.
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Subtotal
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {composicao.map((item) => {
                  const custoUnitario = Number(
                    item.estoque?.custo_unitario || 0
                  )

                  const subtotal =
                    custoUnitario *
                    Number(item.quantidade || 0)

                  return (
                    <tr
                      key={item.id}
                      className="border-t"
                    >
                      <td className="p-4">
                        {item.estoque?.nome || '-'}
                      </td>

                      <td className="p-4">
                        {item.quantidade}
                      </td>

                      <td className="p-4">
                        {formatarMoeda(
                          custoUnitario
                        )}
                      </td>

                      <td className="p-4 font-semibold">
                        {formatarMoeda(subtotal)}
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() =>
                            remover(item)
                          }
                          disabled={
                            removendoId === item.id
                          }
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {removendoId === item.id
                            ? 'Removendo...'
                            : 'Remover'}
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {composicao.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-gray-500"
                    >
                      Nenhum insumo adicionado à ficha técnica.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-xl font-semibold">
            Custo total dos insumos:{' '}
            {formatarMoeda(calcularTotal())}
          </div>
        </div>
      </div>
    </div>
  )
}
