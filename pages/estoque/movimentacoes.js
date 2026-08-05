import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

const TIPOS = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' }
]

const MOTIVOS = [
  'Compra',
  'Ajuste de Inventário',
  'Devolução',
  'Outro',
  'Perda',
  'Quebra',
  'Consumo Interno'
]

export default function MovimentacoesEstoque() {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [itensEstoque, setItensEstoque] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')

  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [itemSelecionado, setItemSelecionado] = useState('todos')
  const [tipoSelecionado, setTipoSelecionado] = useState('todos')
  const [motivoSelecionado, setMotivoSelecionado] = useState('todos')
  const [busca, setBusca] = useState('')

  async function carregarDados() {
    setCarregando(true)
    setErroCarregamento('')

    const [
      { data: dadosMovimentacoes, error: erroMovimentacoes },
      { data: dadosEstoque, error: erroEstoque }
    ] = await Promise.all([
      supabase
        .from('movimentacoes_estoque')
        .select(`
          id,
          estoque_id,
          tipo,
          motivo,
          quantidade,
          custo_unitario,
          fornecedor,
          observacao,
          origem,
          saldo_anterior,
          saldo_posterior,
          created_at,
          item:estoque_id (
            id,
            nome,
            unidade,
            categoria_item
          )
        `)
        .order('created_at', { ascending: false }),

      supabase
        .from('estoque')
        .select('id, nome, unidade, ativo')
        .order('nome', { ascending: true })
    ])

    if (erroMovimentacoes) {
      console.log(
        'Erro ao carregar movimentações de estoque:',
        erroMovimentacoes
      )

      setErroCarregamento(
        'Não foi possível carregar o histórico de movimentações.'
      )

      setMovimentacoes([])
      setItensEstoque(dadosEstoque || [])
      setCarregando(false)
      return
    }

    if (erroEstoque) {
      console.log(
        'Erro ao carregar itens do estoque:',
        erroEstoque
      )
    }

    setMovimentacoes(dadosMovimentacoes || [])
    setItensEstoque(dadosEstoque || [])
    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  function obterItem(movimentacao) {
    if (Array.isArray(movimentacao.item)) {
      return movimentacao.item[0] || null
    }

    return movimentacao.item || null
  }

  function dataNoInicioDoDia(data) {
    if (!data) return null

    const [ano, mes, dia] = data.split('-').map(Number)

    return new Date(
      ano,
      mes - 1,
      dia,
      0,
      0,
      0,
      0
    )
  }

  function dataNoFimDoDia(data) {
    if (!data) return null

    const [ano, mes, dia] = data.split('-').map(Number)

    return new Date(
      ano,
      mes - 1,
      dia,
      23,
      59,
      59,
      999
    )
  }

  const movimentacoesFiltradas = useMemo(() => {
    const inicio = dataNoInicioDoDia(dataInicial)
    const fim = dataNoFimDoDia(dataFinal)
    const textoBusca = normalizarTexto(busca)

    return movimentacoes.filter(movimentacao => {
      const item = obterItem(movimentacao)
      const dataMovimentacao = new Date(
        movimentacao.created_at
      )

      if (inicio && dataMovimentacao < inicio) {
        return false
      }

      if (fim && dataMovimentacao > fim) {
        return false
      }

      if (
        itemSelecionado !== 'todos' &&
        String(movimentacao.estoque_id) !==
          String(itemSelecionado)
      ) {
        return false
      }

      if (
        tipoSelecionado !== 'todos' &&
        movimentacao.tipo !== tipoSelecionado
      ) {
        return false
      }

      if (
        motivoSelecionado !== 'todos' &&
        movimentacao.motivo !== motivoSelecionado
      ) {
        return false
      }

      if (textoBusca) {
        const textoMovimentacao = normalizarTexto([
          item?.nome,
          movimentacao.tipo,
          movimentacao.motivo,
          movimentacao.fornecedor,
          movimentacao.observacao,
          movimentacao.origem
        ].join(' '))

        if (!textoMovimentacao.includes(textoBusca)) {
          return false
        }
      }

      return true
    })
  }, [
    movimentacoes,
    dataInicial,
    dataFinal,
    itemSelecionado,
    tipoSelecionado,
    motivoSelecionado,
    busca
  ])

  const totalEntradas = movimentacoesFiltradas.filter(
    movimentacao => movimentacao.tipo === 'entrada'
  ).length

  const totalSaidas = movimentacoesFiltradas.filter(
    movimentacao => movimentacao.tipo === 'saida'
  ).length

  const quantidadeMovimentada =
    movimentacoesFiltradas.reduce(
      (total, movimentacao) =>
        total + Number(movimentacao.quantidade || 0),
      0
    )

  const ultimaMovimentacao =
    movimentacoesFiltradas.length > 0
      ? movimentacoesFiltradas[0]
      : null

  function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      maximumFractionDigits: 3
    })
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarDataHora(valor) {
    if (!valor) return '-'

    return new Date(valor).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  function limparFiltros() {
    setDataInicial('')
    setDataFinal('')
    setItemSelecionado('todos')
    setTipoSelecionado('todos')
    setMotivoSelecionado('todos')
    setBusca('')
  }

  function escaparCSV(valor) {
    const texto = String(
      valor === null || valor === undefined
        ? ''
        : valor
    ).replace(/"/g, '""')

    return `"${texto}"`
  }

  function exportarCSV() {
    if (movimentacoesFiltradas.length === 0) {
      alert(
        'Não existem movimentações nos filtros selecionados.'
      )
      return
    }

    const cabecalho = [
      'Data/Hora',
      'Tipo',
      'Item',
      'Quantidade',
      'Unidade',
      'Saldo Anterior',
      'Saldo Posterior',
      'Variação',
      'Motivo',
      'Custo Unitário',
      'Fornecedor',
      'Observação',
      'Origem'
    ]

    const linhas = movimentacoesFiltradas.map(
      movimentacao => {
        const item = obterItem(movimentacao)

        return [
          formatarDataHora(movimentacao.created_at),
          movimentacao.tipo === 'entrada'
            ? 'Entrada'
            : 'Saída',
          item?.nome || 'Item não localizado',
          formatarNumero(movimentacao.quantidade),
          item?.unidade || '',
          formatarNumero(movimentacao.saldo_anterior),
          formatarNumero(movimentacao.saldo_posterior),
          movimentacao.tipo === 'entrada'
            ? `+${formatarNumero(movimentacao.quantidade)}`
            : `-${formatarNumero(movimentacao.quantidade)}`,
          movimentacao.motivo || '',
          movimentacao.custo_unitario !== null &&
          movimentacao.custo_unitario !== undefined
            ? formatarMoeda(
                movimentacao.custo_unitario
              )
            : '',
          movimentacao.fornecedor || '',
          movimentacao.observacao || '',
          movimentacao.origem === 'manual'
            ? 'Manual'
            : 'Automática'
        ]
      }
    )

    const conteudo = [
      cabecalho,
      ...linhas
    ]
      .map(linha =>
        linha.map(escaparCSV).join(';')
      )
      .join('\r\n')

    const arquivo = new Blob(
      ['\uFEFF' + conteudo],
      {
        type: 'text/csv;charset=utf-8;'
      }
    )

    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    const hoje = new Date()
      .toISOString()
      .slice(0, 10)

    link.href = url
    link.download =
      `movimentacoes-estoque-${hoje}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  function classeTipo(tipo) {
    if (tipo === 'entrada') {
      return 'bg-green-100 text-green-700'
    }

    return 'bg-red-100 text-red-700'
  }

  function classeMotivo(motivo) {
    if (motivo === 'Compra') {
      return 'bg-green-50 text-green-700'
    }

    if (
      motivo === 'Perda' ||
      motivo === 'Quebra'
    ) {
      return 'bg-red-50 text-red-700'
    }

    if (motivo === 'Consumo Interno') {
      return 'bg-purple-50 text-purple-700'
    }

    if (motivo === 'Devolução') {
      return 'bg-blue-50 text-blue-700'
    }

    if (motivo === 'Ajuste de Inventário') {
      return 'bg-amber-50 text-amber-700'
    }

    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 p-8">

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Histórico de Movimentações
            </h1>

            <p className="mt-1 text-gray-500">
              Consulte entradas e saídas do estoque com rastreabilidade de saldos, motivos e fornecedores.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={carregarDados}
              disabled={carregando}
              className="
                rounded-xl
                border
                border-gray-200
                bg-white
                px-5
                py-3
                font-semibold
                text-gray-700
                transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              ↻ Atualizar
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              className="
                rounded-xl
                bg-gray-900
                px-5
                py-3
                font-semibold
                text-white
                transition
                hover:bg-gray-800
              "
            >
              📊 Exportar CSV
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Total de entradas
            </p>

            <h2 className="mt-2 text-2xl font-bold text-green-700">
              {totalEntradas}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Total de saídas
            </p>

            <h2 className="mt-2 text-2xl font-bold text-red-600">
              {totalSaidas}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Quantidade movimentada
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-800">
              {formatarNumero(quantidadeMovimentada)}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Soma das quantidades filtradas
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Última movimentação
            </p>

            <h2 className="mt-2 text-base font-bold text-gray-800">
              {ultimaMovimentacao ? (
                <>
                  <span
                    className={
                      ultimaMovimentacao.tipo === 'entrada'
                        ? 'text-green-700'
                        : 'text-red-600'
                    }
                  >
                    {ultimaMovimentacao.tipo === 'entrada'
                      ? 'Entrada'
                      : 'Saída'}
                  </span>

                  <span className="mt-1 block text-sm font-semibold text-gray-700">
                    {formatarDataHora(
                      ultimaMovimentacao.created_at
                    )}
                  </span>
                </>
              ) : (
                '-'
              )}
            </h2>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Filtros
              </h2>

              <p className="text-sm text-gray-500">
                Os indicadores, a tabela e o CSV respeitam os filtros selecionados.
              </p>
            </div>

            <button
              type="button"
              onClick={limparFiltros}
              className="
                self-start
                rounded-lg
                px-3
                py-2
                text-sm
                font-semibold
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-gray-800
              "
            >
              Limpar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="movimentacoes-data-inicial"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Data inicial
              </label>

              <input
                id="movimentacoes-data-inicial"
                type="date"
                value={dataInicial}
                onChange={event =>
                  setDataInicial(event.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-gray-700
                  outline-none
                  transition
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                "
              />
            </div>

            <div>
              <label
                htmlFor="movimentacoes-data-final"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Data final
              </label>

              <input
                id="movimentacoes-data-final"
                type="date"
                value={dataFinal}
                onChange={event =>
                  setDataFinal(event.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-gray-700
                  outline-none
                  transition
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                "
              />
            </div>

            <div>
              <label
                htmlFor="movimentacoes-item"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Item
              </label>

              <select
                id="movimentacoes-item"
                value={itemSelecionado}
                onChange={event =>
                  setItemSelecionado(event.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-gray-700
                  outline-none
                  transition
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                "
              >
                <option value="todos">
                  Todos os itens
                </option>

                {itensEstoque.map(item => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nome}
                    {item.ativo === false
                      ? ' (inativo)'
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="movimentacoes-tipo"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Tipo
              </label>

              <select
                id="movimentacoes-tipo"
                value={tipoSelecionado}
                onChange={event =>
                  setTipoSelecionado(event.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-gray-700
                  outline-none
                  transition
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                "
              >
                {TIPOS.map(tipo => (
                  <option
                    key={tipo.value}
                    value={tipo.value}
                  >
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="movimentacoes-motivo"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Motivo
              </label>

              <select
                id="movimentacoes-motivo"
                value={motivoSelecionado}
                onChange={event =>
                  setMotivoSelecionado(event.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-gray-700
                  outline-none
                  transition
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                "
              >
                <option value="todos">
                  Todos os motivos
                </option>

                {MOTIVOS.map(motivo => (
                  <option
                    key={motivo}
                    value={motivo}
                  >
                    {motivo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="movimentacoes-busca"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Pesquisa
              </label>

              <div className="relative">
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                >
                  🔍
                </span>

                <input
                  id="movimentacoes-busca"
                  type="text"
                  value={busca}
                  onChange={event =>
                    setBusca(event.target.value)
                  }
                  placeholder="Item, fornecedor, observação..."
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    py-3
                    pl-11
                    pr-4
                    text-gray-700
                    outline-none
                    transition
                    focus:border-green-500
                    focus:ring-2
                    focus:ring-green-100
                  "
                />
              </div>
            </div>
          </div>
        </div>

        {erroCarregamento && (
          <div
            className="
              mb-6
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-5
              py-4
              text-red-700
            "
          >
            {erroCarregamento}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="max-h-[58vh] overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed text-xs">
              <colgroup>
                <col className="w-[11%]" />
                <col className="w-[7%]" />
                <col className="w-[12%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
                <col className="w-[11%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600">
                    Data/Hora
                  </th>

                  <th className="px-2 py-3 text-center font-semibold text-gray-600">
                    Tipo
                  </th>

                  <th className="px-3 py-3 text-left font-semibold text-gray-600">
                    Item
                  </th>

                  <th className="px-2 py-3 text-right font-semibold text-gray-600">
                    Quantidade
                  </th>

                  <th className="px-2 py-3 text-right font-semibold text-gray-600">
                    Saldo antes
                  </th>

                  <th className="px-2 py-3 text-right font-semibold text-gray-600">
                    Saldo depois
                  </th>

                  <th className="px-2 py-3 text-right font-semibold text-gray-600">
                    Variação
                  </th>

                  <th className="px-3 py-3 text-left font-semibold text-gray-600">
                    Motivo
                  </th>

                  <th className="px-2 py-3 text-right font-semibold text-gray-600">
                    Custo unit.
                  </th>

                  <th className="px-3 py-3 text-left font-semibold text-gray-600">
                    Fornecedor
                  </th>

                  <th className="px-3 py-3 text-left font-semibold text-gray-600">
                    Observação
                  </th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Carregando movimentações...
                    </td>
                  </tr>
                )}

                {!carregando &&
                  movimentacoesFiltradas.map(
                    movimentacao => {
                      const item = obterItem(movimentacao)

                      return (
                        <tr
                          key={movimentacao.id}
                          className="
                            border-t
                            border-gray-100
                            align-top
                            transition
                            hover:bg-gray-50
                          "
                        >
                          <td className="px-3 py-3 text-gray-600">
                            {formatarDataHora(
                              movimentacao.created_at
                            )}
                          </td>

                          <td className="px-2 py-3 text-center">
                            <span
                              className={`
                                inline-flex
                                items-center
                                rounded-full
                                px-2
                                py-1
                                text-[11px]
                                font-semibold
                                ${classeTipo(
                                  movimentacao.tipo
                                )}
                              `}
                            >
                              {movimentacao.tipo ===
                              'entrada'
                                ? '➕ Entrada'
                                : '➖ Saída'}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <p className="break-words font-semibold leading-tight text-gray-800">
                              {item?.nome ||
                                'Item não localizado'}
                            </p>

                            <p className="mt-1 break-words text-[11px] leading-tight text-gray-500">
                              {item?.unidade || '-'}
                            </p>
                          </td>

                          <td className="px-2 py-3 text-right font-semibold text-gray-800">
                            {formatarNumero(
                              movimentacao.quantidade
                            )}
                          </td>

                          <td className="px-2 py-3 text-right text-gray-600">
                            {formatarNumero(
                              movimentacao.saldo_anterior
                            )}
                          </td>

                          <td className="px-2 py-3 text-right font-semibold text-gray-800">
                            {formatarNumero(
                              movimentacao.saldo_posterior
                            )}
                          </td>

                          <td
                            className={`
                              px-2
                              py-3
                              text-right
                              font-bold
                              ${
                                movimentacao.tipo === 'entrada'
                                  ? 'text-green-700'
                                  : 'text-red-600'
                              }
                            `}
                          >
                            {movimentacao.tipo === 'entrada'
                              ? '+'
                              : '-'}
                            {formatarNumero(
                              movimentacao.quantidade
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={`
                                inline-flex
                                rounded-full
                                px-2
                                py-1
                                text-[11px]
                                font-semibold
                                ${classeMotivo(
                                  movimentacao.motivo
                                )}
                              `}
                            >
                              {movimentacao.motivo}
                            </span>
                          </td>

                          <td className="px-2 py-3 text-right text-gray-700">
                            {movimentacao.custo_unitario !==
                              null &&
                            movimentacao.custo_unitario !==
                              undefined
                              ? formatarMoeda(
                                  movimentacao.custo_unitario
                                )
                              : '-'}
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            <span className="break-words leading-tight">
                              {movimentacao.fornecedor || '-'}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-gray-600">
                            <p
                              className="
                                whitespace-pre-wrap
                                break-words
                                leading-tight
                              "
                              title={
                                movimentacao.observacao ||
                                ''
                              }
                            >
                              {movimentacao.observacao || '-'}
                            </p>
                          </td>
                        </tr>
                      )
                    }
                  )}

                {!carregando &&
                  movimentacoesFiltradas.length === 0 && (
                    <tr>
                      <td
                        colSpan="11"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Nenhuma movimentação encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {!carregando && (
            <div
              className="
                flex
                flex-col
                gap-2
                border-t
                border-gray-100
                bg-gray-50
                px-5
                py-4
                text-sm
                text-gray-500
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <span>
                {movimentacoesFiltradas.length}{' '}
                {movimentacoesFiltradas.length === 1
                  ? 'movimentação encontrada'
                  : 'movimentações encontradas'}
              </span>

              <span>
                Histórico somente para consulta e auditoria.
              </span>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}