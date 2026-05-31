import { useEffect, useState } from 'react'
import ReceberPagamentoModal from '../../components/ReceberPagamentoModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState(null)

  async function carregarFinanceiro() {
    const { data, error } = await supabase
      .from('financeiro')
      .select(`
        *,
        clientes (
          nome
        ),
        pedidos (
          id
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar financeiro:', error)
      return
    }

    setLancamentos(data || [])
  }

  useEffect(() => {
    carregarFinanceiro()
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  async function confirmarRecebimento(dados) {
    const { data, error } = await supabase
      .from('financeiro')
      .update(dados)
      .eq('id', lancamentoSelecionado.id)
      .select(`
        *,
        clientes (
          nome
        ),
        pedidos (
          id
        )
      `)

    if (error) {
      console.log('Erro ao receber pagamento:', error)
      alert('Erro ao receber pagamento.')
      return
    }

    setLancamentos(
      lancamentos.map(item =>
        item.id === lancamentoSelecionado.id ? data[0] : item
      )
    )

    setOpenModal(false)
    setLancamentoSelecionado(null)
  }

  const totalReceber = lancamentos
    .filter(item => item.status === 'Pendente')
    .reduce((total, item) => total + Number(item.valor || 0), 0)

  const totalRecebido = lancamentos
    .filter(item => item.status === 'Recebido')
    .reduce((total, item) => total + Number(item.valor || 0), 0)

  const totalGeral = lancamentos
    .reduce((total, item) => total + Number(item.valor || 0), 0)

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Financeiro
          </h1>

          <p className="text-gray-500">
            Controle de recebimentos da Eternaê.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Total em aberto
            </p>

            <h2 className="text-2xl font-bold text-yellow-600 mt-2">
              {formatarMoeda(totalReceber)}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Total recebido
            </p>

            <h2 className="text-2xl font-bold text-green-600 mt-2">
              {formatarMoeda(totalRecebido)}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Total geral
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {formatarMoeda(totalGeral)}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">

            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Cliente</th>
                <th className="text-left p-4 text-gray-600">Pedido</th>
                <th className="text-left p-4 text-gray-600">Valor</th>
                <th className="text-left p-4 text-gray-600">Forma</th>
                <th className="text-left p-4 text-gray-600">Status</th>
                <th className="text-left p-4 text-gray-600">Ações</th>
              </tr>
            </thead>

            <tbody>
              {lancamentos.map(lancamento => (
                <tr
                  key={lancamento.id}
                  className="border-t"
                >
                  <td className="p-4">
                    {lancamento.clientes?.nome || '-'}
                  </td>

                  <td className="p-4">
                    #{lancamento.pedido_id?.slice(0, 8) || '-'}
                  </td>

                  <td className="p-4">
                    {formatarMoeda(lancamento.valor)}
                  </td>

                  <td className="p-4">
                    {lancamento.forma_pagamento || '-'}
                  </td>

                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      lancamento.status === 'Recebido'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {lancamento.status}
                    </span>
                  </td>

                  <td className="p-4">
                    {lancamento.status === 'Recebido' ? (
                      <span className="text-green-600 text-sm">
                        ✓ Recebido
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setLancamentoSelecionado(lancamento)
                          setOpenModal(true)
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        Receber Pagamento
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {lancamentos.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhum lançamento financeiro cadastrado.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
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