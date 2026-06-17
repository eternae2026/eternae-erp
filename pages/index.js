import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [aniversariantes, setAniversariantes] = useState([])
  const [faturadoMes, setFaturadoMes] = useState(0)
  const [saidasMes, setSaidasMes] = useState(0)
  const [recebimentosPendentes, setRecebimentosPendentes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [estoque, setEstoque] = useState([])
  const [configuracao, setConfiguracao] = useState(null)

  useEffect(() => {
    carregarDashboard()
  }, [])

  async function carregarDashboard() {
    await carregarConfiguracao()
    await carregarFinanceiroMes()
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
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)

    const { data: entradas, error: erroEntradas } = await supabase
      .from('financeiro')
      .select('valor, status, data_pagamento')
      .eq('status', 'Recebido')
      .gte('data_pagamento', primeiroDia.toISOString().split('T')[0])
      .lt('data_pagamento', proximoMes.toISOString().split('T')[0])

    if (erroEntradas) {
      console.log('Erro ao carregar faturamento:', erroEntradas)
      return
    }

    const totalEntradas = (entradas || []).reduce((total, item) => {
      return total + Number(item.valor || 0)
    }, 0)

    setFaturadoMes(totalEntradas)

    const { data: saidas, error: erroSaidas } = await supabase
      .from('financeiro_saidas')
      .select('valor, data_saida')
      .gte('data_saida', primeiroDia.toISOString().split('T')[0])
      .lt('data_saida', proximoMes.toISOString().split('T')[0])

    if (erroSaidas) {
      console.log('Erro ao carregar saídas:', erroSaidas)
      return
    }

    const totalSaidas = (saidas || []).reduce((total, item) => {
      return total + Number(item.valor || 0)
    }, 0)

    setSaidasMes(totalSaidas)
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
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar pedidos:', error)
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

        <div className="grid grid-cols-5 gap-6 mb-8">

          <StatCard
            title="Faturamento do mês"
            value={formatarMoeda(faturadoMes)}
          />

          <StatCard
            title="Saldo do mês"
            value={formatarMoeda(saldoMes())}
          />

          <StatCard
            title="Pedidos ativos"
            value={pedidosEmAndamento()}
          />

          <StatCard
            title="A receber"
            value={formatarMoeda(
              recebimentosPendentes.reduce((total, item) => {
                return total + Number(item.valor || 0)
              }, 0)
            )}
          />

          <StatCard
            title="Meta atingida"
            value={`${formatarNumero(progressoMeta())}%`}
          />

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-8 shadow-sm">

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  🎯 Meta do mês
                </h2>

                <p className="text-gray-500">
                  Acompanhe o avanço da meta de crescimento.
                </p>
              </div>

              <div className="text-right">
                <p className="text-gray-500 text-sm">
                  Meta
                </p>

                <p className="text-xl font-bold text-blue-700">
                  {formatarMoeda(metaCrescimento())}
                </p>
              </div>
            </div>

            <h3 className="text-3xl font-bold text-gray-800 mb-2">
              {formatarNumero(progressoMeta())}% atingido
            </h3>

            <p className="text-gray-500 mb-5">
              Faltam <strong>{formatarMoeda(faltaParaMeta())}</strong> para atingir a meta.
            </p>

            <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className={`${corBarraMeta()} h-5 rounded-full`}
                style={{ width: `${progressoMeta()}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Faturado</p>
                <p className="font-bold text-gray-800">{formatarMoeda(faturadoMes)}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Saídas</p>
                <p className="font-bold text-red-600">{formatarMoeda(saidasMes)}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Saldo</p>
                <p className={`font-bold ${saldoMes() >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {formatarMoeda(saldoMes())}
                </p>
              </div>
            </div>

          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">

            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📦 Operação dos pedidos
            </h2>

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Aguardando pagamento</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {pedidosPorEtapa('Aguardando Pagamento')}
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Arte</p>
                <p className="text-2xl font-bold text-blue-700">
                  {pedidosPorEtapa('Arte')}
                </p>
              </div>

              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Aguardando aprovação</p>
                <p className="text-2xl font-bold text-orange-700">
                  {pedidosPorEtapa('Aguardando Aprovação')}
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Produção</p>
                <p className="text-2xl font-bold text-purple-700">
                  {pedidosPorEtapa('Produção')}
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Pronto</p>
                <p className="text-2xl font-bold text-green-700">
                  {pedidosPorEtapa('Pronto')}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Entregue</p>
                <p className="text-2xl font-bold text-gray-800">
                  {pedidosPorEtapa('Entregue')}
                </p>
              </div>

            </div>

          </div>

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
              <p className="text-gray-500">
                Nenhum recebimento pendente.
              </p>
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