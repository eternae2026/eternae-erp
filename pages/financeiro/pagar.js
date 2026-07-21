import { useEffect, useState } from 'react'
import ContaPagarModal from '../../components/ContaPagarModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function ContasPagar() {
  const [contas, setContas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [carregando, setCarregando] = useState(true)

  async function carregarCategorias() {
    const { data, error } = await supabase
      .from('categorias_financeiras')
      .select('id, nome')
      .eq('natureza', 'saida')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      console.log(
        'Erro ao carregar categorias financeiras:',
        error
      )
      return
    }

    setCategorias(data || [])
  }

  async function carregarContas() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('contas_pagar')
      .select(`
        *,
        categorias_financeiras (
          id,
          nome
        )
      `)
      .order('data_vencimento', { ascending: true })

    if (error) {
      console.log('Erro ao carregar contas a pagar:', error)
      alert('Erro ao carregar as contas a pagar.')
      setCarregando(false)
      return
    }

    setContas(data || [])
    setCarregando(false)
  }

  useEffect(() => {
    carregarCategorias()
    carregarContas()
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '-'

    return new Date(`${data}T00:00:00`).toLocaleDateString(
      'pt-BR'
    )
  }

  function dataSemHorario(data) {
    const novaData = new Date(data)
    novaData.setHours(0, 0, 0, 0)
    return novaData
  }

  function analisarVencimento(conta) {
    if (conta.status === 'pago') {
      return {
        texto: 'Pago',
        classe: 'bg-green-100 text-green-700'
      }
    }

    if (conta.status === 'cancelado') {
      return {
        texto: 'Cancelado',
        classe: 'bg-gray-100 text-gray-600'
      }
    }

    if (!conta.data_vencimento) {
      return {
        texto: 'Pendente',
        classe: 'bg-yellow-100 text-yellow-700'
      }
    }

    const hoje = dataSemHorario(new Date())
    const vencimento = dataSemHorario(
      `${conta.data_vencimento}T00:00:00`
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

  async function salvarConta(dados) {
    const { error } = await supabase
      .from('contas_pagar')
      .insert([
        {
          descricao: dados.descricao,
          categoria_id: dados.categoria_id,
          fornecedor: dados.fornecedor,
          valor: dados.valor,
          data_vencimento: dados.data_vencimento,
          observacoes: dados.observacoes,
          status: 'pendente'
        }
      ])

    if (error) {
      console.log('Erro ao salvar conta:', error)
      alert('Erro ao salvar a conta.')
      return false
    }

    await carregarContas()
    setOpenModal(false)

    return true
  }

  async function marcarComoPaga(conta) {
    const confirmar = window.confirm(
      `Confirmar o pagamento de "${conta.descricao}" no valor de ${formatarMoeda(conta.valor)}?`
    )

    if (!confirmar) return

    const hoje = new Date().toISOString().slice(0, 10)

    const { error: erroConta } = await supabase
      .from('contas_pagar')
      .update({
        status: 'pago',
        data_pagamento: hoje,
        updated_at: new Date().toISOString()
      })
      .eq('id', conta.id)

    if (erroConta) {
      console.log(
        'Erro ao marcar conta como paga:',
        erroConta
      )
      alert('Erro ao registrar o pagamento.')
      return
    }

    const nomeCategoria =
      conta.categorias_financeiras?.nome ||
      'Outros'

    const { error: erroMovimentacao } = await supabase
      .from('movimentacoes_financeiras')
      .insert([
        {
          tipo: 'Saída',
          categoria: nomeCategoria,
          descricao: conta.descricao,
          valor: Number(conta.valor || 0),
          forma_pagamento: null,
          data_movimento: hoje,
          pedido_id: null,
          observacoes: conta.observacoes || null
        }
      ])

    if (erroMovimentacao) {
      console.log(
        'Erro ao registrar saída no fluxo de caixa:',
        erroMovimentacao
      )

      alert(
        'A conta foi marcada como paga, mas houve erro ao registrar a saída no Fluxo de Caixa.'
      )

      await carregarContas()
      return
    }

    await carregarContas()

    alert(
      'Conta paga e saída registrada no Fluxo de Caixa!'
    )
  }

  async function cancelarConta(conta) {
    const confirmar = window.confirm(
      `Deseja cancelar a conta "${conta.descricao}"?`
    )

    if (!confirmar) return

    const { error } = await supabase
      .from('contas_pagar')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', conta.id)

    if (error) {
      console.log('Erro ao cancelar conta:', error)
      alert('Erro ao cancelar a conta.')
      return
    }

    await carregarContas()
  }

  async function excluirConta(conta) {
    const confirmar = window.confirm(
      `Excluir definitivamente a conta "${conta.descricao}"?`
    )

    if (!confirmar) return

    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', conta.id)

    if (error) {
      console.log('Erro ao excluir conta:', error)
      alert('Erro ao excluir a conta.')
      return
    }

    await carregarContas()
  }

  const contasPendentes = contas.filter(
    (conta) => conta.status === 'pendente'
  )

  const hoje = dataSemHorario(new Date())

  const limiteSeteDias = new Date(hoje)
  limiteSeteDias.setDate(limiteSeteDias.getDate() + 7)

  const totalAPagar = contasPendentes.reduce(
    (total, conta) =>
      total + Number(conta.valor || 0),
    0
  )

  const vencendoHoje = contasPendentes
    .filter((conta) => {
      if (!conta.data_vencimento) return false

      const vencimento = dataSemHorario(
        `${conta.data_vencimento}T00:00:00`
      )

      return vencimento.getTime() === hoje.getTime()
    })
    .reduce(
      (total, conta) =>
        total + Number(conta.valor || 0),
      0
    )

  const proximosSeteDias = contasPendentes
    .filter((conta) => {
      if (!conta.data_vencimento) return false

      const vencimento = dataSemHorario(
        `${conta.data_vencimento}T00:00:00`
      )

      return (
        vencimento > hoje &&
        vencimento <= limiteSeteDias
      )
    })
    .reduce(
      (total, conta) =>
        total + Number(conta.valor || 0),
      0
    )

  const atrasadas = contasPendentes
    .filter((conta) => {
      if (!conta.data_vencimento) return false

      const vencimento = dataSemHorario(
        `${conta.data_vencimento}T00:00:00`
      )

      return vencimento < hoje
    })
    .reduce(
      (total, conta) =>
        total + Number(conta.valor || 0),
      0
    )

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Contas a Pagar
            </h1>

            <p className="text-gray-500">
              Controle de despesas e obrigações futuras.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition"
          >
            + Nova Conta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Total a pagar
            </p>

            <h2 className="text-2xl font-bold text-yellow-600 mt-2">
              {formatarMoeda(totalAPagar)}
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
              Próximos 7 dias
            </p>

            <h2 className="text-2xl font-bold text-blue-600 mt-2">
              {formatarMoeda(proximosSeteDias)}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Atrasadas
            </p>

            <h2 className="text-2xl font-bold text-red-600 mt-2">
              {formatarMoeda(atrasadas)}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">
                    Descrição
                  </th>

                  <th className="text-left p-4">
                    Categoria
                  </th>

                  <th className="text-left p-4">
                    Fornecedor
                  </th>

                  <th className="text-left p-4">
                    Valor
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
                      Carregando contas...
                    </td>
                  </tr>
                ) : contas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-gray-400 py-20"
                    >
                      Nenhuma conta cadastrada.
                    </td>
                  </tr>
                ) : (
                  contas.map((conta) => {
                    const situacao = analisarVencimento(conta)

                    return (
                      <tr
                        key={conta.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <p className="font-semibold text-gray-800">
                            {conta.descricao}
                          </p>

                          {conta.observacoes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {conta.observacoes}
                            </p>
                          )}
                        </td>

                        <td className="p-4 text-gray-600">
                          {conta.categorias_financeiras?.nome ||
                            'Sem categoria'}
                        </td>

                        <td className="p-4 text-gray-600">
                          {conta.fornecedor || '-'}
                        </td>

                        <td className="p-4 font-semibold text-gray-800">
                          {formatarMoeda(conta.valor)}
                        </td>

                        <td className="p-4 text-gray-600">
                          {formatarData(conta.data_vencimento)}
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
                            {conta.status === 'pendente' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    marcarComoPaga(conta)
                                  }
                                  className="bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 text-sm"
                                >
                                  Pagar
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    cancelarConta(conta)
                                  }
                                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}

                            {conta.status !== 'pago' && (
                              <button
                                type="button"
                                onClick={() =>
                                  excluirConta(conta)
                                }
                                className="bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 text-sm"
                              >
                                Excluir
                              </button>
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

        <ContaPagarModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSalvar={salvarConta}
          categorias={categorias}
        />
      </main>
    </div>
  )
}