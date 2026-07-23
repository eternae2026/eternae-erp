import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'
import GraficoFinanceiro from '../../components/dashboard/GraficoFinanceiro'
import GraficoEvolucaoFinanceira from '../../components/dashboard/GraficoEvolucaoFinanceira'
import GraficoDespesasCategoria from '../../components/dashboard/GraficoDespesasCategoria'

export default function DashboardFinanceiro() {
  const [movimentacoes, setMovimentacoes] =
    useState([])

  const [contasReceber, setContasReceber] =
    useState([])

  const [contasPagar, setContasPagar] =
    useState([])

  const [configuracao, setConfiguracao] =
    useState(null)

  const [carregando, setCarregando] =
    useState(true)

  useEffect(() => {
    carregarDashboardFinanceiro()
  }, [])

  async function carregarDashboardFinanceiro() {
    setCarregando(true)

    try {
      await Promise.all([
        carregarMovimentacoes(),
        carregarContasReceber(),
        carregarContasPagar(),
        carregarConfiguracao()
      ])
    } finally {
      setCarregando(false)
    }
  }

  async function carregarMovimentacoes() {
    const { data, error } = await supabase
      .from('movimentacoes_financeiras')
      .select(`
        id,
        tipo,
        categoria,
        descricao,
        valor,
        forma_pagamento,
        data_movimento,
        pedido_id,
        observacoes
      `)
      .order('data_movimento', {
        ascending: true
      })

    if (error) {
      console.log(
        'Erro ao carregar movimentações:',
        error
      )

      return
    }

    setMovimentacoes(data || [])
  }

  async function carregarContasReceber() {
    const { data, error } = await supabase
      .from('financeiro')
      .select(`
        id,
        pedido_id,
        cliente_id,
        valor,
        forma_pagamento,
        status,
        data_vencimento,
        data_pagamento,
        created_at,
        clientes (
          nome
        )
      `)
      .order('created_at', {
        ascending: false
      })

    if (error) {
      console.log(
        'Erro ao carregar contas a receber:',
        error
      )

      return
    }

    setContasReceber(data || [])
  }

  async function carregarContasPagar() {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select(`
        id,
        descricao,
        valor,
        status,
        data_vencimento,
        data_pagamento,
        fornecedor,
        observacoes,
        created_at,
        categorias_financeiras (
          nome
        )
      `)
      .order('created_at', {
        ascending: false
      })

    if (error) {
      console.log(
        'Erro ao carregar contas a pagar:',
        error
      )

      return
    }

    setContasPagar(data || [])
  }

  async function carregarConfiguracao() {
    const { data, error } = await supabase
      .from('configuracoes_precificacao')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.log(
        'Erro ao carregar configuração:',
        error
      )

      return
    }

    setConfiguracao(data || null)
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    )
  }

  function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString(
      'pt-BR',
      {
        maximumFractionDigits: 1
      }
    )
  }

  function formatarData(data) {
    if (!data) return '-'

    const dataNormalizada =
      String(data).length === 10
        ? `${data}T00:00:00`
        : data

    return new Date(
      dataNormalizada
    ).toLocaleDateString('pt-BR')
  }

  function formatarDataBanco(data) {
    const ano = data.getFullYear()

    const mes = String(
      data.getMonth() + 1
    ).padStart(2, '0')

    const dia = String(
      data.getDate()
    ).padStart(2, '0')

    return `${ano}-${mes}-${dia}`
  }

  function dataDaMovimentacao(item) {
    if (!item?.data_movimento) {
      return null
    }

    return new Date(
      `${item.data_movimento}T00:00:00`
    )
  }

  function statusNormalizado(status) {
    return String(status || '')
      .trim()
      .toLowerCase()
  }

  function inicioMesAtual() {
    const hoje = new Date()

    return new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      1
    )
  }

  function inicioProximoMes() {
    const hoje = new Date()

    return new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      1
    )
  }

  function inicioMesAnterior() {
    const hoje = new Date()

    return new Date(
      hoje.getFullYear(),
      hoje.getMonth() - 1,
      1
    )
  }

  function estaNoPeriodo(
    data,
    inicio,
    fim
  ) {
    if (!data) return false

    return data >= inicio && data < fim
  }

  const movimentacoesMesAtual = useMemo(() => {
    const inicio = inicioMesAtual()
    const fim = inicioProximoMes()

    return movimentacoes.filter(item =>
      estaNoPeriodo(
        dataDaMovimentacao(item),
        inicio,
        fim
      )
    )
  }, [movimentacoes])

  const movimentacoesMesAnterior =
    useMemo(() => {
      const inicio = inicioMesAnterior()
      const fim = inicioMesAtual()

      return movimentacoes.filter(item =>
        estaNoPeriodo(
          dataDaMovimentacao(item),
          inicio,
          fim
        )
      )
    }, [movimentacoes])

  function somarMovimentacoes(
    lista,
    tipo
  ) {
    return lista
      .filter(item => item.tipo === tipo)
      .reduce(
        (total, item) =>
          total +
          Number(item.valor || 0),
        0
      )
  }

  const receitasMes =
    somarMovimentacoes(
      movimentacoesMesAtual,
      'Entrada'
    )

  const despesasMes =
    somarMovimentacoes(
      movimentacoesMesAtual,
      'Saída'
    )

  const resultadoMes =
    receitasMes - despesasMes

  const receitasMesAnterior =
    somarMovimentacoes(
      movimentacoesMesAnterior,
      'Entrada'
    )

  const despesasMesAnterior =
    somarMovimentacoes(
      movimentacoesMesAnterior,
      'Saída'
    )

  const saldoAtual =
    somarMovimentacoes(
      movimentacoes,
      'Entrada'
    ) -
    somarMovimentacoes(
      movimentacoes,
      'Saída'
    )

  const recebimentosPendentes =
    contasReceber.filter(
      item =>
        statusNormalizado(item.status) ===
        'pendente'
    )

  const pagamentosPendentes =
    contasPagar.filter(
      item =>
        statusNormalizado(item.status) ===
        'pendente'
    )

  const totalReceber =
    recebimentosPendentes.reduce(
      (total, item) =>
        total +
        Number(item.valor || 0),
      0
    )

  const totalPagar =
    pagamentosPendentes.reduce(
      (total, item) =>
        total +
        Number(item.valor || 0),
      0
    )

  const saldoProjetado =
    saldoAtual +
    totalReceber -
    totalPagar

  function recebimentosDoMes() {
    const inicio = inicioMesAtual()
    const fim = inicioProximoMes()

    return contasReceber.filter(item => {
      if (
        statusNormalizado(
          item.status
        ) !== 'recebido'
      ) {
        return false
      }

      if (!item.data_pagamento) {
        return false
      }

      const data = new Date(
        `${item.data_pagamento}T00:00:00`
      )

      return estaNoPeriodo(
        data,
        inicio,
        fim
      )
    })
  }

  const recebidosMes =
    recebimentosDoMes()

  const pedidosPagosIds =
    new Set(
      recebidosMes
        .map(item => item.pedido_id)
        .filter(Boolean)
    )

  const quantidadePedidosPagos =
    pedidosPagosIds.size

  const ticketMedio =
    quantidadePedidosPagos > 0
      ? receitasMes /
        quantidadePedidosPagos
      : 0

  function calcularCrescimento(
    atual,
    anterior
  ) {
    if (anterior === 0) {
      return atual > 0 ? 100 : 0
    }

    return (
      ((atual - anterior) /
        anterior) *
      100
    )
  }

  const crescimentoReceita =
    calcularCrescimento(
      receitasMes,
      receitasMesAnterior
    )

  const crescimentoDespesas =
    calcularCrescimento(
      despesasMes,
      despesasMesAnterior
    )

  function custosFixosTotais() {
    if (!configuracao) return 0

    return (
      Number(
        configuracao.energia || 0
      ) +
      Number(
        configuracao.internet || 0
      ) +
      Number(
        configuracao.canva || 0
      ) +
      Number(
        configuracao.dominio || 0
      ) +
      Number(
        configuracao.outros_custos || 0
      )
    )
  }

  function metaMinima() {
    return (
      custosFixosTotais() +
      Number(
        configuracao?.pro_labore_desejado ||
          0
      )
    )
  }

  function reservaCrescimento() {
    return (
      metaMinima() *
      (Number(
        configuracao
          ?.percentual_crescimento || 0
      ) /
        100)
    )
  }

  function metaFinanceira() {
    return (
      metaMinima() +
      reservaCrescimento()
    )
  }

  function progressoMeta() {
    const meta = metaFinanceira()

    if (meta <= 0) return 0

    const percentual =
      (receitasMes / meta) * 100

    return percentual > 100
      ? 100
      : percentual
  }

  function faltaParaMeta() {
    const falta =
      metaFinanceira() - receitasMes

    return falta > 0 ? falta : 0
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

  function projecaoReceitaMes() {
    if (diaAtual() <= 0) return 0

    return (
      (receitasMes / diaAtual()) *
      diasDoMes()
    )
  }

  function contasReceberVencidas() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return recebimentosPendentes.filter(
      item => {
        if (!item.data_vencimento) {
          return false
        }

        const vencimento = new Date(
          `${item.data_vencimento}T00:00:00`
        )

        return vencimento < hoje
      }
    )
  }

  function contasPagarVencidas() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return pagamentosPendentes.filter(
      item => {
        if (!item.data_vencimento) {
          return false
        }

        const vencimento = new Date(
          `${item.data_vencimento}T00:00:00`
        )

        return vencimento < hoje
      }
    )
  }

  const receberVencidas =
    contasReceberVencidas()

  const pagarVencidas =
    contasPagarVencidas()

  function dadosEvolucaoFinanceira() {
    const meses = {}

    movimentacoes.forEach(item => {
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
          mes: data.toLocaleDateString(
            'pt-BR',
            {
              month: 'short',
              year: '2-digit'
            }
          ),
          receitas: 0,
          despesas: 0
        }
      }

      if (item.tipo === 'Entrada') {
        meses[chave].receitas +=
          Number(item.valor || 0)
      }

      if (item.tipo === 'Saída') {
        meses[chave].despesas +=
          Number(item.valor || 0)
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

    movimentacoesMesAtual
      .filter(
        item => item.tipo === 'Saída'
      )
      .forEach(item => {
        const categoria =
          item.categoria || 'Outros'

        categorias[categoria] =
          Number(
            categorias[categoria] || 0
          ) +
          Number(item.valor || 0)
      })

    return Object.entries(categorias)
      .map(([categoria, valor]) => ({
        categoria,
        valor
      }))
      .sort(
        (a, b) => b.valor - a.valor
      )
  }

  function maioresDespesas() {
    return movimentacoesMesAtual
      .filter(
        item => item.tipo === 'Saída'
      )
      .sort(
        (a, b) =>
          Number(b.valor || 0) -
          Number(a.valor || 0)
      )
      .slice(0, 5)
  }

  function ultimasMovimentacoes() {
    return [...movimentacoes]
      .sort((a, b) => {
        const dataA =
          dataDaMovimentacao(a)

        const dataB =
          dataDaMovimentacao(b)

        return dataB - dataA
      })
      .slice(0, 10)
  }

  function alertasFinanceiros() {
    const alertas = []

    if (pagarVencidas.length > 0) {
      alertas.push({
        tipo: 'erro',
        titulo: `${pagarVencidas.length} conta(s) a pagar vencida(s)`,
        descricao:
          'Existem despesas vencidas que precisam de atenção.'
      })
    }

    if (receberVencidas.length > 0) {
      alertas.push({
        tipo: 'aviso',
        titulo: `${receberVencidas.length} recebimento(s) atrasado(s)`,
        descricao:
          'Existem cobranças vencidas ainda não recebidas.'
      })
    }

    if (saldoProjetado < 0) {
      alertas.push({
        tipo: 'erro',
        titulo:
          'Saldo projetado negativo',
        descricao:
          'As contas futuras podem deixar o caixa negativo.'
      })
    }

    if (
      metaFinanceira() > 0 &&
      projecaoReceitaMes() <
        metaFinanceira()
    ) {
      alertas.push({
        tipo: 'aviso',
        titulo:
          'Projeção abaixo da meta',
        descricao: `No ritmo atual, a projeção é de ${formatarMoeda(
          projecaoReceitaMes()
        )}.`
      })
    }

    if (
      crescimentoDespesas > 20
    ) {
      alertas.push({
        tipo: 'aviso',
        titulo:
          'Aumento das despesas',
        descricao: `As despesas cresceram ${formatarNumero(
          crescimentoDespesas
        )}% em relação ao mês anterior.`
      })
    }

    if (alertas.length === 0) {
      alertas.push({
        tipo: 'sucesso',
        titulo:
          'Nenhum alerta crítico',
        descricao:
          'O financeiro não possui alertas importantes neste momento.'
      })
    }

    return alertas
  }

  function saudeFinanceira() {
    if (
      saldoProjetado < 0 ||
      pagarVencidas.length >= 3
    ) {
      return {
        titulo: 'Crítica',
        descricao:
          'O caixa exige atenção imediata.',
        classe:
          'bg-red-100 text-red-700 border-red-200',
        icone: '🔴'
      }
    }

    if (
      resultadoMes < 0 ||
      pagarVencidas.length > 0 ||
      receberVencidas.length > 0
    ) {
      return {
        titulo: 'Atenção',
        descricao:
          'Existem pontos financeiros para acompanhar.',
        classe:
          'bg-yellow-100 text-yellow-700 border-yellow-200',
        icone: '🟡'
      }
    }

    if (
      progressoMeta() >= 100 &&
      resultadoMes > 0
    ) {
      return {
        titulo: 'Excelente',
        descricao:
          'Meta atingida e resultado positivo.',
        classe:
          'bg-green-100 text-green-700 border-green-200',
        icone: '🟢'
      }
    }

    return {
      titulo: 'Boa',
      descricao:
        'O financeiro está equilibrado.',
      classe:
        'bg-blue-100 text-blue-700 border-blue-200',
      icone: '🔵'
    }
  }

  function classeAlerta(tipo) {
    if (tipo === 'erro') {
      return 'bg-red-50 border-red-100 text-red-700'
    }

    if (tipo === 'aviso') {
      return 'bg-yellow-50 border-yellow-100 text-yellow-700'
    }

    return 'bg-green-50 border-green-100 text-green-700'
  }

  function mesAtualTexto() {
    return new Date().toLocaleDateString(
      'pt-BR',
      {
        month: 'long',
        year: 'numeric'
      }
    )
  }

  const saude = saudeFinanceira()

  if (carregando) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-gray-500">
              Carregando Dashboard Financeiro...
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard Financeiro
            </h1>

            <p className="text-gray-500 mt-1">
              Acompanhe resultados, compromissos,
              projeções e a saúde financeira da
              Eternaê.
            </p>

            <p className="text-sm text-gray-400 mt-1 capitalize">
              Referência: {mesAtualTexto()}
            </p>
          </div>

          <div
            className={`border rounded-2xl px-5 py-4 ${saude.classe}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide">
              Saúde financeira
            </p>

            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl">
                {saude.icone}
              </span>

              <div>
                <p className="text-xl font-bold">
                  {saude.titulo}
                </p>

                <p className="text-xs opacity-80">
                  {saude.descricao}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <CardFinanceiro
            titulo="Receitas do mês"
            valor={formatarMoeda(
              receitasMes
            )}
            descricao="Entradas confirmadas no período"
            destaque="text-green-700"
            icone="💰"
          />

          <CardFinanceiro
            titulo="Despesas do mês"
            valor={formatarMoeda(
              despesasMes
            )}
            descricao="Saídas registradas no período"
            destaque="text-red-600"
            icone="💸"
          />

          <CardFinanceiro
            titulo="Resultado líquido"
            valor={formatarMoeda(
              resultadoMes
            )}
            descricao="Receitas menos despesas"
            destaque={
              resultadoMes >= 0
                ? 'text-blue-700'
                : 'text-red-600'
            }
            icone="📈"
          />

          <CardFinanceiro
            titulo="Saldo atual"
            valor={formatarMoeda(
              saldoAtual
            )}
            descricao="Saldo de todas as movimentações"
            destaque={
              saldoAtual >= 0
                ? 'text-gray-900'
                : 'text-red-600'
            }
            icone="🏦"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <CardFinanceiro
            titulo="Saldo projetado"
            valor={formatarMoeda(
              saldoProjetado
            )}
            descricao="Saldo + recebimentos - pagamentos"
            destaque={
              saldoProjetado >= 0
                ? 'text-purple-700'
                : 'text-red-600'
            }
            icone="🔮"
          />

          <CardFinanceiro
            titulo="Contas a receber"
            valor={formatarMoeda(
              totalReceber
            )}
            descricao={`${recebimentosPendentes.length} cobrança(s) pendente(s)`}
            destaque="text-yellow-700"
            icone="💳"
          />

          <CardFinanceiro
            titulo="Contas a pagar"
            valor={formatarMoeda(
              totalPagar
            )}
            descricao={`${pagamentosPendentes.length} compromisso(s) pendente(s)`}
            destaque="text-orange-700"
            icone="🧾"
          />

          <CardFinanceiro
            titulo="Ticket médio"
            valor={formatarMoeda(
              ticketMedio
            )}
            descricao="Média dos pedidos pagos no mês"
            destaque="text-gray-900"
            icone="🛍️"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <CardFinanceiro
            titulo="Meta financeira"
            valor={formatarMoeda(
              metaFinanceira()
            )}
            descricao={`${formatarNumero(
              progressoMeta()
            )}% atingido`}
            destaque="text-blue-700"
            icone="🎯"
          />

          <CardFinanceiro
            titulo="Projeção do mês"
            valor={formatarMoeda(
              projecaoReceitaMes()
            )}
            descricao={
              projecaoReceitaMes() >=
              metaFinanceira()
                ? 'Ritmo suficiente para atingir a meta'
                : `Faltam ${formatarMoeda(
                    faltaParaMeta()
                  )} para a meta`
            }
            destaque={
              projecaoReceitaMes() >=
              metaFinanceira()
                ? 'text-green-700'
                : 'text-red-600'
            }
            icone="📅"
          />

          <CardFinanceiro
            titulo="Crescimento da receita"
            valor={`${crescimentoReceita >= 0 ? '+' : ''}${formatarNumero(
              crescimentoReceita
            )}%`}
            descricao="Comparação com o mês anterior"
            destaque={
              crescimentoReceita >= 0
                ? 'text-green-700'
                : 'text-red-600'
            }
            icone="🚀"
          />

          <CardFinanceiro
            titulo="Pedidos pagos"
            valor={quantidadePedidosPagos}
            descricao="Pedidos com pagamento no mês"
            destaque="text-gray-900"
            icone="✅"
          />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                🎯 Progresso da meta
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Acompanhamento da meta financeira
                de {mesAtualTexto()}.
              </p>
            </div>

            <div className="lg:text-right">
              <p className="text-sm text-gray-500">
                {formatarMoeda(
                  receitasMes
                )}{' '}
                de{' '}
                {formatarMoeda(
                  metaFinanceira()
                )}
              </p>

              <p className="text-2xl font-bold text-blue-700">
                {formatarNumero(
                  progressoMeta()
                )}
                %
              </p>
            </div>
          </div>

          <div className="w-full h-5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progressoMeta() >= 100
                  ? 'bg-green-600'
                  : progressoMeta() >= 70
                  ? 'bg-yellow-500'
                  : 'bg-gray-900'
              }`}
              style={{
                width: `${progressoMeta()}%`
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <GraficoFinanceiro
            entradas={receitasMes}
            saidas={despesasMes}
          />

          <GraficoEvolucaoFinanceira
            dados={dadosEvolucaoFinanceira()}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <GraficoDespesasCategoria
            dados={dadosDespesasCategoria()}
          />

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                ⚠️ Alertas financeiros
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Pontos que precisam da sua
                atenção.
              </p>
            </div>

            <div className="space-y-3">
              {alertasFinanceiros().map(
                (alerta, index) => (
                  <div
                    key={`${alerta.titulo}-${index}`}
                    className={`border rounded-xl p-4 ${classeAlerta(
                      alerta.tipo
                    )}`}
                  >
                    <p className="font-semibold">
                      {alerta.titulo}
                    </p>

                    <p className="text-sm mt-1 opacity-80">
                      {alerta.descricao}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                🧾 Últimas movimentações
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Entradas e saídas mais recentes
                do caixa.
              </p>
            </div>

            <div className="max-h-[420px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-left text-sm">
                      Data
                    </th>

                    <th className="p-4 text-left text-sm">
                      Tipo
                    </th>

                    <th className="p-4 text-left text-sm">
                      Descrição
                    </th>

                    <th className="p-4 text-left text-sm">
                      Categoria
                    </th>

                    <th className="p-4 text-right text-sm">
                      Valor
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ultimasMovimentacoes()
                    .length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-8 text-center text-gray-500"
                      >
                        Nenhuma movimentação
                        encontrada.
                      </td>
                    </tr>
                  ) : (
                    ultimasMovimentacoes().map(
                      item => (
                        <tr
                          key={item.id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="p-4 text-sm text-gray-500">
                            {formatarData(
                              item.data_movimento
                            )}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                item.tipo ===
                                'Entrada'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.tipo}
                            </span>
                          </td>

                          <td className="p-4 text-sm font-medium text-gray-800">
                            {item.descricao ||
                              '-'}
                          </td>

                          <td className="p-4 text-sm text-gray-500">
                            {item.categoria ||
                              'Outros'}
                          </td>

                          <td
                            className={`p-4 text-right font-bold ${
                              item.tipo ===
                              'Entrada'
                                ? 'text-green-700'
                                : 'text-red-600'
                            }`}
                          >
                            {item.tipo ===
                            'Entrada'
                              ? '+ '
                              : '- '}
                            {formatarMoeda(
                              item.valor
                            )}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                💸 Maiores despesas
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Principais saídas do mês.
              </p>
            </div>

            {maioresDespesas().length ===
            0 ? (
              <p className="text-gray-500">
                Nenhuma despesa registrada
                neste mês.
              </p>
            ) : (
              <div className="space-y-3">
                {maioresDespesas().map(
                  (item, index) => (
                    <div
                      key={item.id}
                      className="border rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-gray-400">
                            #{index + 1}
                          </p>

                          <p className="font-semibold text-gray-800 mt-1">
                            {item.descricao ||
                              item.categoria ||
                              'Despesa'}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {item.categoria ||
                              'Outros'}{' '}
                            •{' '}
                            {formatarData(
                              item.data_movimento
                            )}
                          </p>
                        </div>

                        <p className="font-bold text-red-600 whitespace-nowrap">
                          {formatarMoeda(
                            item.valor
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function CardFinanceiro({
  titulo,
  valor,
  descricao,
  destaque,
  icone
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {titulo}
          </p>

          <p
            className={`text-2xl font-bold mt-3 ${destaque}`}
          >
            {valor}
          </p>
        </div>

        <span className="text-2xl">
          {icone}
        </span>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {descricao}
      </p>
    </div>
  )
}