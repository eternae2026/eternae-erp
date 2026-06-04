import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Metas() {
  const [configuracao, setConfiguracao] = useState(null)
  const [faturadoMes, setFaturadoMes] = useState(0)
  const [produtos, setProdutos] = useState([])

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

  function metaIdeal() {
    const margem = Number(configuracao?.margem_padrao || 0)

    return metaCrescimento() * (1 + margem / 100)
  }

  function progresso(meta) {
    if (meta <= 0) return 0

    const percentual = (faturadoMes / meta) * 100

    return percentual > 100 ? 100 : percentual
  }

  function faltaPara(meta) {
    const falta = meta - faturadoMes

    return falta > 0 ? falta : 0
  }

  function corProgresso(meta) {
    const percentual = progresso(meta)

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

  function lucroProduto(produto) {
    const preco = Number(produto.preco || produto.preco_final || 0)
    const margem = Number(produto.margem_lucro || configuracao?.margem_padrao || 0) / 100

    return preco * margem
  }

  function unidadesNecessarias(produto) {
    const lucro = lucroProduto(produto)

    if (lucro <= 0) return 0

    return Math.ceil(faltaPara(metaCrescimento()) / lucro)
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
            Acompanhe quanto já entrou no mês e quanto falta para atingir seus objetivos.
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Referência: {mesAtual()}
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
              Meta ideal
            </p>

            <h2 className="text-2xl font-bold text-green-700 mt-2">
              {formatarMoeda(metaIdeal())}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Crescimento + margem estratégica
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

        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">
              🎯 Meta mínima
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              Falta: {formatarMoeda(faltaPara(metaMinima()))}
            </p>

            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className={`${corProgresso(metaMinima())} h-4 rounded-full`}
                style={{ width: `${progresso(metaMinima())}%` }}
              />
            </div>

            <p className="text-sm font-semibold text-gray-700 mt-3">
              {formatarNumero(progresso(metaMinima()))}% atingido
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">
              🚀 Meta crescimento
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              Falta: {formatarMoeda(faltaPara(metaCrescimento()))}
            </p>

            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className={`${corProgresso(metaCrescimento())} h-4 rounded-full`}
                style={{ width: `${progresso(metaCrescimento())}%` }}
              />
            </div>

            <p className="text-sm font-semibold text-gray-700 mt-3">
              {formatarNumero(progresso(metaCrescimento()))}% atingido
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">
              🏆 Meta ideal
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              Falta: {formatarMoeda(faltaPara(metaIdeal()))}
            </p>

            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className={`${corProgresso(metaIdeal())} h-4 rounded-full`}
                style={{ width: `${progresso(metaIdeal())}%` }}
              />
            </div>

            <p className="text-sm font-semibold text-gray-700 mt-3">
              {formatarNumero(progresso(metaIdeal()))}% atingido
            </p>
          </div>

        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            🎯 Simulador para Meta Crescimento
          </h2>

          <p className="text-gray-500 mb-6">
            Faltam {formatarMoeda(faltaPara(metaCrescimento()))} para atingir a meta de crescimento.
          </p>

          {produtos.length === 0 ? (
            <p className="text-gray-500">
              Nenhum produto precificado encontrado para simulação.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-6">

              {produtos.map(produto => (
                <div
                  key={produto.id}
                  className="border rounded-2xl p-5"
                >
                  <h3 className="font-bold text-gray-800 mb-4">
                    {produto.nome}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Preço atual
                  </p>

                  <p className="text-lg font-bold text-gray-800 mb-4">
                    {formatarMoeda(produto.preco || produto.preco_final)}
                  </p>

                  <p className="text-sm text-gray-500">
                    Lucro estimado por venda
                  </p>

                  <p className="text-lg font-bold text-green-700 mb-4">
                    {formatarMoeda(lucroProduto(produto))}
                  </p>

                  <p className="text-sm text-gray-500">
                    Necessário vender
                  </p>

                  <p className="text-3xl font-bold text-blue-700">
                    {unidadesNecessarias(produto)}
                  </p>

                  <p className="text-sm text-gray-500">
                    unidades
                  </p>

                </div>
              ))}

            </div>
          )}

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

      </main>
    </div>
  )
}