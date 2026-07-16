import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { supabase } from '../lib/supabase'
import GraficoEvolucaoFinanceira from '../components/dashboard/GraficoEvolucaoFinanceira'
import GraficoDespesasCategoria from '../components/dashboard/GraficoDespesasCategoria'
import GraficoProdutosVendidos from '../components/dashboard/GraficoProdutosVendidos'
import GraficoProdutosRentaveis from '../components/dashboard/GraficoProdutosRentaveis'

export default function Home() {
  const [aniversariantes, setAniversariantes] = useState([])
  const [faturadoMes, setFaturadoMes] = useState(0)
  const [saidasMes, setSaidasMes] = useState(0)
  const [recebimentosPendentes, setRecebimentosPendentes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [estoque, setEstoque] = useState([])
  const [configuracao, setConfiguracao] = useState(null)
  const [movimentacoesDashboard, setMovimentacoesDashboard] = useState([])

  useEffect(() => {
    carregarDashboard()
  }, [])

  async function carregarDashboard() {
  await carregarConfiguracao()
  await carregarFinanceiroMes()
  await carregarMovimentacoesDashboard()
  await carregarRecebimentosPendentes()
  await carregarPedidos()
  await carregarEstoque()
  await carregarAniversariantes()
}

  async function carregarConfiguracao() {
    const { data, error } = await supabase
      .from('configuracoes_precificacao')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.log('Erro ao carregar configuração:', error)
      return
    }

    setConfiguracao(data)
  }

  async function carregarFinanceiroMes() {
  const hoje = new Date()

  const primeiroDia = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1
  )

  const proximoMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    1
  )

  function formatarDataBanco(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')

    return `${ano}-${mes}-${dia}`
  }

  const { data, error } = await supabase
    .from('movimentacoes_financeiras')
    .select(`
      tipo,
      valor,
      data_movimento
    `)
    .gte(
      'data_movimento',
      formatarDataBanco(primeiroDia)
    )
    .lt(
      'data_movimento',
      formatarDataBanco(proximoMes)
    )

  if (error) {
    console.log(
      'Erro ao carregar movimentações do mês:',
      error
    )
    return
  }

  const entradas = (data || [])
    .filter(item => item.tipo === 'Entrada')
    .reduce(
      (total, item) =>
        total + Number(item.valor || 0),
      0
    )

  const saidas = (data || [])
    .filter(item => item.tipo === 'Saída')
    .reduce(
      (total, item) =>
        total + Number(item.valor || 0),
      0
    )

  setFaturadoMes(entradas)
  setSaidasMes(saidas)
}

