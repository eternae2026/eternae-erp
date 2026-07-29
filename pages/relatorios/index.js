import { useEffect, useMemo, useState } from 'react'
import RelatorioDetalheModal from '../../components/RelatorioDetalheModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Relatorios() {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [contasReceber, setContasReceber] = useState([])
  const [contasPagar, setContasPagar] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [configuracao, setConfiguracao] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')

  const [tipoConsulta, setTipoConsulta] = useState('MesEspecifico')
  const [mesSelecionado, setMesSelecionado] = useState(
    String(new Date().getMonth() + 1)
  )
  const [anoSelecionado, setAnoSelecionado] = useState(
    String(new Date().getFullYear())
  )
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [modalAberto, setModalAberto] = useState(null)
  const [filtroItens, setFiltroItens] = useState('Todos')
  const [filtroFluxo, setFiltroFluxo] = useState('Todos')

  useEffect(() => {
    carregarRelatorios()
  }, [])

  async function carregarRelatorios() {
    setCarregando(true)
    setErroCarregamento('')

    try {
      const [
        resultadoMovimentacoes,
        resultadoReceber,
        resultadoPagar,
        resultadoPedidos,
        resultadoConfiguracao,
        resultadoProdutos
      ] = await Promise.all([
        supabase
          .from('movimentacoes_financeiras')
          .select('*')
          .order('data_movimento', { ascending: false })
          .order('created_at', { ascending: false }),

        supabase
          .from('financeiro')
          .select(`
            id,
            pedido_id,
            cliente_id,
            valor,
            status,
            forma_pagamento,
            data_vencimento,
            data_pagamento,
            created_at,
            clientes (
              nome
            )
          `),

        supabase
          .from('contas_pagar')
          .select(`
            id,
            descricao,
            valor,
            status,
            fornecedor,
            observacoes,
            data_vencimento,
            data_pagamento,
            created_at,
            categorias_financeiras (
              nome
            )
          `),

        supabase
          .from('pedidos')
          .select(`
            id,
            cliente_id,
            orcamento_id,
            valor,
            valor_referencia,
            forma_pagamento,
            status,
            etapa_producao,
            created_at,
            data_cancelamento,
            clientes (
              nome
            ),
            orcamentos (
              id,
              orcamento_itens (
                id,
                produto_id,
                kit_id,
                estoque_id,
                tipo_item,
                nome_item,
                quantidade,
                valor_unitario,
                subtotal,
                produtos (
                  nome
                ),
                estoque (
                  nome,
                  categoria_item
                )
              )
            )
          `)
          .order('created_at', { ascending: false }),

        supabase
          .from('configuracoes_precificacao')
          .select('*')
          .limit(1),

        supabase
          .from('produtos')
          .select(`
            id,
            nome,
            categoria,
            tempo_producao,
            margem_lucro,
            preco,
            preco_final,
            produto_composicao (
              id,
              quantidade,
              estoque (
                nome,
                custo_unitario
              )
            )
          `)
          .order('nome', { ascending: true })
      ])

      const erros = [
        resultadoMovimentacoes.error,
        resultadoReceber.error,
        resultadoPagar.error,
        resultadoPedidos.error,
        resultadoConfiguracao.error,
        resultadoProdutos.error
      ].filter(Boolean)

      if (erros.length > 0) {
        console.log('Erros ao carregar relatórios:', erros)
        setErroCarregamento(
          'Algumas informações não puderam ser carregadas. Atualize a página e tente novamente.'
        )
      }

      setMovimentacoes(resultadoMovimentacoes.data || [])
      setContasReceber(resultadoReceber.data || [])
      setContasPagar(resultadoPagar.data || [])
      setPedidos(resultadoPedidos.data || [])
      setConfiguracao(resultadoConfiguracao.data?.[0] || null)
      setProdutos(resultadoProdutos.data || [])
    } catch (error) {
      console.log('Erro inesperado ao carregar relatórios:', error)
      setErroCarregamento(
        'Não foi possível carregar os relatórios. Atualize a página e tente novamente.'
      )
    } finally {
      setCarregando(false)
    }
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

  function formatarPercentual(valor) {
    return `${formatarNumero(valor)}%`
  }

  function formatarData(data) {
    if (!data) return '-'

    const textoData = String(data)

    if (textoData.length === 10) {
      return new Date(`${textoData}T00:00:00`).toLocaleDateString('pt-BR')
    }

    return new Date(textoData).toLocaleDateString('pt-BR')
  }

  function normalizarTexto(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
  }

  function converterData(data) {
    if (!data) return null

    const textoData = String(data)
    const dataConvertida =
      textoData.length === 10
        ? new Date(`${textoData}T00:00:00`)
        : new Date(textoData)

    if (Number.isNaN(dataConvertida.getTime())) return null

    return dataConvertida
  }

  const periodoPersonalizadoInvalido =
    tipoConsulta === 'PeriodoPersonalizado' &&
    dataInicial &&
    dataFinal &&
    dataInicial > dataFinal

  function dataDentroDoPeriodo(data) {
    const dataBase = converterData(data)

    if (!dataBase) return false

    if (tipoConsulta === 'Todos') return true

    if (tipoConsulta === 'MesEspecifico') {
      return (
        dataBase.getMonth() + 1 === Number(mesSelecionado) &&
        dataBase.getFullYear() === Number(anoSelecionado)
      )
    }

    if (tipoConsulta === 'PeriodoPersonalizado') {
      if (!dataInicial || !dataFinal || periodoPersonalizadoInvalido) {
        return false
      }

      const inicio = new Date(`${dataInicial}T00:00:00`)
      const fim = new Date(`${dataFinal}T23:59:59.999`)

      return dataBase >= inicio && dataBase <= fim
    }

    return true
  }

  function nomeMes(mes) {
    const nomes = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ]

    return nomes[Number(mes) - 1] || ''
  }

  function nomePeriodoSelecionado() {
    if (tipoConsulta === 'MesEspecifico') {
      return `${nomeMes(mesSelecionado)} de ${anoSelecionado}`
    }

    if (tipoConsulta === 'PeriodoPersonalizado') {
      if (!dataInicial || !dataFinal) return 'Período personalizado'
      if (periodoPersonalizadoInvalido) return 'Período inválido'

      return `${formatarData(dataInicial)} até ${formatarData(dataFinal)}`
    }

    return 'Todo o período'
  }

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(movimento =>
      dataDentroDoPeriodo(
        movimento.data_movimento || movimento.created_at
      )
    )
  }, [
    movimentacoes,
    tipoConsulta,
    mesSelecionado,
    anoSelecionado,
    dataInicial,
    dataFinal
  ])

  const pedidosValidos = useMemo(() => {
    return pedidos.filter(pedido => {
      const cancelado =
        normalizarTexto(pedido.status) === 'cancelado' ||
        normalizarTexto(pedido.etapa_producao) === 'cancelado'

      return !cancelado && dataDentroDoPeriodo(pedido.created_at)
    })
  }, [
    pedidos,
    tipoConsulta,
    mesSelecionado,
    anoSelecionado,
    dataInicial,
    dataFinal
  ])

  const pedidosCancelados = useMemo(() => {
    return pedidos.filter(pedido => {
      const cancelado =
        normalizarTexto(pedido.status) === 'cancelado' ||
        normalizarTexto(pedido.etapa_producao) === 'cancelado'

      return (
        cancelado &&
        dataDentroDoPeriodo(
          pedido.data_cancelamento || pedido.created_at
        )
      )
    })
  }, [
    pedidos,
    tipoConsulta,
    mesSelecionado,
    anoSelecionado,
    dataInicial,
    dataFinal
  ])

  const entradasPeriodo = useMemo(() => {
    return movimentacoesFiltradas
      .filter(
        movimento => normalizarTexto(movimento.tipo) === 'entrada'
      )
      .reduce(
        (total, movimento) => total + Number(movimento.valor || 0),
        0
      )
  }, [movimentacoesFiltradas])

  const saidasPeriodo = useMemo(() => {
    return movimentacoesFiltradas
      .filter(
        movimento => normalizarTexto(movimento.tipo) === 'saida'
      )
      .reduce(
        (total, movimento) => total + Number(movimento.valor || 0),
        0
      )
  }, [movimentacoesFiltradas])

  const resultadoPeriodo = entradasPeriodo - saidasPeriodo

  const saldoAtual = useMemo(() => {
    const entradas = movimentacoes
      .filter(
        movimento => normalizarTexto(movimento.tipo) === 'entrada'
      )
      .reduce(
        (total, movimento) => total + Number(movimento.valor || 0),
        0
      )

    const saidas = movimentacoes
      .filter(
        movimento => normalizarTexto(movimento.tipo) === 'saida'
      )
      .reduce(
        (total, movimento) => total + Number(movimento.valor || 0),
        0
      )

    return entradas - saidas
  }, [movimentacoes])

  const totalAReceber = useMemo(() => {
    return contasReceber
      .filter(conta => normalizarTexto(conta.status) === 'pendente')
      .reduce(
        (total, conta) => total + Number(conta.valor || 0),
        0
      )
  }, [contasReceber])

  const totalAPagar = useMemo(() => {
    return contasPagar
      .filter(conta => normalizarTexto(conta.status) === 'pendente')
      .reduce(
        (total, conta) => total + Number(conta.valor || 0),
        0
      )
  }, [contasPagar])

  const saldoProjetado = saldoAtual + totalAReceber - totalAPagar

  const valorVendido = useMemo(() => {
    return pedidosValidos.reduce(
      (total, pedido) => total + Number(pedido.valor || 0),
      0
    )
  }, [pedidosValidos])

  const ticketMedio =
    pedidosValidos.length > 0
      ? valorVendido / pedidosValidos.length
      : 0

  const clientesAtendidos = useMemo(() => {
    return new Set(
      pedidosValidos
        .map(pedido => pedido.cliente_id)
        .filter(Boolean)
    ).size
  }, [pedidosValidos])

  function obterItensPedidosValidos() {
    return pedidosValidos.flatMap(
      pedido => pedido.orcamentos?.orcamento_itens || []
    )
  }

  const rankingItens = useMemo(() => {
    const agrupamento = {}

    obterItensPedidosValidos().forEach(item => {
      const nome =
        item.nome_item ||
        item.produtos?.nome ||
        item.estoque?.nome ||
        'Item sem nome'

      if (!agrupamento[nome]) {
        agrupamento[nome] = {
          nome,
          quantidade: 0,
          faturamento: 0
        }
      }

      agrupamento[nome].quantidade += Number(item.quantidade || 0)
      agrupamento[nome].faturamento += Number(item.subtotal || 0)
    })

    return Object.values(agrupamento).sort(
      (a, b) => b.quantidade - a.quantidade
    )
  }, [pedidosValidos])

  const rankingProdutos = useMemo(() => {
    const agrupamento = {}

    obterItensPedidosValidos()
      .filter(item => {
        const tipo = normalizarTexto(item.tipo_item)
        return Boolean(item.produto_id) || tipo === 'produto'
      })
      .forEach(item => {
        const nome =
          item.nome_item ||
          item.produtos?.nome ||
          'Produto sem nome'

        if (!agrupamento[nome]) {
          agrupamento[nome] = {
            nome,
            quantidade: 0,
            faturamento: 0
          }
        }

        agrupamento[nome].quantidade += Number(item.quantidade || 0)
        agrupamento[nome].faturamento += Number(item.subtotal || 0)
      })

    return Object.values(agrupamento).sort(
      (a, b) => b.quantidade - a.quantidade
    )
  }, [pedidosValidos])

  const rankingKits = useMemo(() => {
    const agrupamento = {}

    obterItensPedidosValidos()
      .filter(item => {
        const tipo = normalizarTexto(item.tipo_item)
        return Boolean(item.kit_id) || tipo === 'kit'
      })
      .forEach(item => {
        const nome = item.nome_item || 'Kit sem nome'

        if (!agrupamento[nome]) {
          agrupamento[nome] = {
            nome,
            quantidade: 0,
            faturamento: 0
          }
        }

        agrupamento[nome].quantidade += Number(item.quantidade || 0)
        agrupamento[nome].faturamento += Number(item.subtotal || 0)
      })

    return Object.values(agrupamento).sort(
      (a, b) => b.quantidade - a.quantidade
    )
  }, [pedidosValidos])

  const rankingClientes = useMemo(() => {
    const agrupamento = {}

    pedidosValidos.forEach(pedido => {
      const clienteId =
        pedido.cliente_id || pedido.clientes?.nome || pedido.id
      const nome = pedido.clientes?.nome || 'Cliente não informado'

      if (!agrupamento[clienteId]) {
        agrupamento[clienteId] = {
          nome,
          pedidos: 0,
          valor: 0
        }
      }

      agrupamento[clienteId].pedidos += 1
      agrupamento[clienteId].valor += Number(pedido.valor || 0)
    })

    return Object.values(agrupamento).sort(
      (a, b) => b.valor - a.valor
    )
  }, [pedidosValidos])


  const rankingAcessorios = useMemo(() => {
    const agrupamento = {}

    obterItensPedidosValidos()
      .filter(item =>
        normalizarTexto(item.estoque?.categoria_item) === 'acessorio'
      )
      .forEach(item => {
        const nome = item.nome_item || item.estoque?.nome || 'Acessório sem nome'

        if (!agrupamento[nome]) {
          agrupamento[nome] = { nome, quantidade: 0, faturamento: 0 }
        }

        agrupamento[nome].quantidade += Number(item.quantidade || 0)
        agrupamento[nome].faturamento += Number(item.subtotal || 0)
      })

    return Object.values(agrupamento).sort(
      (a, b) => b.quantidade - a.quantidade
    )
  }, [pedidosValidos])

  const rankingEmbalagens = useMemo(() => {
    const agrupamento = {}

    obterItensPedidosValidos()
      .filter(item =>
        normalizarTexto(item.estoque?.categoria_item) === 'embalagem'
      )
      .forEach(item => {
        const nome = item.nome_item || item.estoque?.nome || 'Embalagem sem nome'

        if (!agrupamento[nome]) {
          agrupamento[nome] = { nome, quantidade: 0, faturamento: 0 }
        }

        agrupamento[nome].quantidade += Number(item.quantidade || 0)
        agrupamento[nome].faturamento += Number(item.subtotal || 0)
      })

    return Object.values(agrupamento).sort(
      (a, b) => b.quantidade - a.quantidade
    )
  }, [pedidosValidos])

  function dadosRankingSelecionado() {
    if (filtroItens === 'Produtos') return rankingProdutos
    if (filtroItens === 'Kits') return rankingKits
    if (filtroItens === 'Acessórios') return rankingAcessorios
    if (filtroItens === 'Embalagens') return rankingEmbalagens
    return rankingItens
  }

  function custosFixosTotaisPrecificacao() {
    if (!configuracao) return 0

    return (
      Number(configuracao.energia || 0) +
      Number(configuracao.internet || 0) +
      Number(configuracao.canva || 0) +
      Number(configuracao.dominio || 0) +
      Number(configuracao.outros_custos || 0)
    )
  }

  function horasMensaisPrecificacao() {
    if (!configuracao) return 0

    return (
      Number(configuracao.horas_por_dia || 0) *
      Number(configuracao.dias_por_semana || 0) *
      4.33
    )
  }

  function valorHoraPrecificacao() {
    const horas = horasMensaisPrecificacao()
    if (horas <= 0) return 0

    return Number(configuracao?.pro_labore_desejado || 0) / horas
  }

  function custoFixoPorHoraPrecificacao() {
    const horas = horasMensaisPrecificacao()
    if (horas <= 0) return 0

    return custosFixosTotaisPrecificacao() / horas
  }

  function custoInsumosProduto(produto) {
    return (produto.produto_composicao || []).reduce((total, item) => {
      return total +
        Number(item.estoque?.custo_unitario || 0) *
        Number(item.quantidade || 0)
    }, 0)
  }

  function horasProduto(produto) {
    return Number(produto.tempo_producao || 0) / 60
  }

  function custoMaoDeObraProduto(produto) {
    return horasProduto(produto) * valorHoraPrecificacao()
  }

  function custoFixoProduto(produto) {
    return horasProduto(produto) * custoFixoPorHoraPrecificacao()
  }

  function custoTotalProduto(produto) {
    return (
      custoInsumosProduto(produto) +
      custoMaoDeObraProduto(produto) +
      custoFixoProduto(produto)
    )
  }

  function precoAtualProduto(produto) {
    return Number(produto.preco_final || produto.preco || 0)
  }

  function lucroEstimadoProduto(produto) {
    return precoAtualProduto(produto) - custoTotalProduto(produto)
  }

  function margemRealProduto(produto) {
    const preco = precoAtualProduto(produto)
    if (preco <= 0) return 0

    return (lucroEstimadoProduto(produto) / preco) * 100
  }

  function statusMargemProduto(produto) {
    const margem = Number(margemRealProduto(produto).toFixed(2))
    const margemDesejada = Number(
      produto.margem_lucro || configuracao?.margem_padrao || 0
    )

    if (margem >= margemDesejada) return 'Saudável'
    if (margem >= margemDesejada * 0.75) return 'Reduzida'
    return 'Crítica'
  }

  function corStatusMargem(status) {
    if (status === 'Saudável') return 'bg-green-100 text-green-700'
    if (status === 'Reduzida') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
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
    const percentual = Number(
      configuracao?.percentual_crescimento || 0
    )

    return metaMinima() * (percentual / 100)
  }

  function metaCrescimento() {
    return metaMinima() + reservaCrescimento()
  }

  const metaCrescimentoValor = metaCrescimento()
  const percentualMeta =
    metaCrescimentoValor > 0
      ? (entradasPeriodo / metaCrescimentoValor) * 100
      : 0
  const percentualMetaBarra = Math.min(
    Math.max(percentualMeta, 0),
    100
  )
  const faltaParaMeta = Math.max(
    metaCrescimentoValor - entradasPeriodo,
    0
  )


  const contasReceberPeriodo = useMemo(() => {
    return contasReceber
      .filter(conta =>
        dataDentroDoPeriodo(
          conta.data_pagamento ||
          conta.data_vencimento ||
          conta.created_at
        )
      )
      .sort((a, b) => {
        const dataA = converterData(
          a.data_pagamento ||
          a.data_vencimento ||
          a.created_at
        )?.getTime() || 0

        const dataB = converterData(
          b.data_pagamento ||
          b.data_vencimento ||
          b.created_at
        )?.getTime() || 0

        return dataB - dataA
      })
  }, [
    contasReceber,
    tipoConsulta,
    mesSelecionado,
    anoSelecionado,
    dataInicial,
    dataFinal
  ])

  const contasPagarPeriodo = useMemo(() => {
    return contasPagar
      .filter(conta =>
        dataDentroDoPeriodo(
          conta.data_pagamento ||
          conta.data_vencimento ||
          conta.created_at
        )
      )
      .sort((a, b) => {
        const dataA = converterData(
          a.data_pagamento ||
          a.data_vencimento ||
          a.created_at
        )?.getTime() || 0

        const dataB = converterData(
          b.data_pagamento ||
          b.data_vencimento ||
          b.created_at
        )?.getTime() || 0

        return dataB - dataA
      })
  }, [
    contasPagar,
    tipoConsulta,
    mesSelecionado,
    anoSelecionado,
    dataInicial,
    dataFinal
  ])

  function classificarMovimentacaoDRE(movimento) {
    const tipo = normalizarTexto(movimento.tipo)
    const categoria = normalizarTexto(movimento.categoria)

    if (tipo === 'entrada') {
      if (
        categoria.includes('venda') ||
        categoria.includes('receita bruta')
      ) {
        return 'receita_bruta'
      }

      return 'outra_receita'
    }

    if (
      categoria.includes('desconto') ||
      categoria.includes('taxa de pagamento') ||
      categoria.includes('taxas de pagamento') ||
      categoria === 'impostos' ||
      categoria.includes('imposto sobre venda') ||
      categoria.includes('impostos sobre venda')
    ) {
      return 'deducao_receita'
    }

    if (
      categoria.includes('materia-prima') ||
      categoria.includes('materia prima') ||
      categoria.includes('insumo') ||
      categoria.includes('produto base') ||
      categoria.includes('embalagem') ||
      categoria.includes('acessorio')
    ) {
      return 'custo_produto'
    }

    if (
      categoria.includes('marketing') ||
      categoria.includes('publicidade') ||
      categoria.includes('canva') ||
      categoria.includes('dominio') ||
      categoria.includes('internet') ||
      categoria.includes('telefone') ||
      categoria.includes('energia') ||
      categoria.includes('frete') ||
      categoria.includes('entrega') ||
      categoria.includes('software') ||
      categoria.includes('assinatura') ||
      categoria.includes('equipamento') ||
      categoria.includes('manutencao') ||
      categoria.includes('escritorio') ||
      categoria.includes('mei') ||
      categoria.includes('pro-labore')
    ) {
      return 'despesa_operacional'
    }

    return 'outra_despesa'
  }

  const gruposDRE = useMemo(() => {
    const totais = {
      receita_bruta: 0,
      deducao_receita: 0,
      custo_produto: 0,
      despesa_operacional: 0,
      outra_receita: 0,
      outra_despesa: 0
    }

    movimentacoesFiltradas.forEach(movimento => {
      const grupo = classificarMovimentacaoDRE(movimento)

      totais[grupo] += Number(movimento.valor || 0)
    })

    return totais
  }, [movimentacoesFiltradas])

  const receitaLiquidaDRE =
    gruposDRE.receita_bruta -
    gruposDRE.deducao_receita

  const lucroBrutoDRE =
    receitaLiquidaDRE -
    gruposDRE.custo_produto

  const resultadoOperacionalDRE =
    lucroBrutoDRE -
    gruposDRE.despesa_operacional

  const resultadoLiquidoDRE =
    resultadoOperacionalDRE +
    gruposDRE.outra_receita -
    gruposDRE.outra_despesa

  const margemLiquidaDRE =
    receitaLiquidaDRE > 0
      ? (resultadoLiquidoDRE / receitaLiquidaDRE) * 100
      : 0

      const movimentacoesFluxoFiltradas = useMemo(() => {
  if (filtroFluxo === 'Todos') {
    return movimentacoesFiltradas
  }

  return movimentacoesFiltradas.filter(movimento => {
    const tipo = normalizarTexto(movimento.tipo)

    if (filtroFluxo === 'Entradas') {
      return tipo === 'entrada'
    }

    if (filtroFluxo === 'Saídas') {
      return tipo === 'saida'
    }

    return true
  })
}, [movimentacoesFiltradas, filtroFluxo])
  
      function baixarCSV(nomeArquivo, linhas) {
    if (!linhas || linhas.length === 0) {
      alert('Não há dados para exportar.')
      return
    }

    const cabecalhos = Object.keys(linhas[0])
    const conteudo = [
      cabecalhos.join(';'),
      ...linhas.map(linha =>
        cabecalhos
          .map(campo => {
            const valor = linha[campo] ?? ''
            return `"${String(valor).replace(/"/g, '""')}"`
          })
          .join(';')
      )
    ].join('\n')

    const blob = new Blob([`\uFEFF${conteudo}`], {
      type: 'text/csv;charset=utf-8;'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = nomeArquivo
    link.click()

    URL.revokeObjectURL(url)
  }


  function exportarFluxoCaixa() {
  const sufixoArquivo =
    filtroFluxo === 'Entradas'
      ? 'entradas'
      : filtroFluxo === 'Saídas'
        ? 'saidas'
        : 'todas'

  baixarCSV(
    `fluxo-de-caixa-${sufixoArquivo}.csv`,
    movimentacoesFluxoFiltradas.map(movimento => ({
      Data: formatarData(
        movimento.data_movimento ||
        movimento.created_at
      ),
      Tipo: movimento.tipo || '',
      Descricao: movimento.descricao || '',
      Categoria: movimento.categoria || '',
      Forma_de_pagamento:
        movimento.forma_pagamento || '',
      Valor: formatarMoeda(movimento.valor)
    }))
  )
}

  function exportarDRE() {
    baixarCSV(
      'dre.csv',
      [
        {
          Linha: 'Receita Bruta',
          Valor: formatarMoeda(gruposDRE.receita_bruta)
        },
        {
          Linha: '(-) Deduções da Receita',
          Valor: formatarMoeda(gruposDRE.deducao_receita)
        },
        {
          Linha: 'Receita Líquida',
          Valor: formatarMoeda(receitaLiquidaDRE)
        },
        {
          Linha: '(-) Custos dos Produtos',
          Valor: formatarMoeda(gruposDRE.custo_produto)
        },
        {
          Linha: 'Lucro Bruto',
          Valor: formatarMoeda(lucroBrutoDRE)
        },
        {
          Linha: '(-) Despesas Operacionais',
          Valor: formatarMoeda(gruposDRE.despesa_operacional)
        },
        {
          Linha: 'Resultado Operacional',
          Valor: formatarMoeda(resultadoOperacionalDRE)
        },
        {
          Linha: '(+) Outras Receitas',
          Valor: formatarMoeda(gruposDRE.outra_receita)
        },
        {
          Linha: '(-) Outras Despesas',
          Valor: formatarMoeda(gruposDRE.outra_despesa)
        },
        {
          Linha: 'Resultado Líquido do Período',
          Valor: formatarMoeda(resultadoLiquidoDRE)
        },
        {
          Linha: 'Margem Líquida',
          Valor: formatarPercentual(margemLiquidaDRE)
        }
      ]
    )
  }

  function exportarContasReceber() {
    baixarCSV(
      'contas-a-receber.csv',
      contasReceberPeriodo.map(conta => ({
        Cliente: conta.clientes?.nome || 'Cliente não informado',
        Pedido: conta.pedido_id
          ? `#${String(conta.pedido_id).slice(0, 8)}`
          : '',
        Valor: formatarMoeda(conta.valor),
        Forma_de_pagamento:
          conta.forma_pagamento || '',
        Vencimento: formatarData(conta.data_vencimento),
        Pagamento: formatarData(conta.data_pagamento),
        Status: conta.status || ''
      }))
    )
  }

  function exportarContasPagar() {
    baixarCSV(
      'contas-a-pagar.csv',
      contasPagarPeriodo.map(conta => ({
        Descricao: conta.descricao || '',
        Categoria:
          conta.categorias_financeiras?.nome ||
          'Sem categoria',
        Fornecedor: conta.fornecedor || '',
        Valor: formatarMoeda(conta.valor),
        Vencimento: formatarData(conta.data_vencimento),
        Pagamento: formatarData(conta.data_pagamento),
        Status: conta.status || ''
      }))
    )
  }

  function exportarItens() {
    baixarCSV(
      `itens-mais-vendidos-${normalizarTexto(filtroItens || 'todos')}.csv`,
      dadosRankingSelecionado().map(item => ({
        Item: item.nome,
        Tipo: filtroItens,
        Quantidade: formatarNumero(item.quantidade),
        Faturamento: formatarMoeda(item.faturamento)
      }))
    )
  }

  function exportarTabelaPrecos() {
    baixarCSV(
      'tabela-de-precos.csv',
      produtos.map(produto => ({
        Produto: produto.nome,
        Categoria: produto.categoria || '',
        Preco_de_venda: formatarMoeda(precoAtualProduto(produto)),
        Margem_desejada: formatarPercentual(
          produto.margem_lucro || configuracao?.margem_padrao || 0
        ),
        Situacao: precoAtualProduto(produto) > 0
          ? 'Precificado'
          : 'Aguardando precificação'
      }))
    )
  }

  function exportarAnalisePrecificacao() {
    baixarCSV(
      'analise-de-precificacao.csv',
      produtos.map(produto => ({
        Produto: produto.nome,
        Insumos: formatarMoeda(custoInsumosProduto(produto)),
        Mao_de_obra: formatarMoeda(custoMaoDeObraProduto(produto)),
        Custo_fixo: formatarMoeda(custoFixoProduto(produto)),
        Custo_total: formatarMoeda(custoTotalProduto(produto)),
        Preco_atual: formatarMoeda(precoAtualProduto(produto)),
        Lucro_estimado: formatarMoeda(lucroEstimadoProduto(produto)),
        Margem_real: formatarPercentual(margemRealProduto(produto)),
        Status: statusMargemProduto(produto)
      }))
    )
  }

  function exportarClientes() {
    baixarCSV(
      'clientes-que-mais-compraram.csv',
      rankingClientes.map(item => ({
        Cliente: item.nome,
        Pedidos: item.pedidos,
        Valor_comprado: formatarMoeda(item.valor)
      }))
    )
  }

  function TabelaRanking({ dados, colunaNome, vazio }) {
    if (dados.length === 0) {
      return <p className="text-gray-500">{vazio}</p>
    }

    return (
      <div className="overflow-x-auto border rounded-2xl">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-gray-600">Posição</th>
              <th className="text-left p-4 text-gray-600">{colunaNome}</th>
              <th className="text-right p-4 text-gray-600">Quantidade</th>
              <th className="text-right p-4 text-gray-600">
                Faturamento dos itens
              </th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item, index) => (
              <tr key={`${item.nome}-${index}`} className="border-t">
                <td className="p-4">{index + 1}</td>
                <td className="p-4 font-semibold text-gray-800">
                  {item.nome}
                </td>
                <td className="p-4 text-right">
                  {formatarNumero(item.quantidade)}
                </td>
                <td className="p-4 text-right">
                  {formatarMoeda(item.faturamento)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-8">
          <p className="text-gray-500">Carregando relatórios...</p>
        </main>
      </div>
    )
  }

  function CardRelatorio({
    icone,
    titulo,
    descricao,
    detalhe,
    onClick,
    href,
    destaque = 'gray'
  }) {
    const classes = {
      gray: 'bg-white border-gray-100 hover:border-gray-300',
      green: 'bg-green-50 border-green-100 hover:border-green-300',
      blue: 'bg-blue-50 border-blue-100 hover:border-blue-300',
      purple: 'bg-purple-50 border-purple-100 hover:border-purple-300',
      amber: 'bg-amber-50 border-amber-100 hover:border-amber-300'
    }

    const conteudo = (
      <>
        <div className="flex items-start justify-between gap-4">
          <span className="text-2xl" aria-hidden="true">
            {icone}
          </span>

          <span className="text-gray-400 text-lg">→</span>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mt-5">
          {titulo}
        </h3>

        <p className="text-sm text-gray-500 mt-2 leading-6">
          {descricao}
        </p>

        {detalhe && (
          <p className="text-sm font-semibold text-gray-800 mt-5">
            {detalhe}
          </p>
        )}
      </>
    )

    const className = `
      block w-full min-h-[210px]
      rounded-2xl border p-6 shadow-sm
      text-left transition
      ${classes[destaque] || classes.gray}
    `

    if (href) {
      return (
        <a href={href} className={className}>
          {conteudo}
        </a>
      )
    }

    return (
      <button type="button" onClick={onClick} className={className}>
        {conteudo}
      </button>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 min-w-0 p-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Central de Relatórios
            </h1>

            <p className="text-gray-500 mt-1">
              Escolha o relatório que deseja consultar ou exportar.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarRelatorios}
            className="self-start bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Atualizar dados
          </button>
        </div>

        {erroCarregamento && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6">
            {erroCarregamento}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Período dos relatórios comerciais
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {nomePeriodoSelecionado()}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Consulta
                </label>

                <select
                  value={tipoConsulta}
                  onChange={event => {
                    const novoTipo = event.target.value
                    setTipoConsulta(novoTipo)

                    if (novoTipo !== 'PeriodoPersonalizado') {
                      setDataInicial('')
                      setDataFinal('')
                    }
                  }}
                  className="border bg-white rounded-xl px-4 py-3"
                >
                  <option value="MesEspecifico">Mês específico</option>
                  <option value="PeriodoPersonalizado">
                    Período personalizado
                  </option>
                  <option value="Todos">Todo o período</option>
                </select>
              </div>

              {tipoConsulta === 'MesEspecifico' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Mês
                    </label>

                    <select
                      value={mesSelecionado}
                      onChange={event =>
                        setMesSelecionado(event.target.value)
                      }
                      className="border bg-white rounded-xl px-4 py-3"
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
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Ano
                    </label>

                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={anoSelecionado}
                      onChange={event =>
                        setAnoSelecionado(event.target.value)
                      }
                      className="border bg-white rounded-xl px-4 py-3 w-32"
                    />
                  </div>
                </>
              )}

              {tipoConsulta === 'PeriodoPersonalizado' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Data inicial
                    </label>

                    <input
                      type="date"
                      value={dataInicial}
                      onChange={event =>
                        setDataInicial(event.target.value)
                      }
                      className="border bg-white rounded-xl px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Data final
                    </label>

                    <input
                      type="date"
                      value={dataFinal}
                      min={dataInicial || undefined}
                      onChange={event =>
                        setDataFinal(event.target.value)
                      }
                      className="border bg-white rounded-xl px-4 py-3"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {tipoConsulta === 'PeriodoPersonalizado' &&
            (!dataInicial || !dataFinal) && (
              <p className="text-sm text-yellow-700 mt-4">
                Informe a data inicial e a data final para visualizar o período personalizado.
              </p>
            )}

          {periodoPersonalizadoInvalido && (
            <p className="text-sm text-red-600 mt-4">
              A data final não pode ser anterior à data inicial.
            </p>
          )}
        </div>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Financeiro
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Acesse as análises financeiras completas já disponíveis no ERP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <CardRelatorio
              icone="💹"
              titulo="Fluxo de Caixa"
              descricao="Entradas, saídas, saldo realizado e projeção financeira."
              detalhe={formatarMoeda(resultadoPeriodo)}
              onClick={() => setModalAberto('fluxo')}
              destaque="green"
            />

            <CardRelatorio
              icone="📊"
              titulo="DRE"
              descricao="Demonstrativo gerencial do resultado da Eternaê."
              detalhe={`Resultado: ${formatarMoeda(resultadoPeriodo)}`}
              onClick={() => setModalAberto('dre')}
              destaque="blue"
            />

            <CardRelatorio
              icone="💳"
              titulo="Contas a Receber"
              descricao="Cobranças dos pedidos e recebimentos pendentes."
              detalhe={`${formatarMoeda(totalAReceber)} pendentes`}
              onClick={() => setModalAberto('receber')}
              destaque="green"
            />

            <CardRelatorio
              icone="🧾"
              titulo="Contas a Pagar"
              descricao="Despesas, obrigações e compromissos financeiros."
              detalhe={`${formatarMoeda(totalAPagar)} pendentes`}
              onClick={() => setModalAberto('pagar')}
              destaque="amber"
            />
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Comercial
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Rankings baseados nos pedidos válidos do período selecionado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <CardRelatorio
              icone="🏆"
              titulo="Itens mais vendidos"
              descricao="Consulte todos os itens ou filtre por produtos, kits, acessórios e embalagens."
              detalhe={`${rankingItens.length} item(ns) no período`}
              onClick={() => {
                setFiltroItens('Todos')
                setModalAberto('itens')
              }}
              destaque="purple"
            />

            <CardRelatorio
              icone="👥"
              titulo="Clientes que mais compraram"
              descricao="Ranking de clientes pelo valor comercial dos pedidos válidos."
              detalhe={`${rankingClientes.length} cliente(s) no período`}
              onClick={() => setModalAberto('clientes')}
              destaque="blue"
            />

            <CardRelatorio
              icone="💲"
              titulo="Tabela de preços"
              descricao="Relação atual de produtos, categorias, preços e situação da precificação."
              detalhe={`${produtos.length} produto(s) cadastrados`}
              onClick={() => setModalAberto('precos')}
              destaque="green"
            />
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Precificação
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Consulte a composição técnica dos preços cadastrados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <CardRelatorio
              icone="🧮"
              titulo="Análise de precificação"
              descricao="Custos, preço atual, lucro estimado, margem real e saúde da margem."
              detalhe={`${produtos.length} produto(s) analisado(s)`}
              onClick={() => setModalAberto('precificacao')}
              destaque="amber"
            />
          </div>
        </section>


        <RelatorioDetalheModal
          open={modalAberto === 'fluxo'}
          onClose={() => setModalAberto(null)}
          titulo="Fluxo de Caixa"
          descricao={`Entradas e saídas do período: ${nomePeriodoSelecionado()}.`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-700">Entradas</p>
              <p className="text-xl font-bold text-green-800 mt-1">
                {formatarMoeda(entradasPeriodo)}
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm text-red-700">Saídas</p>
              <p className="text-xl font-bold text-red-700 mt-1">
                {formatarMoeda(saidasPeriodo)}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-700">Resultado</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  resultadoPeriodo >= 0
                    ? 'text-blue-800'
                    : 'text-red-600'
                }`}
              >
                {formatarMoeda(resultadoPeriodo)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
  <div className="w-full sm:w-56">
    <label className="block text-xs text-gray-500 mb-1">
      Tipo da movimentação
    </label>

    <select
      value={filtroFluxo}
      onChange={event =>
        setFiltroFluxo(event.target.value)
      }
      className="w-full border bg-white rounded-xl px-4 py-3"
    >
      <option value="Todos">
        Todas
      </option>

      <option value="Entradas">
        Entradas
      </option>

      <option value="Saídas">
        Saídas
      </option>
    </select>
  </div>

  <button
    type="button"
    onClick={exportarFluxoCaixa}
    className="bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition"
  >
    Exportar CSV
  </button>
</div>

          <div className="max-h-[50vh] overflow-auto border rounded-2xl">
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-gray-600">Data</th>
                  <th className="text-left p-4 text-gray-600">Tipo</th>
                  <th className="text-left p-4 text-gray-600">Descrição</th>
                  <th className="text-left p-4 text-gray-600">Categoria</th>
                  <th className="text-left p-4 text-gray-600">
                    Forma de pagamento
                  </th>
                  <th className="text-right p-4 text-gray-600">Valor</th>
                </tr>
              </thead>

              <tbody>
                {movimentacoesFluxoFiltradas.map(movimento => {
                  const entrada =
                    normalizarTexto(movimento.tipo) === 'entrada'

                  return (
                    <tr key={movimento.id} className="border-t">
                      <td className="p-4">
                        {formatarData(
                          movimento.data_movimento ||
                          movimento.created_at
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            entrada
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {movimento.tipo}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">
                        {movimento.descricao || '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {movimento.categoria || '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {movimento.forma_pagamento || '-'}
                      </td>
                      <td
                        className={`p-4 text-right font-semibold ${
                          entrada
                            ? 'text-green-700'
                            : 'text-red-600'
                        }`}
                      >
                        {entrada ? '+ ' : '- '}
                        {formatarMoeda(movimento.valor)}
                      </td>
                    </tr>
                  )
                })}

                {movimentacoesFluxoFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500"
                    >
                      Nenhuma movimentação encontrada para o filtro selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'dre'}
          onClose={() => setModalAberto(null)}
          titulo="DRE"
          descricao={`Demonstrativo gerencial do resultado — ${nomePeriodoSelecionado()}.`}
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={exportarDRE}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          <div className="border rounded-2xl overflow-hidden">
            {[
              ['Receita Bruta', gruposDRE.receita_bruta, false],
              ['(-) Deduções da Receita', gruposDRE.deducao_receita, true],
              ['Receita Líquida', receitaLiquidaDRE, false],
              ['(-) Custos dos Produtos', gruposDRE.custo_produto, true],
              ['Lucro Bruto', lucroBrutoDRE, false],
              ['(-) Despesas Operacionais', gruposDRE.despesa_operacional, true],
              ['Resultado Operacional', resultadoOperacionalDRE, false],
              ['(+) Outras Receitas', gruposDRE.outra_receita, false],
              ['(-) Outras Despesas', gruposDRE.outra_despesa, true]
            ].map(([titulo, valor, negativo], index) => (
              <div
                key={titulo}
                className={`flex items-center justify-between px-5 py-4 ${
                  index > 0 ? 'border-t' : ''
                } ${
                  [
                    'Receita Líquida',
                    'Lucro Bruto',
                    'Resultado Operacional'
                  ].includes(titulo)
                    ? 'bg-gray-50 font-bold'
                    : ''
                }`}
              >
                <span className="text-gray-700">{titulo}</span>
                <strong
                  className={
                    negativo
                      ? 'text-red-600'
                      : 'text-gray-800'
                  }
                >
                  {formatarMoeda(valor)}
                </strong>
              </div>
            ))}

            <div className="flex items-center justify-between gap-6 bg-gray-900 text-white px-5 py-5">
              <div>
                <p className="font-semibold">
                  Resultado Líquido do Período
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Margem líquida de {formatarPercentual(margemLiquidaDRE)}
                </p>
              </div>

              <strong
                className={`text-xl ${
                  resultadoLiquidoDRE >= 0
                    ? 'text-green-300'
                    : 'text-red-300'
                }`}
              >
                {formatarMoeda(resultadoLiquidoDRE)}
              </strong>
            </div>
          </div>
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'receber'}
          onClose={() => setModalAberto(null)}
          titulo="Contas a Receber"
          descricao={`Cobranças e recebimentos relacionados ao período: ${nomePeriodoSelecionado()}.`}
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={exportarContasReceber}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          <div className="max-h-[55vh] overflow-auto border rounded-2xl">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-gray-600">Cliente</th>
                  <th className="text-left p-4 text-gray-600">Pedido</th>
                  <th className="text-right p-4 text-gray-600">Valor</th>
                  <th className="text-left p-4 text-gray-600">
                    Forma de pagamento
                  </th>
                  <th className="text-left p-4 text-gray-600">Vencimento</th>
                  <th className="text-left p-4 text-gray-600">Pagamento</th>
                  <th className="text-center p-4 text-gray-600">Status</th>
                </tr>
              </thead>

              <tbody>
                {contasReceberPeriodo.map(conta => {
                  const status = normalizarTexto(conta.status)

                  return (
                    <tr key={conta.id} className="border-t">
                      <td className="p-4 font-semibold text-gray-800">
                        {conta.clientes?.nome ||
                          'Cliente não informado'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {conta.pedido_id
                          ? `#${String(conta.pedido_id).slice(0, 8)}`
                          : '-'}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatarMoeda(conta.valor)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {conta.forma_pagamento || '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatarData(conta.data_vencimento)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatarData(conta.data_pagamento)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            status === 'recebido'
                              ? 'bg-green-100 text-green-700'
                              : status === 'cancelado'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {conta.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {contasReceberPeriodo.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      Nenhuma conta a receber encontrada no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'pagar'}
          onClose={() => setModalAberto(null)}
          titulo="Contas a Pagar"
          descricao={`Despesas e obrigações relacionadas ao período: ${nomePeriodoSelecionado()}.`}
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={exportarContasPagar}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          <div className="max-h-[55vh] overflow-auto border rounded-2xl">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-gray-600">Descrição</th>
                  <th className="text-left p-4 text-gray-600">Categoria</th>
                  <th className="text-left p-4 text-gray-600">Fornecedor</th>
                  <th className="text-right p-4 text-gray-600">Valor</th>
                  <th className="text-left p-4 text-gray-600">Vencimento</th>
                  <th className="text-left p-4 text-gray-600">Pagamento</th>
                  <th className="text-center p-4 text-gray-600">Status</th>
                </tr>
              </thead>

              <tbody>
                {contasPagarPeriodo.map(conta => {
                  const status = normalizarTexto(conta.status)

                  return (
                    <tr key={conta.id} className="border-t">
                      <td className="p-4 font-semibold text-gray-800">
                        {conta.descricao || '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {conta.categorias_financeiras?.nome ||
                          'Sem categoria'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {conta.fornecedor || '-'}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatarMoeda(conta.valor)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatarData(conta.data_vencimento)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatarData(conta.data_pagamento)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            status === 'pago'
                              ? 'bg-green-100 text-green-700'
                              : status === 'cancelado'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {conta.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {contasPagarPeriodo.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      Nenhuma conta a pagar encontrada no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'itens'}
          onClose={() => setModalAberto(null)}
          titulo="Itens mais vendidos"
          descricao="Classificação dos itens comercializados nos pedidos válidos do período."
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Tipo de item
              </label>

              <select
                value={filtroItens}
                onChange={event => setFiltroItens(event.target.value)}
                className="border bg-white rounded-xl px-4 py-3 min-w-[220px]"
              >
                <option value="Todos">Todos</option>
                <option value="Produtos">Produtos</option>
                <option value="Kits">Kits</option>
                <option value="Acessórios">Acessórios</option>
                <option value="Embalagens">Embalagens</option>
              </select>
            </div>

            <button
              type="button"
              onClick={exportarItens}
              className="bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          <TabelaRanking
            dados={dadosRankingSelecionado()}
            colunaNome="Item"
            vazio="Nenhum item encontrado para este filtro no período."
          />
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'clientes'}
          onClose={() => setModalAberto(null)}
          titulo="Clientes que mais compraram"
          descricao="Clientes classificados pelo valor comercial dos pedidos válidos do período."
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={exportarClientes}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          {rankingClientes.length === 0 ? (
            <p className="text-gray-500">
              Nenhum cliente com pedido válido neste período.
            </p>
          ) : (
            <div className="max-h-[55vh] overflow-auto border rounded-2xl">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-gray-600">Posição</th>
                    <th className="text-left p-4 text-gray-600">Cliente</th>
                    <th className="text-right p-4 text-gray-600">Pedidos</th>
                    <th className="text-right p-4 text-gray-600">
                      Valor comprado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rankingClientes.map((item, index) => (
                    <tr key={`${item.nome}-${index}`} className="border-t">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4 font-semibold text-gray-800">
                        {item.nome}
                      </td>
                      <td className="p-4 text-right">{item.pedidos}</td>
                      <td className="p-4 text-right">
                        {formatarMoeda(item.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'precos'}
          onClose={() => setModalAberto(null)}
          titulo="Tabela de preços"
          descricao="Relação atual dos produtos e preços cadastrados no ERP."
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={exportarTabelaPrecos}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          <div className="max-h-[55vh] overflow-auto border rounded-2xl">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-gray-600">Produto</th>
                  <th className="text-left p-4 text-gray-600">Categoria</th>
                  <th className="text-right p-4 text-gray-600">Preço</th>
                  <th className="text-right p-4 text-gray-600">Margem desejada</th>
                  <th className="text-center p-4 text-gray-600">Situação</th>
                </tr>
              </thead>

              <tbody>
                {produtos.map(produto => {
                  const precificado = precoAtualProduto(produto) > 0

                  return (
                    <tr key={produto.id} className="border-t">
                      <td className="p-4 font-semibold text-gray-800">
                        {produto.nome}
                      </td>
                      <td className="p-4 text-gray-600">
                        {produto.categoria || '-'}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {precificado
                          ? formatarMoeda(precoAtualProduto(produto))
                          : '-'}
                      </td>
                      <td className="p-4 text-right">
                        {formatarPercentual(
                          produto.margem_lucro ||
                            configuracao?.margem_padrao ||
                            0
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            precificado
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {precificado
                            ? 'Precificado'
                            : 'Aguardando precificação'}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {produtos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'precificacao'}
          onClose={() => setModalAberto(null)}
          titulo="Análise de precificação"
          descricao="Custos, preços, lucros e margens reais dos produtos."
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={exportarAnalisePrecificacao}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          <div className="max-h-[55vh] overflow-auto border rounded-2xl">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-gray-600">Produto</th>
                  <th className="text-right p-4 text-gray-600">Insumos</th>
                  <th className="text-right p-4 text-gray-600">Mão de obra</th>
                  <th className="text-right p-4 text-gray-600">Custo fixo</th>
                  <th className="text-right p-4 text-gray-600">Custo total</th>
                  <th className="text-right p-4 text-gray-600">Preço atual</th>
                  <th className="text-right p-4 text-gray-600">Lucro</th>
                  <th className="text-right p-4 text-gray-600">Margem</th>
                  <th className="text-center p-4 text-gray-600">Status</th>
                </tr>
              </thead>

              <tbody>
                {produtos.map(produto => {
                  const status = statusMargemProduto(produto)

                  return (
                    <tr key={produto.id} className="border-t">
                      <td className="p-4">
                        <p className="font-semibold text-gray-800">
                          {produto.nome}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Tempo: {formatarNumero(produto.tempo_producao || 0)} min
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        {formatarMoeda(custoInsumosProduto(produto))}
                      </td>
                      <td className="p-4 text-right">
                        {formatarMoeda(custoMaoDeObraProduto(produto))}
                      </td>
                      <td className="p-4 text-right">
                        {formatarMoeda(custoFixoProduto(produto))}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatarMoeda(custoTotalProduto(produto))}
                      </td>
                      <td className="p-4 text-right font-semibold text-green-700">
                        {formatarMoeda(precoAtualProduto(produto))}
                      </td>
                      <td className="p-4 text-right">
                        {formatarMoeda(lucroEstimadoProduto(produto))}
                      </td>
                      <td className="p-4 text-right">
                        {formatarPercentual(margemRealProduto(produto))}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`${corStatusMargem(status)} inline-flex px-2.5 py-1 rounded-full text-xs font-medium`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {produtos.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </RelatorioDetalheModal>
      </main>
    </div>
  )
}