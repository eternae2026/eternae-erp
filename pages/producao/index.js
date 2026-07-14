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
  id,
  created_at,
  etapa_producao,
  data_inicio_producao,
  prazo_producao_dias,
  data_prevista_entrega,
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

  const hoje = new Date()
hoje.setHours(0, 0, 0, 0)

const pedidosAtrasados = pedidosEmProducao.filter(pedido => {
  if (!pedido.data_prevista_entrega) return false

  const dataPrevista = new Date(
    `${pedido.data_prevista_entrega}T00:00:00`
  )

  return hoje > dataPrevista
})

  function nomeItem(item) {
    return item.nome_item || item.produtos?.nome || 'Item'
  }

  function situacaoPrazo(pedido) {
  if (
    !pedido.data_inicio_producao ||
    !pedido.data_prevista_entrega
  ) {
    return {
      tipo: 'sem-prazo',
      texto: 'Prazo não informado',
      classe: 'bg-gray-100 text-gray-700',
      dias: null
    }
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const previsao = new Date(
    `${pedido.data_prevista_entrega}T00:00:00`
  )

  const diferencaDias = Math.ceil(
    (previsao - hoje) / (1000 * 60 * 60 * 24)
  )

  if (diferencaDias < 0) {
    return {
      tipo: 'atrasado',
      texto: `Atrasado há ${Math.abs(diferencaDias)} dia(s)`,
      classe: 'bg-red-100 text-red-700',
      dias: diferencaDias
    }
  }

  if (diferencaDias === 0) {
    return {
      tipo: 'vence-hoje',
      texto: 'Prazo termina hoje',
      classe: 'bg-orange-100 text-orange-700',
      dias: diferencaDias
    }
  }

  if (diferencaDias <= 2) {
    return {
      tipo: 'atencao',
      texto: `Faltam ${diferencaDias} dia(s)`,
      classe: 'bg-yellow-100 text-yellow-700',
      dias: diferencaDias
    }
  }

  return {
    tipo: 'no-prazo',
    texto: `Faltam ${diferencaDias} dia(s)`,
    classe: 'bg-green-100 text-green-700',
    dias: diferencaDias
  }
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
              {pedidosAtrasados.length}
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
                console.log(pedido)
                const itens =
                  pedido.orcamentos?.orcamento_itens || []
                const prazo = situacaoPrazo(pedido)
                const estaAtrasado = prazo.tipo === 'atrasado'
                
                return (
                  <div
  key={pedido.id}
  className={`p-5 ${
    estaAtrasado ? 'bg-red-50' : 'bg-white'
  }`}
>
  <div className="flex items-start justify-between gap-6">
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

    <div className="flex flex-col items-end gap-2">
      <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
        Em produção
      </span>

      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${prazo.classe}`}
      >
        {prazo.texto}
      </span>
    </div>
  </div>

  {pedido.data_inicio_producao &&
  pedido.data_prevista_entrega ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-500">
          Início da produção
        </p>

        <p className="text-sm font-semibold text-gray-800 mt-1">
          {new Date(
            pedido.data_inicio_producao
          ).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-500">
          Prazo informado
        </p>

        <p className="text-sm font-semibold text-gray-800 mt-1">
          {pedido.prazo_producao_dias} dias úteis
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-500">
          Data prevista
        </p>

        <p className="text-sm font-semibold text-gray-800 mt-1">
          {new Date(
            `${pedido.data_prevista_entrega}T00:00:00`
          ).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  ) : (
    <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-700">
        Prazo ainda não informado
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Este pedido entrou em produção antes da implantação do controle de prazo.
      </p>
    </div>
  )}
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