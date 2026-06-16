import SimuladorMetaModal from '../../components/SimuladorMetaModal'
import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Metas() {
  const [configuracao, setConfiguracao] = useState(null)
  const [faturadoMes, setFaturadoMes] = useState(0)
  const [produtos, setProdutos] = useState([])
  const [openSimulador, setOpenSimulador] = useState(false)

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

  async function carregarFaturamentoMes() {
    const hoje = new Date()
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)

    const { data, error } = await supabase
      .from('financeiro')
      .select('valor, status, data_pagamento')
      .eq('status', 'Recebido')
      .gte('data_pagamento', primeiroDia.toISOString().split('T')[0])
      .lt('data_pagamento', proximoMes.toISOString().split('T')[0])

    if (error) {
      console.log('Erro ao carregar faturamento do mês:', error)
      return
    }

    const total = (data || []).reduce((soma, item) => {
      return soma + Number(item.valor || 0)
    }, 0)

    setFaturadoMes(total)
  }

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .gt('preco', 0)
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar produtos:', error)
      return
    }

    setProdutos(data || [])
  }

  useEffect(() => {
    carregarConfiguracao()
    carregarFaturamentoMes()
    carregarProdutos()
  }, [])

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

  function metaMinima() {
    if (!configuracao) return 0

    return (
      Number(configuracao.pro_labore_desejado || 0) +
      custosFixosTotais()
    )
  }

  function reservaCrescimento() {
    const percentual = Number(configuracao?.percentual_crescimento || 0)

    return metaMinima() * (percentual / 100)
  }

  function metaCrescimento() {
    return metaMinima() + reservaCrescimento()
  }

  function progressoMetaCrescimento() {
    const meta = metaCrescimento()

    if (meta <= 0) return 0

    const percentual = (faturadoMes / meta) * 100

    return percentual > 100 ? 100 : percentual
  }

  function faltaParaMetaCrescimento() {
    const falta = metaCrescimento() - faturadoMes

    return falta > 0 ? falta : 0
  }

  function corBarraMeta() {
    const percentual = progressoMetaCrescimento()

    if (percentual >= 100) return 'bg-green-600'
    if (percentual >= 70) return 'bg-yellow-500'
    return 'bg-gray-900'
  }

  function mesAtual() {
    return new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    })
  }

  function diasDoMes() {
    const hoje = new Date()

    return new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0
    ).getDate()
  }

  function diaAtual() {
    return new Date().getDate()
  }

  function diasRestantes() {
    return diasDoMes() - diaAtual()
  }

  function projecaoMes() {
    if (diaAtual() <= 0) return 0

    return (faturadoMes / diaAtual()) * diasDoMes()
  }

  function lucroProduto(produto) {
    const preco = Number(produto.preco || produto.preco_final || 0)
    const margem = Number(produto.margem_lucro || configuracao?.margem_padrao || 0) / 100

    return preco * margem
  }

  function unidadesNecessarias(produto) {
    const lucro = lucroProduto(produto)

    if (lucro <= 0) return 0

    return Math.ceil(faltaParaMetaCrescimento() / lucro)
  }

  function produtosSimulacao() {
  return produtos
    .map(produto => ({
      ...produto,
      lucro: lucroProduto(produto),
      unidades: unidadesNecessarias(produto)
    }))
    .sort((a, b) => a.unidades - b.unidades)
}

  if (!configuracao) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          <p className="text-gray-500">
            Carregando metas...
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Metas de Venda
          </h1>

          <p className="text-gray-500">
            Acompanhe o avanço do mês, projeção de fechamento e metas da Eternaê.
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Referência: {mesAtual()} • Restam {diasRestantes()} dia(s) no mês
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Meta mínima
            </p>

            <h2 className="text-2xl font-bold text-yellow-700 mt-2">
              {formatarMoeda(metaMinima())}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Custos fixos + pró-labore
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Meta crescimento
            </p>

            <h2 className="text-2xl font-bold text-blue-700 mt-2">
              {formatarMoeda(metaCrescimento())}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Reserva de {configuracao.percentual_crescimento || 0}%
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Faturado no mês
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {formatarMoeda(faturadoMes)}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Apenas pagamentos recebidos
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Projeção do mês
            </p>

            <h2 className={`text-2xl font-bold mt-2 ${
              projecaoMes() >= metaCrescimento()
                ? 'text-green-700'
                : 'text-red-600'
            }`}>
              {formatarMoeda(projecaoMes())}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Com base no ritmo atual
            </p>
          </div>

        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">

          <div className="flex items-start justify-between gap-6 mb-6">

            <div>
              <p className="text-gray-500">
                Meta do mês
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-1">
                {formatarNumero(progressoMetaCrescimento())}% atingido
              </h2>

              <p className="text-gray-500 mt-2">
                Faltam <strong>{formatarMoeda(faltaParaMetaCrescimento())}</strong> para atingir a meta de crescimento.
              </p>
            </div>

            <div className="text-right">
              <p className="text-gray-500">
                Meta crescimento
              </p>

              <h3 className="text-2xl font-bold text-blue-700">
                {formatarMoeda(metaCrescimento())}
              </h3>
            </div>

          </div>

          <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className={`${corBarraMeta()} h-5 rounded-full`}
              style={{ width: `${progressoMetaCrescimento()}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Faturado
              </p>

              <p className="font-bold text-gray-800">
                {formatarMoeda(faturadoMes)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Falta para meta
              </p>

              <p className="font-bold text-red-600">
                {formatarMoeda(faltaParaMetaCrescimento())}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Projeção
              </p>

              <p className={`font-bold ${
                projecaoMes() >= metaCrescimento()
                  ? 'text-green-700'
                  : 'text-red-600'
              }`}>
                {formatarMoeda(projecaoMes())}
              </p>
            </div>

          </div>

        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">

  <div className="flex items-center justify-between">

    <div>
      <h2 className="text-xl font-bold text-gray-800">
        📈 Simulador de Meta
      </h2>

      <p className="text-gray-500 mt-1">
        Descubra quais produtos exigem menos vendas para atingir sua meta.
      </p>
    </div>

    <button
      onClick={() => setOpenSimulador(true)}
      className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
    >
      Abrir Simulador
    </button>

  </div>

</div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Leitura financeira do mês
          </h2>

          <div className="grid grid-cols-3 gap-4">

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Custos fixos
              </p>

              <p className="font-semibold text-gray-800">
                {formatarMoeda(custosFixosTotais())}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Pró-labore desejado
              </p>

              <p className="font-semibold text-gray-800">
                {formatarMoeda(configuracao.pro_labore_desejado)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Reserva de crescimento
              </p>

              <p className="font-semibold text-gray-800">
                {formatarMoeda(reservaCrescimento())}
              </p>
            </div>

          </div>

        </div>

<SimuladorMetaModal
  open={openSimulador}
  onClose={() => setOpenSimulador(false)}
  produtos={produtosSimulacao()}
/>

      </main>
    </div>
  )
}