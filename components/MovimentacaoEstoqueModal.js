import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const MOTIVOS_ENTRADA = [
  'Compra',
  'Ajuste de Inventário',
  'Devolução',
  'Outro'
]

const MOTIVOS_SAIDA = [
  'Perda',
  'Quebra',
  'Consumo Interno',
  'Ajuste de Inventário',
  'Outro'
]

export default function MovimentacaoEstoqueModal({
  open,
  onClose,
  itensEstoque = [],
  onSuccess
}) {
  const [tipo, setTipo] = useState('entrada')
  const [estoqueId, setEstoqueId] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('Compra')
  const [custoUnitario, setCustoUnitario] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const itensAtivos = useMemo(() => {
    return [...itensEstoque]
      .filter(item => item.ativo !== false)
      .sort((a, b) =>
        String(a.nome || '').localeCompare(
          String(b.nome || ''),
          'pt-BR'
        )
      )
  }, [itensEstoque])

  const itemSelecionado = useMemo(() => {
    return itensAtivos.find(
      item => String(item.id) === String(estoqueId)
    ) || null
  }, [itensAtivos, estoqueId])

  const motivosDisponiveis =
    tipo === 'entrada'
      ? MOTIVOS_ENTRADA
      : MOTIVOS_SAIDA

  useEffect(() => {
    if (!open) return

    setTipo('entrada')
    setEstoqueId('')
    setQuantidade('')
    setMotivo('Compra')
    setCustoUnitario('')
    setFornecedor('')
    setObservacao('')
    setSalvando(false)
  }, [open])

  useEffect(() => {
    if (tipo === 'entrada') {
      setMotivo('Compra')
      return
    }

    setMotivo('Perda')
    setCustoUnitario('')
    setFornecedor('')
  }, [tipo])

  useEffect(() => {
    if (!itemSelecionado || tipo !== 'entrada') return

    setCustoUnitario(
      itemSelecionado.custo_unitario !== null &&
      itemSelecionado.custo_unitario !== undefined
        ? String(itemSelecionado.custo_unitario)
        : ''
    )

    setFornecedor(itemSelecionado.fornecedor || '')
  }, [itemSelecionado, tipo])

  function numeroDoCampo(valor) {
    if (valor === null || valor === undefined || valor === '') {
      return null
    }

    const texto = String(valor)
      .trim()
      .replace(/\s/g, '')
      .replace(',', '.')

    const numero = Number(texto)

    return Number.isFinite(numero)
      ? numero
      : null
  }

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

  function fecharModal() {
    if (salvando) return
    onClose()
  }

  async function salvarMovimentacao(event) {
    event.preventDefault()

    if (!estoqueId) {
      alert('Selecione um item do estoque.')
      return
    }

    const quantidadeNumerica = numeroDoCampo(quantidade)

    if (
      quantidadeNumerica === null ||
      quantidadeNumerica <= 0
    ) {
      alert('Informe uma quantidade maior que zero.')
      return
    }

    if (!motivo.trim()) {
      alert('Selecione o motivo da movimentação.')
      return
    }

    const custoNumerico =
      tipo === 'entrada'
        ? numeroDoCampo(custoUnitario)
        : null

    if (
      tipo === 'entrada' &&
      custoUnitario !== '' &&
      custoNumerico === null
    ) {
      alert('Informe um custo unitário válido.')
      return
    }

    if (
      tipo === 'entrada' &&
      custoNumerico !== null &&
      custoNumerico < 0
    ) {
      alert('O custo unitário não pode ser negativo.')
      return
    }

    const saldoDisponivel = Number(
      itemSelecionado?.quantidade_disponivel || 0
    )

    if (
      tipo === 'saida' &&
      quantidadeNumerica > saldoDisponivel
    ) {
      alert(
        `Saldo insuficiente.\n\n` +
        `Disponível: ${formatarNumero(saldoDisponivel)}\n` +
        `Saída solicitada: ${formatarNumero(quantidadeNumerica)}`
      )
      return
    }

    setSalvando(true)

    const { error } = await supabase.rpc(
      'registrar_movimentacao_estoque',
      {
        p_estoque_id: estoqueId,
        p_tipo: tipo,
        p_quantidade: quantidadeNumerica,
        p_motivo: motivo.trim(),
        p_custo_unitario:
          tipo === 'entrada'
            ? custoNumerico
            : null,
        p_fornecedor:
          tipo === 'entrada' && fornecedor.trim()
            ? fornecedor.trim()
            : null,
        p_observacao:
          observacao.trim()
            ? observacao.trim()
            : null
      }
    )

    if (error) {
      console.log(
        'Erro ao registrar movimentação de estoque:',
        error
      )

      const mensagem =
        error.message ||
        'Não foi possível registrar a movimentação.'

      alert(`Erro ao registrar movimentação.\n\n${mensagem}`)
      setSalvando(false)
      return
    }

    alert(
      tipo === 'entrada'
        ? 'Entrada de estoque registrada com sucesso!'
        : 'Saída de estoque registrada com sucesso!'
    )

    setSalvando(false)

    if (onSuccess) {
      await onSuccess()
    }

    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          fecharModal()
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Movimentação de Estoque
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Registre entradas e saídas manuais sem alterar as baixas automáticas do sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModal}
            disabled={salvando}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
            title="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={salvarMovimentacao}>
          <div className="space-y-6 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Tipo de movimentação *
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    tipo === 'entrada'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ➕ Entrada
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('saida')}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    tipo === 'saida'
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ➖ Saída
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="movimentacao-estoque-item"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Item *
              </label>

              <select
                id="movimentacao-estoque-item"
                value={estoqueId}
                onChange={(event) =>
                  setEstoqueId(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  Selecione um item
                </option>

                {itensAtivos.map(item => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nome}
                  </option>
                ))}
              </select>
            </div>

            {itemSelecionado && (
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">
                    Disponível
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {formatarNumero(
                      itemSelecionado.quantidade_disponivel
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Unidade
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {itemSelecionado.unidade || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Custo atual
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {formatarMoeda(
                      itemSelecionado.custo_unitario
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="movimentacao-estoque-quantidade"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Quantidade *
                </label>

                <input
                  id="movimentacao-estoque-quantidade"
                  type="text"
                  inputMode="decimal"
                  value={quantidade}
                  onChange={(event) =>
                    setQuantidade(event.target.value)
                  }
                  placeholder="Ex.: 10"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="movimentacao-estoque-motivo"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Motivo *
                </label>

                <select
                  id="movimentacao-estoque-motivo"
                  value={motivo}
                  onChange={(event) =>
                    setMotivo(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  {motivosDisponiveis.map(opcao => (
                    <option
                      key={opcao}
                      value={opcao}
                    >
                      {opcao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {tipo === 'entrada' && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="movimentacao-estoque-custo"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Custo unitário
                  </label>

                  <input
                    id="movimentacao-estoque-custo"
                    type="text"
                    inputMode="decimal"
                    value={custoUnitario}
                    onChange={(event) =>
                      setCustoUnitario(event.target.value)
                    }
                    placeholder="Ex.: 12,50"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Quando informado, atualiza o custo do cadastro.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="movimentacao-estoque-fornecedor"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Fornecedor
                  </label>

                  <input
                    id="movimentacao-estoque-fornecedor"
                    type="text"
                    value={fornecedor}
                    onChange={(event) =>
                      setFornecedor(event.target.value)
                    }
                    placeholder="Nome do fornecedor"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Quando informado, atualiza o fornecedor do item.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="movimentacao-estoque-observacao"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Observação
              </label>

              <textarea
                id="movimentacao-estoque-observacao"
                rows="4"
                value={observacao}
                onChange={(event) =>
                  setObservacao(event.target.value)
                }
                placeholder={
                  motivo === 'Outro'
                    ? 'Descreva o motivo da movimentação...'
                    : 'Informações complementares...'
                }
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {tipo === 'saida' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                A saída manual reduzirá somente a quantidade disponível. Ela não substitui nem altera as baixas automáticas de Produção, Kits ou Embalagens.
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <button
              type="button"
              onClick={fecharModal}
              disabled={salvando}
              className="rounded-xl border border-gray-200 px-5 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className={`rounded-xl px-5 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                tipo === 'entrada'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {salvando
                ? 'Salvando...'
                : tipo === 'entrada'
                  ? 'Registrar entrada'
                  : 'Registrar saída'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}