async function carregarMovimentacoesDashboard() {
  const { data, error } = await supabase
    .from('movimentacoes_financeiras')
    .select(`
      tipo,
      categoria,
      valor,
      data_movimento
    `)
    .order('data_movimento', { ascending: true })

  if (error) {
    console.log(
      'Erro ao carregar movimentações do Dashboard:',
      error
    )
    return
  }

  setMovimentacoesDashboard(data || [])
}

  async function carregarRecebimentosPendentes() {
    const { data, error } = await supabase
      .from('financeiro')
      .select(`
        *,
        clientes (
          nome
        )
      `)
      .eq('status', 'Pendente')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar recebimentos pendentes:', error)
      return
    }

    setRecebimentosPendentes(data || [])
  }

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
      orcamentos (
        id,
        orcamento_itens (
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
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.log(
      'Erro ao carregar pedidos do Dashboard:',
      error
    )
    return
  }

  setPedidos(data || [])
}

  async function carregarEstoque() {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar estoque:', error)
      return
    }

    setEstoque(data || [])
  }

  async function carregarAniversariantes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')

    if (error) {
      console.log('Erro ao carregar aniversariantes:', error)
      return
    }

    const mesAtual = new Date().getMonth() + 1

    const filtrados = (data || []).filter(cliente => {
      if (!cliente.aniversario) return false
      const mesAniversario = Number(cliente.aniversario.split('-')[1])
      return mesAniversario === mesAtual
    })

    setAniversariantes(filtrados)
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      maximumFractionDigits: 2
    })
  }

  function formatarData(data) {
    if (!data) return '-'
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}`
  }

  function gerarLinkWhatsApp(cliente) {
    if (!cliente.whatsapp) return '#'
    const telefone = cliente.whatsapp.replace(/\D/g, '')
    return `https://wa.me/55${telefone}`
  }

  function custosFixosTotais() {
    if (!configuracao) return 0

    return (
      Number(configuracao.energia || 0) +
      Number(configuracao.internet || 0) +
      Number(configuracao.canva || 0) +
      Number(configuracao.dominio || 0) +
      Number(configuracao.outros_custos || 0)
    )
  }

  function proLabore() {
    return Number(configuracao?.pro_labore_desejado || 0)
  }

  function metaMinima() {
    return proLabore() + custosFixosTotais()
  }

  function reservaCrescimento() {
    return metaMinima() * (Number(configuracao?.percentual_crescimento || 0) / 100)
  }

  function metaCrescimento() {
    return metaMinima() + reservaCrescimento()
  }

  function progressoMeta() {
    const meta = metaCrescimento()
    if (meta <= 0) return 0

    const percentual = (faturadoMes / meta) * 100
    return percentual > 100 ? 100 : percentual
  }

  function faltaParaMeta() {
    const falta = metaCrescimento() - faturadoMes
    return falta > 0 ? falta : 0
  }

  function corBarraMeta() {
    const progresso = progressoMeta()

    if (progresso >= 100) return 'bg-green-600'
    if (progresso >= 70) return 'bg-yellow-500'
    return 'bg-gray-900'
  }

  function saldoMes() {
    return faturadoMes - saidasMes
  }

  function etapaPedido(pedido) {
    return pedido.etapa_producao || 'Aguardando Pagamento'
  }

  function financeiroCancelado(pedido) {
    if (!pedido.financeiro) return false

    if (Array.isArray(pedido.financeiro)) {
      return pedido.financeiro.some(item => item.status === 'Cancelado')
    }

    return pedido.financeiro.status === 'Cancelado'
  }

  function pedidoCancelado(pedido) {
    if (pedido.status === 'Cancelado') return true
    if (pedido.etapa_producao === 'Cancelado') return true
    if (financeiroCancelado(pedido)) return true

    return false
  }

  function pedidosEmAndamento() {
    return pedidos.filter(pedido => {
      const etapa = etapaPedido(pedido)

      return (
        etapa !== 'Entregue' &&
        !pedidoCancelado(pedido)
      )
    }).length
  }

  function pedidosPorEtapa(etapa) {
    return pedidos.filter(pedido => {
      return (
        etapaPedido(pedido) === etapa &&
        !pedidoCancelado(pedido)
      )
    }).length
  }

  function quantidadeLivre(item) {
    return (
      Number(item.quantidade_disponivel || 0) -
      Number(item.quantidade_reservada || 0)
    )
  }

  function statusEstoque(item) {
    const livre = quantidadeLivre(item)
    const minimo = Number(item.estoque_minimo || 0)

    if (livre <= 0) return 'Esgotado'
    if (livre <= minimo) return 'Baixo'
    return 'OK'
  }

  function estoqueBaixo() {
    return estoque.filter(item => statusEstoque(item) !== 'OK')
  }

  function mesAtual() {
    return new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    })
  }

  function ticketMedio() {
  const entregues = pedidos.filter(
    pedido =>
      pedido.etapa_producao === 'Entregue' &&
      !pedidoCancelado(pedido)
  )

  if (entregues.length === 0) {
    return 0
  }

  const totalEntregue = entregues.reduce(
    (total, pedido) =>
      total + Number(pedido.valor || 0),
    0
  )

  return totalEntregue / entregues.length
}

function totalClientesAtendidos() {
  const clientesAtendidos = new Set()

  pedidos.forEach(pedido => {
    const entregue =
      pedido.etapa_producao === 'Entregue'

    const cancelado =
      pedidoCancelado(pedido)

    if (
      entregue &&
      !cancelado &&
      pedido.cliente_id
    ) {
      clientesAtendidos.add(
        pedido.cliente_id
      )
    }
  })

  return clientesAtendidos.size
}

