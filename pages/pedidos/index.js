import { useEffect, useState } from 'react'
import PedidoDetalhesModal from '../../components/PedidoDetalhesModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [openDetalhes, setOpenDetalhes] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null)

  const statusPedidos = [
    'Novo Pedido',
    'Aguardando Pagamento',
    'Arte / Aprovação',
    'Produção'
  ]

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
        ),
        orcamentos (
          id,
          observacoes,
          orcamento_itens (
            id,
            quantidade,
            valor_unitario,
            subtotal,
            produtos (
              nome
            )
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar pedidos:', error)
      return
    }

    setPedidos(data || [])
  }

  useEffect(() => {
    carregarPedidos()
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function calcularTotalPedido(pedido) {
    const itens = pedido.orcamentos?.orcamento_itens || []

    if (itens.length === 0) {
      return Number(pedido.valor || 0)
    }

    return itens.reduce((total, item) => {
      return total + Number(item.subtotal || 0)
    }, 0)
  }

  function pedidosPorStatus(status) {
    return pedidos.filter(pedido => pedido.status === status)
  }

  function indiceStatus(status) {
    return statusPedidos.indexOf(status)
  }

  function jaTemCobranca(pedido) {
    if (!pedido.financeiro) return false

    if (Array.isArray(pedido.financeiro)) {
      return pedido.financeiro.length > 0
    }

    return Boolean(pedido.financeiro.id)
  }

  function statusPagamento(pedido) {
    if (!pedido.financeiro) return null

    if (Array.isArray(pedido.financeiro)) {
      if (pedido.financeiro.length === 0) return null
      return pedido.financeiro[0].status
    }

    return pedido.financeiro.status
  }

  function verPedido(pedido) {
    setPedidoSelecionado(pedido)
    setOpenDetalhes(true)
  }

  async function atualizarStatusPedido(pedido, novoStatus) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', pedido.id)
      .select(`
        *,
        clientes (
          nome
        ),
        financeiro (
          id,
          status
        ),
        orcamentos (
          id,
          observacoes,
          orcamento_itens (
            id,
            quantidade,
            valor_unitario,
            subtotal,
            produtos (
              nome
            )
          )
        )
      `)

    if (error) {
      console.log('Erro ao atualizar pedido:', error)
      alert('Erro ao atualizar pedido.')
      return
    }

    setPedidos(
      pedidos.map(item =>
        item.id === pedido.id ? data[0] : item
      )
    )
  }

  async function gerarCobranca(pedido) {
    const confirmar = confirm('Deseja gerar cobrança para este pedido?')

    if (!confirmar) return

    const valorReal = calcularTotalPedido(pedido)

    const { data, error } = await supabase
      .from('financeiro')
      .insert([
        {
          pedido_id: pedido.id,
          cliente_id: pedido.cliente_id,
          valor: valorReal,
          forma_pagamento: 'PIX',
          status: 'Pendente'
        }
      ])
      .select()

    if (error) {
      console.log('Erro ao gerar cobrança:', error)

      if (error.code === '23505') {
        alert('Este pedido já possui cobrança gerada.')
        await carregarPedidos()
        return
      }

      alert('Erro ao gerar cobrança.')
      return
    }

    setPedidos(
      pedidos.map(item =>
        item.id === pedido.id
          ? {
              ...item,
              financeiro: data || []
            }
          : item
      )
    )

    alert('Cobrança gerada com sucesso!')
  }

  function avancarPedido(pedido) {
    const indiceAtual = indiceStatus(pedido.status)

    if (indiceAtual === statusPedidos.length - 1) return

    const proximoStatus = statusPedidos[indiceAtual + 1]

    atualizarStatusPedido(pedido, proximoStatus)
  }

  function voltarPedido(pedido) {
    const indiceAtual = indiceStatus(pedido.status)

    if (indiceAtual === 0) return

    const statusAnterior = statusPedidos[indiceAtual - 1]

    atualizarStatusPedido(pedido, statusAnterior)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Pedidos
            </h1>

            <p className="text-gray-500">
              Acompanhe a produção, entrega e cobrança dos pedidos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">

          {statusPedidos.map(status => {
            const lista = pedidosPorStatus(status)

            return (
              <div
                key={status}
                className="bg-white rounded-2xl p-5 shadow-sm min-h-[300px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {status}
                  </h3>

                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {lista.length}
                  </span>
                </div>

                {lista.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Nenhum pedido nesta etapa.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lista.map(pedido => {
                      const indiceAtual = indiceStatus(pedido.status)

                      return (
                        <div
                          key={pedido.id}
                          className="border rounded-xl p-4 bg-gray-50"
                        >
                          <p className="font-semibold text-gray-800">
                            {pedido.clientes?.nome || '-'}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            Valor: {formatarMoeda(calcularTotalPedido(pedido))}
                          </p>

                          <p className="text-xs text-gray-400 mt-2">
                            Pedido #{pedido.id.slice(0, 8)}
                          </p>

                          <button
                            onClick={() => verPedido(pedido)}
                            className="w-full mt-4 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs hover:bg-gray-800"
                          >
                            👁 Ver Pedido
                          </button>

                          {jaTemCobranca(pedido) ? (
                            <div className="space-y-2 mt-3">

                              <button
                                disabled
                                className="w-full bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs cursor-not-allowed font-semibold"
                              >
                                ✓ Cobrança Gerada
                              </button>

                              {statusPagamento(pedido) === 'Recebido' ? (
                                <div className="w-full bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-semibold text-center">
                                  🟢 Pagamento Recebido
                                </div>
                              ) : (
                                <div className="w-full bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-xs font-semibold text-center">
                                  🟡 Aguardando Pagamento
                                </div>
                              )}

                            </div>
                          ) : (
                            <button
                              onClick={() => gerarCobranca(pedido)}
                              className="w-full mt-3 bg-green-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-green-700"
                            >
                              💰 Gerar Cobrança
                            </button>
                          )}

                          <div className="flex justify-between gap-2 mt-4">
                            <button
                              onClick={() => voltarPedido(pedido)}
                              disabled={indiceAtual === 0}
                              className={`px-3 py-2 rounded-lg text-xs ${
                                indiceAtual === 0
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              ← Voltar
                            </button>

                            <button
                              onClick={() => avancarPedido(pedido)}
                              disabled={indiceAtual === statusPedidos.length - 1}
                              className={`px-3 py-2 rounded-lg text-xs ${
                                indiceAtual === statusPedidos.length - 1
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              Avançar →
                            </button>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

        </div>

        <PedidoDetalhesModal
          open={openDetalhes}
          onClose={() => {
            setOpenDetalhes(false)
            setPedidoSelecionado(null)
          }}
          pedido={pedidoSelecionado}
        />

      </main>
    </div>
  )
}