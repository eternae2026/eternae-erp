import { useEffect, useState } from 'react'

export default function OrcamentoModal({
  open,
  onClose,
  onSave,
  clientes,
  produtos,
  orcamento
}) {
  const [clienteId, setClienteId] = useState('')
  const [status, setStatus] = useState('Pendente')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState([])

  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [valorUnitario, setValorUnitario] = useState('')

  useEffect(() => {
    if (orcamento) {
      setClienteId(orcamento.cliente_id || '')
      setStatus(orcamento.status || 'Pendente')
      setObservacoes(orcamento.observacoes || '')
      setItens(orcamento.orcamento_itens || [])
    } else {
      setClienteId('')
      setStatus('Pendente')
      setObservacoes('')
      setItens([])
    }

    setProdutoId('')
    setQuantidade(1)
    setValorUnitario('')
  }, [orcamento, open])

  if (!open) return null

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function produtoSelecionado() {
    return produtos.find(produto => produto.id === produtoId)
  }

  function selecionarProduto(id) {
  setProdutoId(id)

  const produto = produtos.find(item => item.id === id)

  if (!produto) {
    setValorUnitario('')
    return
  }

  const precoProduto =
    produto.preco_final ||
    produto.preco ||
    0

  setValorUnitario(precoProduto)
}

  function adicionarItem() {
    if (!produtoId) {
      alert('Selecione um produto.')
      return
    }

    const produto = produtoSelecionado()
    const quantidadeNumero = Number(quantidade || 1)
    const valorNumero = Number(valorUnitario || 0)
    const subtotal = quantidadeNumero * valorNumero

    setItens([
      ...itens,
      {
        produto_id: produtoId,
        produtos: {
          nome: produto?.nome || 'Produto'
        },
        quantidade: quantidadeNumero,
        valor_unitario: valorNumero,
        subtotal
      }
    ])

    setProdutoId('')
    setQuantidade(1)
    setValorUnitario('')
  }

  function removerItem(index) {
    setItens(itens.filter((_, itemIndex) => itemIndex !== index))
  }

  function calcularTotal() {
    return itens.reduce((total, item) => {
      return total + Number(item.subtotal || 0)
    }, 0)
  }

  function handleSubmit() {
    onSave({
      cliente_id: clienteId,
      valor: calcularTotal(),
      status,
      observacoes,
      itens
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

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

        <div className="mt-6 border rounded-2xl p-5">
          <h3 className="font-bold text-gray-800 mb-4">
            Itens do orçamento
          </h3>

          <div className="grid grid-cols-4 gap-4 mb-4">

            <select
              value={produtoId}
              onChange={(e) => selecionarProduto(e.target.value)}
              className="border rounded-xl px-4 py-3"
            >
              <option value="">Selecione um produto</option>

              {produtos.map(produto => (
                <option
                  key={produto.id}
                  value={produto.id}
                >
                  {produto.nome}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="border rounded-xl px-4 py-3"
              placeholder="Qtd"
            />

            <input
              type="number"
              value={valorUnitario}
              onChange={(e) => setValorUnitario(e.target.value)}
              className="border rounded-xl px-4 py-3"
              placeholder="Valor unitário"
            />

{produtoSelecionado() && (
  <p className="text-xs text-green-700 mt-1">
    Preço precificado: {formatarMoeda(produtoSelecionado()?.preco_final || produtoSelecionado()?.preco)}
  </p>
)}

            <button
              onClick={adicionarItem}
              className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
            >
              + Adicionar
            </button>

          </div>

          {itens.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Nenhum item adicionado.
            </p>
          ) : (
            <div className="space-y-3">

              {itens.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.produtos?.nome || 'Produto'}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.quantidade} x {formatarMoeda(item.valor_unitario)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-gray-800">
                      {formatarMoeda(item.subtotal)}
                    </p>

                    <button
                      onClick={() => removerItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}

            </div>
          )}

          <div className="flex justify-end mt-5">
            <div className="bg-gray-900 text-white px-5 py-3 rounded-xl">
              Total: {formatarMoeda(calcularTotal())}
            </div>
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