import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
  const [kits, setKits] = useState([])

  const [tipoItem, setTipoItem] = useState('produto')
  const [produtoId, setProdutoId] = useState('')
  const [kitId, setKitId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [valorUnitario, setValorUnitario] = useState('')

  useEffect(() => {
    if (open) {
      carregarKits()
    }
  }, [open])

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

    limparSelecaoItem()
  }, [orcamento, open])

  async function carregarKits() {
    const { data, error } = await supabase
      .from('kits')
      .select('*')
      .eq('ativo', true)
      .gt('preco_final', 0)
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar kits:', error)
      return
    }

    setKits(data || [])
  }

  if (!open) return null

  function limparSelecaoItem() {
    setTipoItem('produto')
    setProdutoId('')
    setKitId('')
    setQuantidade(1)
    setValorUnitario('')
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function produtoSelecionado() {
    return produtos.find(produto => produto.id === produtoId)
  }

  function kitSelecionado() {
    return kits.find(kit => kit.id === kitId)
  }

  function selecionarTipoItem(tipo) {
    setTipoItem(tipo)
    setProdutoId('')
    setKitId('')
    setValorUnitario('')
  }

  function selecionarProduto(id) {
    setProdutoId(id)

    const produto = produtos.find(item => item.id === id)

    if (!produto) {
      setValorUnitario('')
      return
    }

    setValorUnitario(produto.preco_final || produto.preco || 0)
  }

  function selecionarKit(id) {
    setKitId(id)

    const kit = kits.find(item => item.id === id)

    if (!kit) {
      setValorUnitario('')
      return
    }

    setValorUnitario(kit.preco_final || 0)
  }

  function adicionarItem() {
    const quantidadeNumero = Number(quantidade || 1)
    const valorNumero = Number(valorUnitario || 0)
    const subtotal = quantidadeNumero * valorNumero

    if (tipoItem === 'produto') {
      if (!produtoId) {
        alert('Selecione um produto.')
        return
      }

      const produto = produtoSelecionado()

      setItens([
        ...itens,
        {
          tipo_item: 'produto',
          produto_id: produtoId,
          kit_id: null,
          nome_item: produto?.nome || 'Produto',
          produtos: {
            nome: produto?.nome || 'Produto'
          },
          quantidade: quantidadeNumero,
          valor_unitario: valorNumero,
          subtotal
        }
      ])
    }

    if (tipoItem === 'kit') {
      if (!kitId) {
        alert('Selecione um kit.')
        return
      }

      const kit = kitSelecionado()

      setItens([
        ...itens,
        {
          tipo_item: 'kit',
          produto_id: null,
          kit_id: kitId,
          nome_item: kit?.nome || 'Kit',
          produtos: null,
          quantidade: quantidadeNumero,
          valor_unitario: valorNumero,
          subtotal
        }
      ])
    }

    limparSelecaoItem()
  }

  function removerItem(index) {
    setItens(itens.filter((_, itemIndex) => itemIndex !== index))
  }

  function calcularTotal() {
    return itens.reduce((total, item) => {
      return total + Number(item.subtotal || 0)
    }, 0)
  }

  function nomeItem(item) {
    return item.nome_item || item.produtos?.nome || 'Item'
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
                <option key={cliente.id} value={cliente.id}>
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

          <div className="grid grid-cols-5 gap-4 mb-4">

            <select
              value={tipoItem}
              onChange={(e) => selecionarTipoItem(e.target.value)}
              className="border rounded-xl px-4 py-3"
            >
              <option value="produto">Produto</option>
              <option value="kit">Kit</option>
            </select>

            {tipoItem === 'produto' && (
              <select
                value={produtoId}
                onChange={(e) => selecionarProduto(e.target.value)}
                className="border rounded-xl px-4 py-3"
              >
                <option value="">Selecione um produto</option>

                {produtos.map(produto => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>
            )}

            {tipoItem === 'kit' && (
              <select
                value={kitId}
                onChange={(e) => selecionarKit(e.target.value)}
                className="border rounded-xl px-4 py-3"
              >
                <option value="">Selecione um kit</option>

                {kits.map(kit => (
                  <option key={kit.id} value={kit.id}>
                    {kit.nome}
                  </option>
                ))}
              </select>
            )}

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

            <button
              onClick={adicionarItem}
              className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
            >
              + Adicionar
            </button>

          </div>

          {tipoItem === 'produto' && produtoSelecionado() && (
            <p className="text-xs text-green-700 mb-4">
              Preço precificado: {formatarMoeda(produtoSelecionado()?.preco_final || produtoSelecionado()?.preco)}
            </p>
          )}

          {tipoItem === 'kit' && kitSelecionado() && (
            <p className="text-xs text-green-700 mb-4">
              Preço do kit: {formatarMoeda(kitSelecionado()?.preco_final)}
            </p>
          )}

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
                      {nomeItem(item)}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.tipo_item === 'kit' ? '🎁 Kit' : '🛍️ Produto'} · {item.quantidade} x {formatarMoeda(item.valor_unitario)}
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