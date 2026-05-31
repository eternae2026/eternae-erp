import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import ProducaoDetalhesModal from '../../components/ProducaoDetalhesModal'
import { supabase } from '../../lib/supabase'

export default function Producoes() {
  const [producoes, setProducoes] = useState([])
  const [openDetalhes, setOpenDetalhes] = useState(false)
  const [producaoSelecionada, setProducaoSelecionada] = useState(null)

  const statusProducoes = [
    'Aguardando Início',
    'Em Produção',
    'Finalizado',
    'Entregue'
  ]

  async function carregarProducoes() {
    const { data, error } = await supabase
      .from('producoes')
      .select(`
        *,
        pedidos (
          id,
          valor,
          status,
          clientes (
            nome
          ),
          orcamentos (
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
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar produções:', error)
      return
    }

    setProducoes(data || [])
  }

  useEffect(() => {
    carregarProducoes()
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function calcularTotalProducao(producao) {
    const itens = producao.pedidos?.orcamentos?.orcamento_itens || []

    if (itens.length === 0) {
      return Number(producao.pedidos?.valor || 0)
    }

    return itens.reduce((total, item) => {
      return total + Number(item.subtotal || 0)
    }, 0)
  }

  function producoesPorStatus(status) {
    return producoes.filter(producao => producao.status === status)
  }

  function indiceStatus(status) {
    return statusProducoes.indexOf(status)
  }

  function verProducao(producao) {
    setProducaoSelecionada(producao)
    setOpenDetalhes(true)
  }

  async function atualizarStatusProducao(producao, novoStatus) {
    const dadosAtualizacao = {
      status: novoStatus
    }

    if (novoStatus === 'Em Produção' && !producao.data_inicio) {
      dadosAtualizacao.data_inicio = new Date().toISOString()
    }

    if (novoStatus === 'Finalizado' && !producao.data_finalizacao) {
      dadosAtualizacao.data_finalizacao = new Date().toISOString()
    }

    if (novoStatus === 'Entregue' && !producao.data_entrega) {
      dadosAtualizacao.data_entrega = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('producoes')
      .update(dadosAtualizacao)
      .eq('id', producao.id)
      .select(`
        *,
        pedidos (
          id,
          valor,
          status,
          clientes (
            nome
          ),
          orcamentos (
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
        )
      `)

    if (error) {
      console.log('Erro ao atualizar produção:', error)
      alert('Erro ao atualizar produção.')
      return
    }

    setProducoes(
      producoes.map(item =>
        item.id === producao.id ? data[0] : item
      )
    )
  }

  function avancarProducao(producao) {
    const indiceAtual = indiceStatus(producao.status)

    if (indiceAtual === statusProducoes.length - 1) return

    const proximoStatus = statusProducoes[indiceAtual + 1]

    atualizarStatusProducao(producao, proximoStatus)
  }

  function voltarProducao(producao) {
    const indiceAtual = indiceStatus(producao.status)

    if (indiceAtual === 0) return

    const statusAnterior = statusProducoes[indiceAtual - 1]

    atualizarStatusProducao(producao, statusAnterior)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Produção
          </h1>

          <p className="text-gray-500">
            Acompanhe os pedidos em produção da Eternaê.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">

          {statusProducoes.map(status => {
            const lista = producoesPorStatus(status)

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
                    Nenhuma produção nesta etapa.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lista.map(producao => {
                      const indiceAtual = indiceStatus(producao.status)

                      return (
                        <div
                          key={producao.id}
                          className="border rounded-xl p-4 bg-gray-50"
                        >
                          <p className="font-semibold text-gray-800">
                            {producao.pedidos?.clientes?.nome || '-'}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            Valor: {formatarMoeda(calcularTotalProducao(producao))}
                          </p>

                          <p className="text-xs text-gray-400 mt-2">
                            Pedido #{producao.pedido_id?.slice(0, 8)}
                          </p>

                          <button
                            onClick={() => verProducao(producao)}
                            className="w-full mt-4 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs hover:bg-gray-800"
                          >
                            👁 Ver Produção
                          </button>

                          <div className="flex justify-between gap-2 mt-4">
                            <button
                              onClick={() => voltarProducao(producao)}
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
                              onClick={() => avancarProducao(producao)}
                              disabled={indiceAtual === statusProducoes.length - 1}
                              className={`px-3 py-2 rounded-lg text-xs ${
                                indiceAtual === statusProducoes.length - 1
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

        <ProducaoDetalhesModal
          open={openDetalhes}
          onClose={() => {
            setOpenDetalhes(false)
            setProducaoSelecionada(null)
          }}
          producao={producaoSelecionada}
        />

      </main>
    </div>
  )
}