import { useEffect, useMemo, useState } from 'react'
import SaidaFinanceiraModal from '../../components/SaidaFinanceiraModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function FluxoCaixa() {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [contasReceber, setContasReceber] = useState([])
  const [contasPagar, setContasPagar] = useState([])

  const [openSaidaModal, setOpenSaidaModal] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const [filtroPeriodo, setFiltroPeriodo] =
    useState('MesAtual')

  const [filtroTipo, setFiltroTipo] =
    useState('Todos')

  const [filtroCategoria, setFiltroCategoria] =
    useState('Todas')

  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  async function carregarMovimentacoes() {
    const { data, error } = await supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .order('data_movimento', {
        ascending: false
      })
      .order('created_at', {
        ascending: false
      })

    if (error) {
      console.log(
        'Erro ao carregar movimentações:',
        error
      )

      alert('Erro ao carregar o Fluxo de Caixa.')
      return
    }

    setMovimentacoes(data || [])
  }

  async function carregarContasReceber() {
    const { data, error } = await supabase
      .from('financeiro')
      .select(`
        id,
        valor,
        status,
        data_vencimento
      `)

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
        valor,
        status,
        data_vencimento
      `)

    if (error) {
      console.log(
        'Erro ao carregar contas a pagar:',
        error
      )
      return
    }

    setContasPagar(data || [])
  }

  async function carregarDados() {
    setCarregando(true)

    await Promise.all([
      carregarMovimentacoes(),
      carregarContasReceber(),
      carregarContasPagar()
    ])

    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    )
  }

  function formatarData(data) {
    if (!data) return '-'

    const textoData = String(data)

    if (textoData.length === 10) {
      return new Date(
        `${textoData}T00:00:00`
      ).toLocaleDateString('pt-BR')
    }

    return new Date(textoData).toLocaleDateString(
      'pt-BR'
    )
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

    const textoData = String(dataBase)

    if (textoData.length === 10) {
      return new Date(`${textoData}T00:00:00`)
    }

    return new Date(textoData)
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

      const inicio = new Date(
        `${dataInicial}T00:00:00`
      )

      const fim = new Date(
        `${dataFinal}T23:59:59`
      )

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

  async function salvarSaida(dados) {
    const { error } = await supabase
      .from('movimentacoes_financeiras')
      .insert([
        {
          tipo: 'Saída',
          categoria:
            dados.categoria || 'Outros',
          descricao: dados.descricao,
          valor: Number(dados.valor || 0),
          forma_pagamento:
            dados.forma_pagamento || null,
          data_movimento:
            dados.data_saida ||
            new Date()
              .toISOString()
              .slice(0, 10),
          pedido_id: null,
          observacoes:
            dados.observacoes || null
        }
      ])

    if (error) {
      console.log(
        'Erro ao salvar saída financeira:',
        error
      )

      alert('Erro ao salvar a saída.')
      return false
    }

    await carregarMovimentacoes()
    setOpenSaidaModal(false)

    return true
  }

  const categorias = useMemo(() => {
    const nomes = movimentacoes
      .map(
        (movimento) =>
          movimento.categoria ||
          'Sem categoria'
      )
      .filter(Boolean)

    return [...new Set(nomes)].sort(
      (a, b) =>
        a.localeCompare(b, 'pt-BR')
    )
  }, [movimentacoes])

  const movimentosFiltrados = useMemo(() => {
    return movimentacoes
      .filter((movimento) => {
        const periodoValido =
          pertenceAoPeriodo(movimento)

        const tipoValido =
          filtroTipo === 'Todos' ||
          normalizarTexto(movimento.tipo) ===
            normalizarTexto(filtroTipo)

        const categoriaMovimento =
          movimento.categoria ||
          'Sem categoria'

        const categoriaValida =
          filtroCategoria === 'Todas' ||
          categoriaMovimento ===
            filtroCategoria

        return (
          periodoValido &&
          tipoValido &&
          categoriaValida
        )
      })
      .sort((a, b) => {
        const dataA =
          obterDataMovimento(a)?.getTime() || 0

        const dataB =
          obterDataMovimento(b)?.getTime() || 0

        return dataB - dataA
      })
  }, [
    movimentacoes,
    filtroPeriodo,
    filtroTipo,
    filtroCategoria,
    dataInicial,
    dataFinal
  ])

  const entradasPeriodo =
    movimentosFiltrados
      .filter(
        (movimento) =>
          normalizarTexto(movimento.tipo) ===
          'entrada'
      )
      .reduce(
        (total, movimento) =>
          total +
          Number(movimento.valor || 0),
        0
      )

  const saidasPeriodo =
    movimentosFiltrados
      .filter(
        (movimento) =>
          normalizarTexto(movimento.tipo) ===
          'saida'
      )
      .reduce(
        (total, movimento) =>
          total +
          Number(movimento.valor || 0),
        0
      )

  const totalEntradasAcumulado =
    movimentacoes
      .filter(
        (movimento) =>
          normalizarTexto(movimento.tipo) ===
          'entrada'
      )
      .reduce(
        (total, movimento) =>
          total +
          Number(movimento.valor || 0),
        0
      )

  const totalSaidasAcumulado =
    movimentacoes
      .filter(
        (movimento) =>
          normalizarTexto(movimento.tipo) ===
          'saida'
      )
      .reduce(
        (total, movimento) =>
          total +
          Number(movimento.valor || 0),
        0
      )

  const saldoAtual =
    totalEntradasAcumulado -
    totalSaidasAcumulado

  const totalAReceber = contasReceber
    .filter(
      (conta) =>
        normalizarTexto(conta.status) ===
        'pendente'
    )
    .reduce(
      (total, conta) =>
        total + Number(conta.valor || 0),
      0
    )

  const totalAPagar = contasPagar
    .filter(
      (conta) =>
        normalizarTexto(conta.status) ===
        'pendente'
    )
    .reduce(
      (total, conta) =>
        total + Number(conta.valor || 0),
      0
    )

  const saldoProjetado =
    saldoAtual +
    totalAReceber -
    totalAPagar

  function nomePeriodoSelecionado() {
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

      return `${formatarData(
        dataInicial
      )} até ${formatarData(dataFinal)}`
    }

    return 'Todo o período'
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 min-w-0 p-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Fluxo de Caixa
            </h1>

            <p className="text-gray-500 mt-1">
              Acompanhe as entradas, saídas e a
              projeção financeira da Eternaê.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setOpenSaidaModal(true)
            }
            className="self-start bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition"
          >
            + Nova Saída
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Entradas do período
            </p>

            <h2 className="text-2xl font-bold text-green-700 mt-2">
              {formatarMoeda(
                entradasPeriodo
              )}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              {nomePeriodoSelecionado()}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Saídas do período
            </p>

            <h2 className="text-2xl font-bold text-red-600 mt-2">
              {formatarMoeda(saidasPeriodo)}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              {nomePeriodoSelecionado()}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Saldo atual
            </p>

            <h2
              className={`text-2xl font-bold mt-2 ${
                saldoAtual >= 0
                  ? 'text-green-700'
                  : 'text-red-600'
              }`}
            >
              {formatarMoeda(saldoAtual)}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Total recebido menos total pago
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Saldo projetado
            </p>

            <h2
              className={`text-2xl font-bold mt-2 ${
                saldoProjetado >= 0
                  ? 'text-blue-700'
                  : 'text-red-600'
              }`}
            >
              {formatarMoeda(
                saldoProjetado
              )}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Saldo + receber − pagar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
            <p className="text-sm text-green-700">
              Contas a receber pendentes
            </p>

            <p className="text-xl font-bold text-green-800 mt-1">
              + {formatarMoeda(totalAReceber)}
            </p>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <p className="text-sm text-red-700">
              Contas a pagar pendentes
            </p>

            <p className="text-xl font-bold text-red-700 mt-1">
              − {formatarMoeda(totalAPagar)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Período
              </label>

              <select
                value={filtroPeriodo}
                onChange={(e) => {
                  const novoPeriodo =
                    e.target.value

                  setFiltroPeriodo(
                    novoPeriodo
                  )

                  if (
                    novoPeriodo !==
                    'Personalizado'
                  ) {
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
            </div>

            {filtroPeriodo ===
              'Personalizado' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Data inicial
                  </label>

                  <input
                    type="date"
                    value={dataInicial}
                    onChange={(e) =>
                      setDataInicial(
                        e.target.value
                      )
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
                    min={
                      dataInicial ||
                      undefined
                    }
                    onChange={(e) =>
                      setDataFinal(
                        e.target.value
                      )
                    }
                    className="border bg-white rounded-xl px-4 py-3"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Tipo
              </label>

              <select
                value={filtroTipo}
                onChange={(e) =>
                  setFiltroTipo(e.target.value)
                }
                className="border bg-white rounded-xl px-4 py-3"
              >
                <option value="Todos">
                  Entradas e saídas
                </option>

                <option value="Entrada">
                  Somente entradas
                </option>

                <option value="Saída">
                  Somente saídas
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Categoria
              </label>

              <select
                value={filtroCategoria}
                onChange={(e) =>
                  setFiltroCategoria(
                    e.target.value
                  )
                }
                className="border bg-white rounded-xl px-4 py-3"
              >
                <option value="Todas">
                  Todas as categorias
                </option>

                {categorias.map(
                  (categoria) => (
                    <option
                      key={categoria}
                      value={categoria}
                    >
                      {categoria}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">
                Movimentações
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {movimentosFiltrados.length}{' '}
                movimentação(ões) encontrada(s)
              </p>
            </div>

            <span className="text-xs text-gray-500">
              {nomePeriodoSelecionado()}
            </span>
          </div>

          {/* Barra de rolagem interna da tabela */}
          <div className="max-h-[430px] overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-5 py-4 text-sm text-gray-600">
                    Data
                  </th>

                  <th className="text-left px-5 py-4 text-sm text-gray-600">
                    Tipo
                  </th>

                  <th className="text-left px-5 py-4 text-sm text-gray-600">
                    Descrição
                  </th>

                  <th className="text-left px-5 py-4 text-sm text-gray-600">
                    Categoria
                  </th>

                  <th className="text-left px-5 py-4 text-sm text-gray-600">
                    Forma de pagamento
                  </th>

                  <th className="text-right px-5 py-4 text-sm text-gray-600">
                    Valor
                  </th>

                  <th className="text-left px-5 py-4 text-sm text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-gray-400 py-20"
                    >
                      Carregando movimentações...
                    </td>
                  </tr>
                ) : movimentosFiltrados.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-gray-400 py-20"
                    >
                      Nenhuma movimentação encontrada
                      para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  movimentosFiltrados.map(
                    (movimento) => {
                      const ehEntrada =
                        normalizarTexto(
                          movimento.tipo
                        ) === 'entrada'

                      return (
                        <tr
                          key={movimento.id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 text-gray-600">
                            {formatarData(
                              movimento.data_movimento ||
                                movimento.created_at
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                ehEntrada
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {ehEntrada
                                ? 'Entrada'
                                : 'Saída'}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-800">
                              {movimento.descricao ||
                                '-'}
                            </p>

                            {movimento.observacoes && (
                              <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                {
                                  movimento.observacoes
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {movimento.categoria ||
                              'Sem categoria'}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {movimento.forma_pagamento ||
                              '-'}
                          </td>

                          <td
                            className={`px-5 py-4 text-right font-bold ${
                              ehEntrada
                                ? 'text-green-700'
                                : 'text-red-600'
                            }`}
                          >
                            {ehEntrada ? '+' : '−'}{' '}
                            {formatarMoeda(
                              movimento.valor
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                ehEntrada
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {ehEntrada
                                ? 'Recebido'
                                : 'Pago'}
                            </span>
                          </td>
                        </tr>
                      )
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <SaidaFinanceiraModal
          open={openSaidaModal}
          onClose={() =>
            setOpenSaidaModal(false)
          }
          onSalvar={salvarSaida}
        />
      </main>
    </div>
  )
}