function produtosMaisVendidos() {
  const produtos = {}

  pedidos.forEach(pedido => {
    if (pedidoCancelado(pedido)) return

    const itens =
      pedido.orcamentos?.orcamento_itens || []

    itens.forEach(item => {
      const nome =
        item.nome_item ||
        item.produtos?.nome ||
        'Produto'

      produtos[nome] =
        Number(produtos[nome] || 0) +
        Number(item.quantidade || 0)
    })
  })

  return Object.entries(produtos)
    .map(([nome, quantidade]) => ({
      nome,
      quantidade
    }))
    .sort(
      (a, b) =>
        b.quantidade - a.quantidade
    )
    .slice(0, 5)
}

function produtosMaiorFaturamento() {
  const mapa = {}

  pedidos.forEach(pedido => {
    if (pedidoCancelado(pedido)) return

    const itens =
      pedido.orcamentos?.orcamento_itens || []

    itens.forEach(item => {
      const nome =
        item.nome_item ||
        item.produtos?.nome ||
        'Produto'

      mapa[nome] =
        Number(mapa[nome] || 0) +
        Number(item.subtotal || 0)
    })
  })

  return Object.entries(mapa)
    .map(([nome, total]) => ({
      nome,
      total
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
}

function pedidosEntregues() {
  return pedidos.filter(
    p =>
      p.etapa_producao === 'Entregue'
  ).length
}

function dadosEvolucaoFinanceira() {
  const meses = {}

  movimentacoesDashboard.forEach(item => {
    if (!item.data_movimento) return

    const data = new Date(
      `${item.data_movimento}T00:00:00`
    )

    const chave = `${data.getFullYear()}-${String(
      data.getMonth() + 1
    ).padStart(2, '0')}`

    if (!meses[chave]) {
      meses[chave] = {
        chave,
        mes: data.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit'
        }),
        receitas: 0,
        despesas: 0
      }
    }

    if (item.tipo === 'Entrada') {
      meses[chave].receitas += Number(item.valor || 0)
    }

    if (item.tipo === 'Saída') {
      meses[chave].despesas += Number(item.valor || 0)
    }
  })

  return Object.values(meses)
    .sort((a, b) =>
      a.chave.localeCompare(b.chave)
    )
    .slice(-6)
}

function dadosDespesasCategoria() {
  const categorias = {}

  movimentacoesDashboard
    .filter(item => item.tipo === 'Saída')
    .forEach(item => {
      const categoria =
        item.categoria || 'Outros'

      categorias[categoria] =
        Number(categorias[categoria] || 0) +
        Number(item.valor || 0)
    })

  return Object.entries(categorias)
    .map(([categoria, valor]) => ({
      categoria,
      valor
    }))
    .sort((a, b) => b.valor - a.valor)
}

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h1>

          <p className="text-gray-500">
            Visão geral da operação, financeiro, metas e alertas da Eternaê.
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Referência: {mesAtual()}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
  <h2 className="text-2xl font-bold text-gray-800">
    Bom dia, Renata ☀️
  </h2>

  <p className="text-gray-500 mt-2 leading-relaxed">
    A Eternaê está em movimento. Hoje você possui{' '}
    <strong>
      {pedidosPorEtapa('Produção')} pedido(s) em produção
    </strong>
    ,{' '}
    <strong>
      {pedidosPorEtapa('Aguardando Pagamento')} aguardando pagamento
    </strong>{' '}
    e atingiu{' '}
    <strong>
      {formatarNumero(progressoMeta())}% da meta
    </strong>{' '}
    de {mesAtual()}.
  </p>
</div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

  {/* COLUNA 1 — OPERAÇÃO */}
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-gray-800">
        📦 Operação
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Situação atual dos pedidos.
      </p>
    </div>

    <div className="space-y-3">
      <div className="bg-yellow-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Aguardando pagamento
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Pedidos ainda não recebidos
          </p>
        </div>

        <p className="text-2xl font-bold text-yellow-700">
          {pedidosPorEtapa('Aguardando Pagamento')}
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Arte e aprovação
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Criação e validação do cliente
          </p>
        </div>

        <p className="text-2xl font-bold text-blue-700">
          {pedidosPorEtapa('Arte') +
            pedidosPorEtapa('Aguardando Aprovação')}
        </p>
      </div>

      <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Em produção
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Pedidos sendo produzidos
          </p>
        </div>

        <p className="text-2xl font-bold text-purple-700">
          {pedidosPorEtapa('Produção')}
        </p>
      </div>

      <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Prontos para entrega
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Aguardando entrega
          </p>
        </div>

        <p className="text-2xl font-bold text-green-700">
          {pedidosPorEtapa('Pronto')}
        </p>
      </div>

      <div className="border rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          Total de pedidos ativos
        </p>

        <p className="text-xl font-bold text-gray-900">
          {pedidosEmAndamento()}
        </p>
      </div>
    </div>
  </div>

  {/* COLUNA 2 — FINANCEIRO */}
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-gray-800">
        💰 Financeiro
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Resultado financeiro de {mesAtual()}.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-green-50 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          Receitas
        </p>

        <p className="text-lg font-bold text-green-700 mt-2">
          {formatarMoeda(faturadoMes)}
        </p>
      </div>

      <div className="bg-red-50 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          Despesas
        </p>

        <p className="text-lg font-bold text-red-600 mt-2">
          {formatarMoeda(saidasMes)}
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          Resultado
        </p>

        <p
          className={`text-lg font-bold mt-2 ${
            saldoMes() >= 0
              ? 'text-blue-700'
              : 'text-red-600'
          }`}
        >
          {formatarMoeda(saldoMes())}
        </p>
      </div>

      <div className="bg-yellow-50 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          A receber
        </p>

        <p className="text-lg font-bold text-yellow-700 mt-2">
          {formatarMoeda(
            recebimentosPendentes.reduce(
              (total, item) =>
                total + Number(item.valor || 0),
              0
            )
          )}
        </p>
      </div>
    </div>

    <div className="mt-5 border-t pt-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Meta do mês
          </p>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatarNumero(progressoMeta())}%
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">
            Meta definida
          </p>

          <p className="font-bold text-blue-700">
            {formatarMoeda(metaCrescimento())}
          </p>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mt-4">
        <div
          className={`${corBarraMeta()} h-4 rounded-full transition-all`}
          style={{
            width: `${progressoMeta()}%`
          }}
        />
      </div>

      <p className="text-sm text-gray-500 mt-3">
        Faltam{' '}
        <strong>
          {formatarMoeda(faltaParaMeta())}
        </strong>{' '}
        para atingir a meta.
      </p>
    </div>
  </div>

  {/* COLUNA 3 — INTELIGÊNCIA E ALERTAS */}
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-gray-800">
        💡 Inteligência e alertas
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Pontos que precisam da sua atenção.
      </p>
    </div>

    <div className="space-y-3">
      
      <div className="border rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-800">
            ⚠️ Estoque em atenção
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Itens baixos ou esgotados
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            estoqueBaixo().length > 0
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {estoqueBaixo().length}
        </span>
      </div>

      <div className="border rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-800">
            🎂 Aniversariantes
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Clientes aniversariantes do mês
          </p>
        </div>

        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-bold">
          {aniversariantes.length}
        </span>
      </div>

      <div className="bg-gray-900 text-white rounded-xl p-5 mt-4">
  <p className="text-sm text-gray-300">
    💡 Visão rápida
  </p>

  <div className="mt-3 space-y-2 text-sm leading-relaxed">
    <p>
      • {pedidosPorEtapa('Produção')} pedido(s) em produção.
    </p>

    <p>
      • {pedidosPorEtapa('Aguardando Pagamento') === 0
    ? 'Nenhum pedido aguardando pagamento.'
    : `${pedidosPorEtapa('Aguardando Pagamento')} pedido(s) aguardando pagamento.`}
    </p>

    <p>
      • {estoqueBaixo().length === 0
        ? 'Estoque sem alertas críticos.'
        : `${estoqueBaixo().length} item(ns) precisam de atenção.`}
    </p>

    <p>
      • Meta mensal em {formatarNumero(progressoMeta())}%.
    </p>
  </div>
