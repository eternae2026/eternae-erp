import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Producao() {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)

  async function carregarPedidosProducao() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (
          nome
        ),
        orcamentos (
          id,
          orcamento_itens (
            id,
            nome_item,
            quantidade,
            valor_unitario,
            subtotal,
            produtos (
              nome
            )
          )
        )
      `)
      .in('etapa_producao', ['Produção', 'Pronto'])
      .order('created_at', { ascending: true })

    if (error) {
      console.log('Erro ao carregar produções:', error)
      setPedidos([])
      setCarregando(false)
      return
    }

    setPedidos(data || [])
    setCarregando(false)
  }

  useEffect(() => {
    carregarPedidosProducao()
  }, [])

  const pedidosEmProducao = pedidos.filter(
    pedido => pedido.etapa_producao === 'Produção'
  )

  const pedidosProntos = pedidos.filter(
    pedido => pedido.etapa_producao === 'Pronto'
  )

  function nomeItem(item) {
    return item.nome_item || item.produtos?.nome || 'Item'
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Produção
          </h1>

          <p className="text-gray-500 mt-1">
            Acompanhe tudo que precisa ser produzido.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">
              Em produção
            </p>

            <p className="text-3xl font-bold mt-3">
              {pedidosEmProducao.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">
              Pedidos prontos
            </p>

            <p className="text-3xl font-bold mt-3">
              {pedidosProntos.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500 text-sm">
              Atrasados
            </p>

            <p className="text-3xl font-bold mt-3 text-red-600">
              0
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              Produções em andamento
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Pedidos que estão atualmente na etapa de produção.
            </p>
          </div>

          {carregando ? (
            <p className="p-6 text-gray-500">
              Carregando produções...
            </p>
          ) : pedidosEmProducao.length === 0 ? (
            <p className="p-6 text-gray-500">
              Nenhum pedido em produção no momento.
            </p>
          ) : (
            <div className="divide-y">
              {pedidosEmProducao.map(pedido => {
                const itens =
                  pedido.orcamentos?.orcamento_itens || []

                return (
                  <div
                    key={pedido.id}
                    className="p-5 flex items-start justify-between gap-6"
                  >
                    <div>
                      <p className="font-bold text-gray-800">
                        {pedido.clientes?.nome || 'Cliente'}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Pedido #{pedido.id.slice(0, 8)}
                      </p>

                      <div className="mt-3 space-y-1">
                        {itens.map(item => (
                          <p
                            key={item.id}
                            className="text-sm text-gray-600"
                          >
                            {item.quantidade}x {nomeItem(item)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      Em produção
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}