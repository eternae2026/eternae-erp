import { useEffect, useState } from 'react'
import ReceberPagamentoModal from '../../components/ReceberPagamentoModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function ContasReceber() {
  const [lancamentos, setLancamentos] = useState([])
  const [lancamentoSelecionado, setLancamentoSelecionado] =
    useState(null)

  const [openModal, setOpenModal] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('Todos')

  async function carregarLancamentos() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('financeiro')
      .select(`
        *,
        clientes (
          nome
        ),
        pedidos (
          id,
          etapa_producao
        )
      `)
      .order('data_vencimento', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.log(
        'Erro ao carregar contas a receber:',
        error
      )

      alert('Erro ao carregar as contas a receber.')
      setCarregando(false)
      return
    }

    setLancamentos(data || [])
    setCarregando(false)
  }

  useEffect(() => {
    carregarLancamentos()
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '-'

    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString('pt-BR')
  }

  function dataSemHorario(data) {
    const novaData = new Date(data)
    novaData.setHours(0, 0, 0, 0)

    return novaData
  }

  function statusNormalizado(status) {
    return String(status || '').toLowerCase()
  }

  function analisarStatus(lancamento) {
    const status = statusNormalizado(lancamento.status)

    if (status === 'recebido') {
      return {
        texto: 'Recebido',
        classe: 'bg-green-100 text-green-700'
      }
    }

    if (status === 'cancelado') {
      return {
        texto: 'Cancelado',
        classe: 'bg-gray-100 text-gray-600'
      }
    }

    if (!lancamento.data_vencimento) {
      return {
        texto: 'Pendente',
        classe: 'bg-yellow-100 text-yellow-700'
      }
    }

    const hoje = dataSemHorario(new Date())

    const vencimento = dataSemHorario(
      `${lancamento.data_vencimento}T00:00:00`
    )

    if (vencimento < hoje) {
      return {
        texto: 'Atrasado',
        classe: 'bg-red-100 text-red-700'
      }
    }

    if (vencimento.getTime() === hoje.getTime()) {
      return {
        texto: 'Vence hoje',
        classe: 'bg-orange-100 text-orange-700'
      }
    }

    return {
      texto: 'Pendente',
      classe: 'bg-yellow-100 text-yellow-700'
    }
  }

  function abrirRecebimento(lancamento) {
    setLancamentoSelecionado(lancamento)
    setOpenModal(true)
  }

  async function confirmarRecebimento(dados) {
    if (!lancamentoSelecionado) return

    const pedidoId = lancamentoSelecionado.pedido_id

    const { data, error } = await supabase
      .from('financeiro')
      .update({
        forma_pagamento: dados.forma_pagamento,
        data_pagamento: dados.data_pagamento,
        observacoes: dados.observacoes || null,
        status: 'Recebido'
      })
      .eq('id', lancamentoSelecionado.id)
      .select(`
        *,
        clientes (
          nome
        ),
        pedidos (
          id,
          etapa_producao
        )
      `)

    if (error) {
      console.log(
        'Erro ao confirmar recebimento:',
        error
      )

      alert('Erro ao confirmar o recebimento.')
      return
    }

    const lancamentoAtualizado = data?.[0]

    if (pedidoId) {
      const { error: erroPedido } = await supabase
        .from('pedidos')
        .update({
          etapa_producao: 'Arte'
        })
        .eq('id', pedidoId)

      if (erroPedido) {
        console.log(
          'Erro ao encaminhar pedido para Arte:',
          erroPedido
        )

        alert(
          'O pagamento foi recebido, mas houve erro ao encaminhar o pedido para Arte.'
        )

        await carregarLancamentos()
        return
      }

      const { error: erroTimeline } = await supabase
        .from('pedido_timeline')
        .insert([
          {
            pedido_id: pedidoId,
            titulo: 'Pagamento confirmado',
            descricao:
              'Recebimento confirmado. O pedido foi encaminhado automaticamente para a etapa de Arte.',
            tipo: 'sucesso'
          }
        ])

      if (erroTimeline) {
        console.log(
          'Erro ao registrar evento na timeline:',
          erroTimeline
        )
      }
    }

    const { error: erroMovimentacao } = await supabase
      .from('movimentacoes_financeiras')
      .insert([
        {
          tipo: 'Entrada',
          categoria: 'Venda',
          descricao: `Venda para ${
            lancamentoAtualizado?.clientes?.nome ||
            lancamentoSelecionado.clientes?.nome ||
            'Cliente'
          }`,
          valor: Number(
            lancamentoSelecionado.valor || 0
          ),
          forma_pagamento:
            dados.forma_pagamento ||
            lancamentoSelecionado.forma_pagamento ||
            null,
          data_movimento:
            dados.data_pagamento ||
            new Date().toISOString().slice(0, 10),
          pedido_id: pedidoId || null,
          observacoes: dados.observacoes || null
        }
      ])

    if (erroMovimentacao) {
      console.log(
        'Erro ao registrar entrada no fluxo de caixa:',
        erroMovimentacao
      )

      alert(
        'O pagamento foi confirmado, mas houve erro ao registrar a entrada no Fluxo de Caixa.'
      )

      await carregarLancamentos()
      setOpenModal(false)
      setLancamentoSelecionado(null)
      return
    }

    await carregarLancamentos()

    setOpenModal(false)
    setLancamentoSelecionado(null)

    alert(
      pedidoId
        ? 'Pagamento confirmado, pedido encaminhado para Arte e entrada registrada no Fluxo de Caixa!'
        : 'Pagamento confirmado e entrada registrada no Fluxo de Caixa!'
    )
  }

  async function cancelarCobranca(lancamento) {
    const confirmar = window.confirm(
      `Deseja cancelar a cobrança de ${
        lancamento.clientes?.nome || 'Cliente'
      } no valor de ${formatarMoeda(lancamento.valor)}?`
    )

    if (!confirmar) return

    const { error } = await supabase
      .from('financeiro')
      .update({
        status: 'Cancelado'
      })
      .eq('id', lancamento.id)

    if (error) {
      console.log(
        'Erro ao cancelar cobrança:',
        error
      )

      alert('Erro ao cancelar a cobrança.')
      return
    }

    await carregarLancamentos()
  }

  const lancamentosFiltrados = lancamentos.filter(
    (lancamento) => {
      if (filtroStatus === 'Todos') {
        return true
      }

      return (
        statusNormalizado(lancamento.status) ===
        statusNormalizado(filtroStatus)
      )
    }
  )

  const pendentes = lancamentos.filter(
    (lancamento) =>
      statusNormalizado(lancamento.status) === 'pendente'
  )

  const recebidos = lancamentos.filter(
    (lancamento) =>
      statusNormalizado(lancamento.status) === 'recebido'
  )

  const hoje = dataSemHorario(new Date())

  const totalAReceber = pendentes.reduce(
    (total, lancamento) =>
      total + Number(lancamento.valor || 0),
    0
  )

  const recebidoNoMes = recebidos
    .filter((lancamento) => {
      if (!lancamento.data_pagamento) return false

      const dataPagamento = new Date(
        `${lancamento.data_pagamento}T00:00:00`
      )

      return (
        dataPagamento.getMonth() === hoje.getMonth() &&
        dataPagamento.getFullYear() === hoje.getFullYear()
      )
    })
    .reduce(
      (total, lancamento) =>
        total + Number(lancamento.valor || 0),
      0
    )

  const vencendoHoje = pendentes
    .filter((lancamento) => {
      if (!lancamento.data_vencimento) return false

      const vencimento = dataSemHorario(
        `${lancamento.data_vencimento}T00:00:00`
      )

      return vencimento.getTime() === hoje.getTime()
    })
    .reduce(
      (total, lancamento) =>
        total + Number(lancamento.valor || 0),
      0
    )

  const atrasados = pendentes
    .filter((lancamento) => {
      if (!lancamento.data_vencimento) return false

      const vencimento = dataSemHorario(
        `${lancamento.data_vencimento}T00:00:00`
      )

      return vencimento < hoje
    })
    .reduce(
      (total, lancamento) =>
        total + Number(lancamento.valor || 0),
      0
    )

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Contas a Receber
            </h1>

            <p className="text-gray-500">
              Controle de recebimentos e cobranças dos pedidos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Total a receber
            </p>

            <h2 className="text-2xl font-bold text-yellow-600 mt-2">
              {formatarMoeda(totalAReceber)}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {pendentes.length} cobrança(s) pendente(s)
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Recebido no mês
            </p>

            <h2 className="text-2xl font-bold text-green-600 mt-2">
              {formatarMoeda(recebidoNoMes)}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Vencendo hoje
            </p>

            <h2 className="text-2xl font-bold text-orange-600 mt-2">
              {formatarMoeda(vencendoHoje)}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Atrasados
            </p>

            <h2 className="text-2xl font-bold text-red-600 mt-2">
              {formatarMoeda(atrasados)}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(e.target.value)
            }
            className="border rounded-xl px-4 py-2 bg-white"
          >
            <option value="Todos">
              Todos os status
            </option>

            <option value="Pendente">
              Pendentes
            </option>

            <option value="Recebido">
              Recebidos
            </option>

            <option value="Cancelado">
              Cancelados
            </option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">
                    Cliente
                  </th>

                  <th className="text-left p-4">
                    Pedido
                  </th>

                  <th className="text-left p-4">
                    Valor
                  </th>

                  <th className="text-left p-4">
                    Forma de pagamento
                  </th>

                  <th className="text-left p-4">
                    Vencimento
                  </th>

                  <th className="text-left p-4">
                    Status
                  </th>

                  <th className="text-left p-4">
                    Ações
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
                      Carregando cobranças...
                    </td>
                  </tr>
                ) : lancamentosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-gray-400 py-20"
                    >
                      Nenhuma cobrança encontrada.
                    </td>
                  </tr>
                ) : (
                  lancamentosFiltrados.map((lancamento) => {
                    const situacao =
                      analisarStatus(lancamento)

                    return (
                      <tr
                        key={lancamento.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <p className="font-semibold text-gray-800">
                            {lancamento.clientes?.nome ||
                              'Cliente não informado'}
                          </p>

                          {lancamento.observacoes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {lancamento.observacoes}
                            </p>
                          )}
                        </td>

                        <td className="p-4 text-gray-600">
                          {lancamento.pedido_id
                            ? `#${lancamento.pedido_id.slice(0, 8)}`
                            : '-'}
                        </td>

                        <td className="p-4 font-semibold text-gray-800">
                          {formatarMoeda(lancamento.valor)}
                        </td>

                        <td className="p-4 text-gray-600">
                          {lancamento.forma_pagamento || '-'}
                        </td>

                        <td className="p-4 text-gray-600">
                          {formatarData(
                            lancamento.data_vencimento
                          )}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${situacao.classe}`}
                          >
                            {situacao.texto}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {statusNormalizado(
                              lancamento.status
                            ) === 'pendente' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirRecebimento(
                                      lancamento
                                    )
                                  }
                                  className="bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 text-sm"
                                >
                                  Receber
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    cancelarCobranca(
                                      lancamento
                                    )
                                  }
                                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}

                            {statusNormalizado(
                              lancamento.status
                            ) === 'recebido' && (
                              <span className="text-sm text-green-700 font-medium">
                                Pago em{' '}
                                {formatarData(
                                  lancamento.data_pagamento
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ReceberPagamentoModal
          open={openModal}
          onClose={() => {
            setOpenModal(false)
            setLancamentoSelecionado(null)
          }}
          onConfirmar={confirmarRecebimento}
          lancamento={lancamentoSelecionado}
        />
      </main>
    </div>
  )
}