import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function DRE() {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtroPeriodo, setFiltroPeriodo] = useState('MesAtual')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  async function carregarMovimentacoes() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('movimentacoes_financeiras')
      .select(`
        id,
        tipo,
        categoria,
        descricao,
        valor,
        data_movimento,
        pedido_id,
        observacoes,
        created_at
      `)
      .order('data_movimento', { ascending: false })

    if (error) {
      console.log(
        'Erro ao carregar movimentações da DRE:',
        error
      )

      alert('Erro ao carregar os dados da DRE.')
      setCarregando(false)
      return
    }

    setMovimentacoes(data || [])
    setCarregando(false)
  }

  useEffect(() => {
    carregarMovimentacoes()
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarPercentual(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  function normalizarTexto(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
  }

  function obterDataMovimento(movimento) {
    const dataBase =
      movimento.data_movimento ||
      movimento.created_at

    if (!dataBase) return null

    if (
      typeof dataBase === 'string' &&
      dataBase.length === 10
    ) {
      return new Date(`${dataBase}T00:00:00`)
    }

    return new Date(dataBase)
  }

  function pertenceAoPeriodo(movimento) {
    const dataMovimento =
      obterDataMovimento(movimento)

    if (
      !dataMovimento ||
      Number.isNaN(dataMovimento.getTime())
    ) {
      return false
    }

    if (filtroPeriodo === 'Todos') {
      return true
    }

    if (filtroPeriodo === 'Personalizado') {
  if (!dataInicial || !dataFinal) {
    return false
  }

  const inicio = new Date(`${dataInicial}T00:00:00`)
  const fim = new Date(`${dataFinal}T23:59:59`)

  return (
    dataMovimento >= inicio &&
    dataMovimento <= fim
  )
}

    const hoje = new Date()
    hoje.setHours(23, 59, 59, 999)

    if (filtroPeriodo === 'MesAtual') {
      return (
        dataMovimento.getMonth() ===
          hoje.getMonth() &&
        dataMovimento.getFullYear() ===
          hoje.getFullYear()
      )
    }

    if (filtroPeriodo === 'MesAnterior') {
      const mesAnterior = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - 1,
        1
      )

      return (
        dataMovimento.getMonth() ===
          mesAnterior.getMonth() &&
        dataMovimento.getFullYear() ===
          mesAnterior.getFullYear()
      )
    }

    if (filtroPeriodo === 'Ultimos30') {
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 29)
      inicio.setHours(0, 0, 0, 0)

      return (
        dataMovimento >= inicio &&
        dataMovimento <= hoje
      )
    }

    return true
  }

  function classificarMovimentacao(movimento) {
    const tipo = normalizarTexto(movimento.tipo)
    const categoria = normalizarTexto(
      movimento.categoria
    )

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

  const movimentacoesFiltradas = useMemo(() => {
  return movimentacoes.filter(
    pertenceAoPeriodo
  )
}, [
  movimentacoes,
  filtroPeriodo,
  dataInicial,
  dataFinal
])

  const grupos = useMemo(() => {
    const totais = {
      receita_bruta: 0,
      deducao_receita: 0,
      custo_produto: 0,
      despesa_operacional: 0,
      outra_receita: 0,
      outra_despesa: 0
    }

    movimentacoesFiltradas.forEach(
      (movimento) => {
        const grupo =
          classificarMovimentacao(movimento)

        totais[grupo] += Number(
          movimento.valor || 0
        )
      }
    )

    return totais
  }, [movimentacoesFiltradas])

  const receitaLiquida =
    grupos.receita_bruta -
    grupos.deducao_receita

  const lucroBruto =
    receitaLiquida -
    grupos.custo_produto

  const resultadoOperacional =
    lucroBruto -
    grupos.despesa_operacional

  const resultadoLiquido =
    resultadoOperacional +
    grupos.outra_receita -
    grupos.outra_despesa

  const margemBruta =
    receitaLiquida > 0
      ? (lucroBruto / receitaLiquida) * 100
      : 0

  const margemLiquida =
    receitaLiquida > 0
      ? (resultadoLiquido / receitaLiquida) * 100
      : 0

  const categoriasDetalhadas = useMemo(() => {
    const agrupadas = {}

    movimentacoesFiltradas.forEach(
      (movimento) => {
        const nome =
          movimento.categoria ||
          'Sem categoria'

        const chave = `${movimento.tipo}-${nome}`

        if (!agrupadas[chave]) {
          agrupadas[chave] = {
            tipo: movimento.tipo,
            categoria: nome,
            grupo:
              classificarMovimentacao(
                movimento
              ),
            valor: 0
          }
        }

        agrupadas[chave].valor += Number(
          movimento.valor || 0
        )
      }
    )

    return Object.values(agrupadas).sort(
      (a, b) => b.valor - a.valor
    )
  }, [movimentacoesFiltradas])

  function nomePeriodo() {
    if (filtroPeriodo === 'MesAtual') {
      return 'Mês atual'
    }

    if (filtroPeriodo === 'MesAnterior') {
      return 'Mês anterior'
    }

    if (filtroPeriodo === 'Ultimos30') {
      return 'Últimos 30 dias'
    }

    if (filtroPeriodo === 'Personalizado') {
  if (!dataInicial || !dataFinal) {
    return 'Período personalizado'
  }

  const inicio = new Date(
    `${dataInicial}T00:00:00`
  ).toLocaleDateString('pt-BR')

  const fim = new Date(
    `${dataFinal}T00:00:00`
  ).toLocaleDateString('pt-BR')

  return `${inicio} até ${fim}`
}

    return 'Todo o período'
  }

  function nomeGrupo(grupo) {
    const nomes = {
      receita_bruta: 'Receita bruta',
      deducao_receita: 'Deduções da receita',
      custo_produto: 'Custos dos produtos',
      despesa_operacional:
        'Despesas operacionais',
      outra_receita: 'Outras receitas',
      outra_despesa: 'Outras despesas'
    }

    return nomes[grupo] || 'Não classificado'
  }

  function LinhaDRE({
    titulo,
    valor,
    destaque = false,
    resultado = false,
    negativo = false
  }) {
    return (
      <div
        className={`
          flex items-center justify-between
          px-5 py-4
          ${
            destaque
              ? 'bg-gray-50 rounded-xl'
              : 'border-b'
          }
        `}
      >
        <span
          className={
            destaque
              ? 'font-bold text-gray-800'
              : 'text-gray-600'
          }
        >
          {titulo}
        </span>

        <strong
          className={`
            ${
              resultado
                ? valor >= 0
                  ? 'text-green-700'
                  : 'text-red-600'
                : negativo
                  ? 'text-red-600'
                  : 'text-gray-800'
            }
            ${destaque ? 'text-lg' : ''}
          `}
        >
          {formatarMoeda(valor)}
        </strong>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              DRE
            </h1>

            <p className="text-gray-500 mt-1">
              Demonstrativo gerencial do resultado da Eternaê.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
  <select
    value={filtroPeriodo}
    onChange={(e) => {
      const novoPeriodo = e.target.value

      setFiltroPeriodo(novoPeriodo)

      if (novoPeriodo !== 'Personalizado') {
        setDataInicial('')
        setDataFinal('')
      }
    }}
    className="border bg-white rounded-xl px-4 py-3"
  >
    <option value="MesAtual">
      Mês atual
    </option>

    <option value="MesAnterior">
      Mês anterior
    </option>

    <option value="Ultimos30">
      Últimos 30 dias
    </option>

    <option value="Personalizado">
      Período personalizado
    </option>

    <option value="Todos">
      Todo o período
    </option>
  </select>

  {filtroPeriodo === 'Personalizado' && (
    <>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Data inicial
        </label>

        <input
          type="date"
          value={dataInicial}
          onChange={(e) =>
            setDataInicial(e.target.value)
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
          onChange={(e) =>
            setDataFinal(e.target.value)
          }
          className="border bg-white rounded-xl px-4 py-3"
        />
      </div>
    </>
  )}
</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Receita líquida
            </p>

            <h2 className="text-2xl font-bold text-green-700 mt-2">
              {formatarMoeda(receitaLiquida)}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Receita bruta menos deduções
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Lucro bruto
            </p>

            <h2
              className={`text-2xl font-bold mt-2 ${
                lucroBruto >= 0
                  ? 'text-green-700'
                  : 'text-red-600'
              }`}
            >
              {formatarMoeda(lucroBruto)}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Margem de{' '}
              {formatarPercentual(margemBruta)}%
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Despesas operacionais
            </p>

            <h2 className="text-2xl font-bold text-red-600 mt-2">
              {formatarMoeda(
                grupos.despesa_operacional
              )}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Custos administrativos do período
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Resultado líquido
            </p>

            <h2
              className={`text-2xl font-bold mt-2 ${
                resultadoLiquido >= 0
                  ? 'text-green-700'
                  : 'text-red-600'
              }`}
            >
              {formatarMoeda(resultadoLiquido)}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Margem de{' '}
              {formatarPercentual(margemLiquida)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Demonstrativo do Resultado
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Período: {nomePeriodo()}
                </p>
              </div>

              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                Regime de caixa
              </span>
            </div>

            {carregando ? (
              <div className="text-center text-gray-400 py-20">
                Carregando DRE...
              </div>
            ) : (
              <div className="space-y-2">
                <LinhaDRE
                  titulo="Receita Bruta"
                  valor={grupos.receita_bruta}
                />

                <LinhaDRE
                  titulo="(-) Deduções da Receita"
                  valor={grupos.deducao_receita}
                  negativo
                />

                <LinhaDRE
                  titulo="Receita Líquida"
                  valor={receitaLiquida}
                  destaque
                  resultado
                />

                <div className="h-2" />

                <LinhaDRE
                  titulo="(-) Custos dos Produtos"
                  valor={grupos.custo_produto}
                  negativo
                />

                <LinhaDRE
                  titulo="Lucro Bruto"
                  valor={lucroBruto}
                  destaque
                  resultado
                />

                <div className="h-2" />

                <LinhaDRE
                  titulo="(-) Despesas Operacionais"
                  valor={
                    grupos.despesa_operacional
                  }
                  negativo
                />

                <LinhaDRE
                  titulo="Resultado Operacional"
                  valor={resultadoOperacional}
                  destaque
                  resultado
                />

                <div className="h-2" />

                <LinhaDRE
                  titulo="(+) Outras Receitas"
                  valor={grupos.outra_receita}
                />

                <LinhaDRE
                  titulo="(-) Outras Despesas"
                  valor={grupos.outra_despesa}
                  negativo
                />

                <div className="mt-4 bg-gray-900 text-white rounded-2xl px-5 py-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">
                      Resultado Líquido do Período
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Margem líquida de{' '}
                      {formatarPercentual(
                        margemLiquida
                      )}
                      %
                    </p>
                  </div>

                  <strong
                    className={`text-2xl ${
                      resultadoLiquido >= 0
                        ? 'text-green-300'
                        : 'text-red-300'
                    }`}
                  >
                    {formatarMoeda(
                      resultadoLiquido
                    )}
                  </strong>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">
              Composição por categoria
            </h2>

            <p className="text-sm text-gray-500 mt-1 mb-5">
              Classificação das movimentações do período.
            </p>

            {carregando ? (
              <p className="text-gray-400 text-sm">
                Carregando categorias...
              </p>
            ) : categoriasDetalhadas.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                Nenhuma movimentação encontrada.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {categoriasDetalhadas.map(
                  (item, index) => (
                    <div
                      key={`${item.categoria}-${index}`}
                      className="border rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item.categoria}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {nomeGrupo(item.grupo)}
                          </p>
                        </div>

                        <strong
                          className={
                            normalizarTexto(
                              item.tipo
                            ) === 'entrada'
                              ? 'text-green-700'
                              : 'text-red-600'
                          }
                        >
                          {normalizarTexto(
                            item.tipo
                          ) === 'entrada'
                            ? '+ '
                            : '- '}
                          {formatarMoeda(item.valor)}
                        </strong>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-bold text-blue-800">
            Sobre esta DRE
          </h3>

          <p className="text-sm text-blue-700 mt-2 leading-relaxed">
            Esta versão considera as entradas recebidas e as
            saídas pagas registradas no Fluxo de Caixa. Na
            próxima evolução, o custo dos produtos vendidos
            poderá ser calculado automaticamente pelas fichas
            técnicas dos pedidos entregues, aproximando o
            demonstrativo do regime de competência.
          </p>
        </div>
      </main>
    </div>
  )
}