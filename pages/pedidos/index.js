import ListaPedidosModal from '../../components/ListaPedidosModal'
import { useEffect, useState } from 'react'
import PedidoDetalhesModal from '../../components/PedidoDetalhesModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [buscaCliente, setBuscaCliente] = useState('')

const [tipoConsulta, setTipoConsulta] = useState('MesAtual')

const [mesSelecionado, setMesSelecionado] = useState(
  String(new Date().getMonth() + 1)
)

const [anoSelecionado, setAnoSelecionado] = useState(
  String(new Date().getFullYear())
)

const [dataInicial, setDataInicial] = useState('')
const [dataFinal, setDataFinal] = useState('')
  const [openDetalhes, setOpenDetalhes] = useState(false)
  const [openListaPedidos, setOpenListaPedidos] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null)

  const etapasProducao = [
    'Aguardando Pagamento',
    'Arte',
    'Aguardando Aprovação',
    'Produção',
    'Pronto',
    'Entregue',
    'Cancelado'
  ]

  const orcamentoItensSelect = `
    id,
    produto_id,
    nome_item,
    tipo_item,
    kit_id,
    quantidade,
    valor_unitario,
    subtotal,
    produtos (
      nome
    )
  `

  async function carregarPedidos() {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (
          nome
        ),
        financeiro (
          id,
          status
        ),
        producoes (
          id,
          status
        ),
        orcamentos (
          id,
          observacoes,
          orcamento_itens (
            ${orcamentoItensSelect}
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar pedidos:', error)
      return
    }

    setPedidos(data || [])
  }

  useEffect(() => {
    carregarPedidos()
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function calcularTotalPedido(pedido) {
    const itens = pedido.orcamentos?.orcamento_itens || []

    if (itens.length === 0) {
      return Number(pedido.valor || 0)
    }

    return itens.reduce((total, item) => {
      return total + Number(item.subtotal || 0)
    }, 0)
  }

  function etapaPedido(pedido) {
    return pedido.etapa_producao || 'Aguardando Pagamento'
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
  const cliente = pedido.clientes?.nome || ''

  const filtroCliente =
    buscaCliente.trim() === '' ||
    cliente.toLowerCase().includes(
      buscaCliente.toLowerCase()
    )

  const filtroPeriodo = dataDentroDoPeriodo(
    pedido.created_at
  )

  return filtroCliente && filtroPeriodo
})

  function pedidosPorEtapa(etapa) {
  return pedidosFiltrados.filter(
    pedido => etapaPedido(pedido) === etapa
  )
}

  function indiceEtapa(etapa) {
    return etapasProducao.indexOf(etapa)
  }

  function dataDentroDoPeriodo(data) {
  if (!data) return false

  const dataBase = new Date(data)

  if (tipoConsulta === 'Todos') {
    return true
  }

  if (tipoConsulta === 'MesAtual') {
    const hoje = new Date()

    return (
      dataBase.getMonth() === hoje.getMonth() &&
      dataBase.getFullYear() === hoje.getFullYear()
    )
  }

  if (tipoConsulta === 'MesEspecifico') {
    return (
      dataBase.getMonth() + 1 === Number(mesSelecionado) &&
      dataBase.getFullYear() === Number(anoSelecionado)
    )
  }

  if (tipoConsulta === 'PeriodoPersonalizado') {
    if (!dataInicial || !dataFinal) return true

    const inicio = new Date(dataInicial)
    const fim = new Date(dataFinal)

    return dataBase >= inicio && dataBase <= fim
  }

  return true
}

  function jaTemCobranca(pedido) {
    if (!pedido.financeiro) return false

    if (Array.isArray(pedido.financeiro)) {
      return pedido.financeiro.length > 0
    }

    return Boolean(pedido.financeiro.id)
  }

  function statusPagamento(pedido) {
    if (!pedido.financeiro) return null

    if (Array.isArray(pedido.financeiro)) {
      if (pedido.financeiro.length === 0) return null
      return pedido.financeiro[0].status
    }

    return pedido.financeiro.status
  }

  function verPedido(pedido) {
    setPedidoSelecionado(pedido)
    setOpenDetalhes(true)
  }

  async function baixarEstoqueDoPedido(pedido) {
    const itens = pedido.orcamentos?.orcamento_itens || []

    if (itens.length === 0) {
      alert('Este pedido não possui itens para baixa de estoque.')
      return false
    }

    const produtosConsumidos = []

    const itensProduto = itens.filter(item => item.produto_id)
    const itensKit = itens.filter(item => item.kit_id)

    itensProduto.forEach(item => {
      produtosConsumidos.push({
        produto_id: item.produto_id,
        quantidade: Number(item.quantidade || 1)
      })
    })

    if (itensKit.length > 0) {
      const kitIds = itensKit.map(item => item.kit_id)

      const { data: kitItens, error: erroKitItens } = await supabase
        .from('kit_itens')
        .select('*')
        .in('kit_id', kitIds)

      if (erroKitItens) {
        console.log('Erro ao carregar itens do kit:', erroKitItens)
        alert('Erro ao carregar itens do kit para baixa de estoque.')
        return false
      }

      itensKit.forEach(itemKit => {
        const quantidadeKit = Number(itemKit.quantidade || 1)

        const itensDoKit = (kitItens || []).filter(
          kitItem => kitItem.kit_id === itemKit.kit_id
        )

        itensDoKit.forEach(kitItem => {
          produtosConsumidos.push({
            produto_id: kitItem.produto_id,
            quantidade: Number(kitItem.quantidade || 1) * quantidadeKit
          })
        })
      })
    }

    if (produtosConsumidos.length === 0) {
      alert('Nenhum produto encontrado para baixa de estoque.')
      return false
    }

    const produtoIds = [...new Set(produtosConsumidos.map(item => item.produto_id))]

    const { data: composicoes, error: erroComposicoes } = await supabase
      .from('produto_composicao')
      .select('*')
      .in('produto_id', produtoIds)

    if (erroComposicoes) {
      console.log('Erro ao carregar composição:', erroComposicoes)
      alert('Erro ao carregar composição dos produtos.')
      return false
    }

    if (!composicoes || composicoes.length === 0) {
      alert('Os produtos deste pedido não possuem composição cadastrada.')
      return false
    }

    const consumoPorInsumo = {}

    produtosConsumidos.forEach(produto => {
      const composicoesProduto = composicoes.filter(
        composicao => composicao.produto_id === produto.produto_id
      )

      composicoesProduto.forEach(composicao => {
        const consumo =
          Number(composicao.quantidade || 0) *
          Number(produto.quantidade || 1)

        consumoPorInsumo[composicao.insumo_id] =
          Number(consumoPorInsumo[composicao.insumo_id] || 0) + consumo
      })
    })

    const insumoIds = Object.keys(consumoPorInsumo)

    const { data: estoqueAtual, error: erroEstoque } = await supabase
      .from('estoque')
      .select('*')
      .in('id', insumoIds)

    if (erroEstoque) {
      console.log('Erro ao carregar estoque:', erroEstoque)
      alert('Erro ao carregar estoque.')
      return false
    }

    for (const insumoId of insumoIds) {
      const itemEstoque = estoqueAtual?.find(item => item.id === insumoId)

      if (!itemEstoque) continue

      const novaQuantidade =
        Number(itemEstoque.quantidade_disponivel || 0) -
        Number(consumoPorInsumo[insumoId] || 0)

      const { error: erroAtualizarEstoque } = await supabase
        .from('estoque')
        .update({
          quantidade_disponivel: novaQuantidade
        })
        .eq('id', insumoId)

      if (erroAtualizarEstoque) {
        console.log('Erro ao atualizar estoque:', erroAtualizarEstoque)
        alert('Erro ao atualizar estoque.')
        return false
      }
    }

    return true
  }

  async function atualizarEtapaPedido(pedido, novaEtapa) {
    const dadosAtualizacao = {
      etapa_producao: novaEtapa
    }

    if (
      novaEtapa === 'Pronto' &&
      !pedido.estoque_baixado
    ) {
      const baixou = await baixarEstoqueDoPedido(pedido)

      if (!baixou) return

      dadosAtualizacao.estoque_baixado = true
    }

    const { data, error } = await supabase
      .from('pedidos')
      .update(dadosAtualizacao)
      .eq('id', pedido.id)
      .select(`
        *,
        clientes (
          nome
        ),
        financeiro (
          id,
          status
        ),
        producoes (
          id,
          status
        ),
        orcamentos (
          id,
          observacoes,
          orcamento_itens (
            ${orcamentoItensSelect}
          )
        )
      `)

    if (error) {
      console.log('Erro ao atualizar etapa:', error)
      alert('Erro ao atualizar etapa do pedido.')
      return
    }

    setPedidos(
      pedidos.map(item =>
        item.id === pedido.id ? data[0] : item
      )
    )
  }

  async function cancelarPedido(pedido) {
    const etapaAtual = etapaPedido(pedido)

    if (etapaAtual === 'Cancelado') return

    if (statusPagamento(pedido) === 'Recebido') {
      const confirmarPago = confirm(
        'Este pedido já possui pagamento recebido. Deseja cancelar mesmo assim? Verifique se será necessário reembolso.'
      )

      if (!confirmarPago) return
    }

    const confirmar = confirm(
      'Deseja cancelar este pedido? Ele continuará no histórico, mas sairá do fluxo ativo.'
    )

    if (!confirmar) return

    const { error: erroPedido } = await supabase
      .from('pedidos')
      .update({
        etapa_producao: 'Cancelado',
        status: 'Cancelado'
      })
      .eq('id', pedido.id)

    if (erroPedido) {
      console.log('Erro ao cancelar pedido:', erroPedido)
      alert('Erro ao cancelar pedido.')
      return
    }

    const { error: erroFinanceiro } = await supabase
      .from('financeiro')
      .update({
        status: 'Cancelado'
      })
      .eq('pedido_id', pedido.id)
      .eq('status', 'Pendente')

    if (erroFinanceiro) {
      console.log('Erro ao cancelar financeiro:', erroFinanceiro)
      alert('Pedido cancelado, mas houve erro ao cancelar cobrança pendente.')
      await carregarPedidos()
      return
    }

    alert('Pedido cancelado com sucesso!')
    await carregarPedidos()
  }

  async function gerarCobranca(pedido) {
    const confirmar = confirm('Deseja gerar cobrança para este pedido?')

    if (!confirmar) return

    const valorReal = calcularTotalPedido(pedido)

    const { data, error } = await supabase
      .from('financeiro')
      .insert([
        {
          pedido_id: pedido.id,
          cliente_id: pedido.cliente_id,
          valor: valorReal,
          forma_pagamento: 'PIX',
          status: 'Pendente'
        }
      ])
      .select()

    if (error) {
      console.log('Erro ao gerar cobrança:', error)

      if (error.code === '23505') {
        alert('Este pedido já possui cobrança gerada.')
        await carregarPedidos()
        return
      }

      alert('Erro ao gerar cobrança.')
      return
    }

    setPedidos(
      pedidos.map(item =>
        item.id === pedido.id
          ? {
              ...item,
              financeiro: data || []
            }
          : item
      )
    )

    alert('Cobrança gerada com sucesso!')
  }

  function avancarPedido(pedido) {
    const etapaAtual = etapaPedido(pedido)

    if (etapaAtual === 'Cancelado') return

    const indiceAtual = indiceEtapa(etapaAtual)

    if (indiceAtual === etapasProducao.length - 1) return

    const proximaEtapa = etapasProducao[indiceAtual + 1]

    if (proximaEtapa === 'Cancelado') return

    if (proximaEtapa === 'Arte' && statusPagamento(pedido) !== 'Recebido') {
      alert('Só é possível avançar para Arte após o pagamento ser recebido.')
      return
    }

    atualizarEtapaPedido(pedido, proximaEtapa)
  }

  function voltarPedido(pedido) {
    const etapaAtual = etapaPedido(pedido)

    if (etapaAtual === 'Cancelado') return

    const indiceAtual = indiceEtapa(etapaAtual)

    if (indiceAtual === 0) return

    const etapaAnterior = etapasProducao[indiceAtual - 1]

    atualizarEtapaPedido(pedido, etapaAnterior)
  }

  function corEtapa(etapa) {
    if (etapa === 'Aguardando Pagamento') return 'bg-yellow-50'
    if (etapa === 'Arte') return 'bg-blue-50'
    if (etapa === 'Aguardando Aprovação') return 'bg-orange-50'
    if (etapa === 'Produção') return 'bg-purple-50'
    if (etapa === 'Pronto') return 'bg-green-50'
    if (etapa === 'Entregue') return 'bg-gray-50'
    if (etapa === 'Cancelado') return 'bg-red-50'

    return 'bg-white'
  }

  function statusVisual(pedido) {
    const etapa = etapaPedido(pedido)

    if (etapa === 'Cancelado') {
      return {
        texto: 'Cancelado',
        classe: 'bg-red-100 text-red-700'
      }
    }

    if (statusPagamento(pedido) === 'Recebido') {
      return {
        texto: 'Pago',
        classe: 'bg-green-100 text-green-700'
      }
    }

    if (statusPagamento(pedido) === 'Cancelado') {
      return {
        texto: 'Cancelado',
        classe: 'bg-red-100 text-red-700'
      }
    }

    return {
      texto: 'Pendente',
      classe: 'bg-yellow-100 text-yellow-700'
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-hidden">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Pedidos
            </h1>

            <p className="text-gray-500">
              Acompanhe pagamento, arte, aprovação, produção, entrega e cancelamentos dos pedidos.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

    <input
      type="text"
      placeholder="Buscar cliente..."
      value={buscaCliente}
      onChange={(e) => setBuscaCliente(e.target.value)}
      className="border rounded-xl px-4 py-3 md:col-span-2"
    />

   <select
  value={tipoConsulta}
  onChange={(e) => setTipoConsulta(e.target.value)}
  className="border rounded-xl px-4 py-3"
>
  <option value="MesAtual">
    Mês atual
  </option>

  <option value="MesEspecifico">
    Mês específico
  </option>

  <option value="PeriodoPersonalizado">
    Período personalizado
  </option>

  <option value="Todos">
    Todos
  </option>
</select>

<button
  type="button"
  onClick={() => setOpenListaPedidos(true)}
  className="bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition"
>
  📋 Consultar Pedidos
</button>

    {tipoConsulta === 'MesEspecifico' && (
      <>
        <select
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
          className="border rounded-xl px-4 py-3"
        >
          <option value="1">Janeiro</option>
          <option value="2">Fevereiro</option>
          <option value="3">Março</option>
          <option value="4">Abril</option>
          <option value="5">Maio</option>
          <option value="6">Junho</option>
          <option value="7">Julho</option>
          <option value="8">Agosto</option>
          <option value="9">Setembro</option>
          <option value="10">Outubro</option>
          <option value="11">Novembro</option>
          <option value="12">Dezembro</option>
        </select>

        <input
          type="number"
          value={anoSelecionado}
          onChange={(e) => setAnoSelecionado(e.target.value)}
          className="border rounded-xl px-4 py-3"
        />
      </>
    )}

    {tipoConsulta === 'PeriodoPersonalizado' && (
      <>
        <input
          type="date"
          value={dataInicial}
          onChange={(e) => setDataInicial(e.target.value)}
          className="border rounded-xl px-4 py-3"
        />

        <input
          type="date"
          value={dataFinal}
          onChange={(e) => setDataFinal(e.target.value)}
          className="border rounded-xl px-4 py-3"
        />
      </>
    )}

  </div>
</div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-5 min-w-max">

            {etapasProducao.map(etapa => {
              const lista = pedidosPorEtapa(etapa)

              return (
                <div
                  key={etapa}
                  className={`${corEtapa(etapa)} w-80 shrink-0 rounded-2xl p-4 shadow-sm h-[calc(100vh-170px)] flex flex-col`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-sm leading-5">
                      {etapa}
                    </h3>

                    <span className="bg-white text-gray-600 px-2 py-1 rounded-full text-xs shadow-sm">
                      {lista.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {lista.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        Nenhum pedido nesta etapa.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {lista.map(pedido => {
                          const indiceAtual = indiceEtapa(etapaPedido(pedido))
                          const etapaAtual = etapaPedido(pedido)
                          const visual = statusVisual(pedido)
                          const bloqueado = etapaAtual === 'Cancelado'

                          return (
                            <div
                              key={pedido.id}
                              className="border rounded-xl p-4 bg-white shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {pedido.clientes?.nome || '-'}
                                  </p>

                                  <p className="text-sm text-gray-500 mt-1">
                                    {formatarMoeda(calcularTotalPedido(pedido))}
                                  </p>
                                </div>

                                <span className={`${visual.classe} px-2 py-1 rounded-full text-[11px] font-semibold`}>
                                  {visual.texto}
                                </span>
                              </div>

                              <p className="text-xs text-gray-400 mt-2">
                                Pedido #{pedido.id.slice(0, 8)}
                              </p>

                              <div className="grid grid-cols-2 gap-2 mt-4">
                                <button
                                  onClick={() => verPedido(pedido)}
                                  className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs hover:bg-gray-800"
                                >
                                  Ver
                                </button>

                                {!bloqueado && !jaTemCobranca(pedido) ? (
                                  <button
                                    onClick={() => gerarCobranca(pedido)}
                                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-green-700"
                                  >
                                    Cobrar
                                  </button>
                                ) : (
                                  <div className={`px-3 py-2 rounded-lg text-xs font-semibold text-center ${
                                    bloqueado
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-green-50 text-green-700'
                                  }`}>
                                    {bloqueado ? 'Cancelado' : 'Cobrança OK'}
                                  </div>
                                )}
                              </div>

                              {!bloqueado && etapaAtual !== 'Entregue' && (
                                <button
                                  onClick={() => cancelarPedido(pedido)}
                                  className="w-full bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 mt-3"
                                >
                                  Cancelar Pedido
                                </button>
                              )}

                              <div className="flex justify-between gap-2 mt-3">
                                <button
                                  onClick={() => voltarPedido(pedido)}
                                  disabled={indiceAtual === 0 || bloqueado}
                                  className={`flex-1 px-3 py-2 rounded-lg text-xs ${
                                    indiceAtual === 0 || bloqueado
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-gray-800 text-white hover:bg-gray-900'
                                  }`}
                                >
                                  ←
                                </button>

                                <button
                                  onClick={() => avancarPedido(pedido)}
                                  disabled={
                                    bloqueado ||
                                    etapaAtual === 'Entregue' ||
                                    indiceAtual === etapasProducao.length - 1
                                  }
                                  className={`flex-1 px-3 py-2 rounded-lg text-xs ${
                                    bloqueado ||
                                    etapaAtual === 'Entregue' ||
                                    indiceAtual === etapasProducao.length - 1
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-gray-800 text-white hover:bg-gray-900'
                                  }`}
                                >
                                  →
                                </button>
                              </div>

                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

          </div>
        </div>

<ListaPedidosModal
  open={openListaPedidos}
  onClose={() => setOpenListaPedidos(false)}
  pedidos={pedidosFiltrados}
  formatarMoeda={formatarMoeda}
  calcularTotalPedido={calcularTotalPedido}
  etapaPedido={etapaPedido}
  statusPagamento={statusPagamento}
/>

        <PedidoDetalhesModal
          open={openDetalhes}
          onClose={() => {
            setOpenDetalhes(false)
            setPedidoSelecionado(null)
          }}
          pedido={pedidoSelecionado}
        />

      </main>
    </div>
  )
}