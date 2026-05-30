import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])

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

  function pedidosPorStatus(status) {
    return pedidos.filter(pedido => pedido.status === status)
  }

  function indiceStatus(status) {
    return statusPedidos.indexOf(status)
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
              Acompanhe a produção e entrega dos pedidos.
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
                            Valor: {formatarMoeda(pedido.valor)}
                          </p>

                          <p className="text-xs text-gray-400 mt-2">
                            Pedido #{pedido.id.slice(0, 8)}
                          </p>

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

      </main>
    </div>
  )
}