</div>
    </div>
  </div>

</div>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      Ticket médio
    </p>

    <p className="text-3xl font-bold text-gray-800 mt-3">
      {formatarMoeda(ticketMedio())}
    </p>
  </div>

  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      Clientes atendidos
    </p>

    <p className="text-3xl font-bold text-gray-800 mt-3">
      {totalClientesAtendidos()}
    </p>
  </div>

  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      Pedidos entregues
    </p>

    <p className="text-3xl font-bold text-gray-800 mt-3">
      {pedidosEntregues()}
    </p>
  </div>

  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-sm text-gray-500">
      Momentos eternizados 💛
    </p>

    <p className="text-3xl font-bold text-gray-800 mt-3">
      {pedidosEntregues()}
    </p>

    <p className="text-xs text-gray-400 mt-2">
      Histórias entregues aos clientes.
    </p>
  </div>

</div>

{/* PRIMEIRA LINHA */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

  <GraficoEvolucaoFinanceira
    dados={dadosEvolucaoFinanceira()}
  />

  <GraficoDespesasCategoria
    dados={dadosDespesasCategoria()}
  />

</div>

{/* SEGUNDA LINHA */}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

  <GraficoProdutosVendidos
    dados={produtosMaisVendidos()}
  />

  <GraficoProdutosRentaveis
    dados={produtosMaiorFaturamento()}
  />

</div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  💵 Recebimentos pendentes
                </h2>

                <p className="text-gray-500 text-sm">
                  Cobranças ainda não recebidas.
                </p>
              </div>

              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                {recebimentosPendentes.length}
              </span>
            </div>

          {recebimentosPendentes.length === 0 ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
  <p className="font-semibold text-green-800">
    🎉 Tudo recebido!
  </p>

  <p className="text-sm text-green-700 mt-1">
    Nenhuma cobrança está pendente neste momento.
  </p>
</div>
            ) : (
              <div className="space-y-3">
                {recebimentosPendentes.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4"
                  >
                    <p className="font-semibold text-gray-800">
                      {item.clientes?.nome || 'Cliente'}
                    </p>

                    <p className="text-sm text-gray-500">
                      {formatarMoeda(item.valor)}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  ⚠️ Estoque em atenção
                </h2>

                <p className="text-gray-500 text-sm">
                  Itens baixos ou esgotados.
                </p>
              </div>

              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                {estoqueBaixo().length}
              </span>
            </div>

            {estoqueBaixo().length === 0 ? (
              <p className="text-gray-500">
                Nenhum item em atenção.
              </p>
            ) : (
              <div className="space-y-3">
                {estoqueBaixo().slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4"
                  >
                    <p className="font-semibold text-gray-800">
                      {item.nome}
                    </p>

                    <p className="text-sm text-gray-500">
                      Livre: {formatarNumero(quantidadeLivre(item))} • Mínimo: {formatarNumero(item.estoque_minimo)}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  🎂 Aniversariantes
                </h2>

                <p className="text-gray-500 text-sm">
                  Clientes do mês.
                </p>
              </div>

              <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                {aniversariantes.length}
              </span>
            </div>

            {aniversariantes.length === 0 ? (
              <p className="text-gray-500">
                Nenhum aniversariante neste mês.
              </p>
            ) : (
              <div className="space-y-3">
                {aniversariantes.slice(0, 5).map(cliente => (
                  <div
                    key={cliente.id}
                    className="border rounded-xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {cliente.nome}
                      </p>

                      <p className="text-sm text-gray-500">
                        {formatarData(cliente.aniversario)}
                      </p>
                    </div>

                    {cliente.whatsapp && (
                      <a
                        href={gerarLinkWhatsApp(cliente)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-green-700 transition"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  )
}