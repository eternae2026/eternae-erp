import { useEffect, useState } from 'react'
import OrcamentoModal from '../../components/OrcamentoModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Orcamentos() {
  const [openModal, setOpenModal] = useState(false)
  const [orcamentoEditando, setOrcamentoEditando] = useState(null)
  const [clientes, setClientes] = useState([])
  const [orcamentos, setOrcamentos] = useState([])

  async function carregarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar clientes:', error)
      return
    }

    setClientes(data || [])
  }

  async function carregarOrcamentos() {
    const { data, error } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes (
          nome
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar orçamentos:', error)
      return
    }

    setOrcamentos(data || [])
  }

  useEffect(() => {
    carregarClientes()
    carregarOrcamentos()
  }, [])

  async function salvarNovoOrcamento(orcamento) {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert([orcamento])
      .select(`
        *,
        clientes (
          nome
        )
      `)

    if (error) {
      console.log('Erro ao salvar orçamento:', error)
      alert('Erro ao salvar orçamento.')
      return
    }

    setOrcamentos([data[0], ...orcamentos])
    setOpenModal(false)
  }

  async function salvarOrcamento(orcamento) {
    if (orcamentoEditando) {
      const { data, error } = await supabase
        .from('orcamentos')
        .update(orcamento)
        .eq('id', orcamentoEditando.id)
        .select(`
          *,
          clientes (
            nome
          )
        `)

      if (error) {
        console.log('Erro ao editar orçamento:', error)
        alert('Erro ao editar orçamento.')
        return
      }

      setOrcamentos(
        orcamentos.map(item =>
          item.id === orcamentoEditando.id ? data[0] : item
        )
      )

      setOrcamentoEditando(null)
      setOpenModal(false)
      return
    }

    await salvarNovoOrcamento(orcamento)
  }

  function editarOrcamento(orcamento) {
    setOrcamentoEditando(orcamento)
    setOpenModal(true)
  }

  async function excluirOrcamento(id) {
    const confirmar = confirm('Tem certeza que deseja excluir este orçamento?')

    if (!confirmar) return

    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao excluir orçamento:', error)
      alert('Erro ao excluir orçamento.')
      return
    }

    setOrcamentos(orcamentos.filter(orcamento => orcamento.id !== id))
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function corStatus(status) {
    if (status === 'Aprovado') return 'bg-green-100 text-green-700'
    if (status === 'Recusado') return 'bg-red-100 text-red-700'
    if (status === 'Enviado') return 'bg-blue-100 text-blue-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Orçamentos
            </h1>

            <p className="text-gray-500">
              Gerencie os orçamentos dos seus clientes.
            </p>
          </div>

          <button
            onClick={() => {
              setOrcamentoEditando(null)
              setOpenModal(true)
            }}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            + Novo Orçamento
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Cliente</th>
                <th className="text-left p-4 text-gray-600">Data</th>
                <th className="text-left p-4 text-gray-600">Valor</th>
                <th className="text-left p-4 text-gray-600">Status</th>
                <th className="text-left p-4 text-gray-600">Ações</th>
              </tr>
            </thead>

            <tbody>
              {orcamentos.map(orcamento => (
                <tr key={orcamento.id} className="border-t">
                  <td className="p-4">
                    {orcamento.clientes?.nome || '-'}
                  </td>

                  <td className="p-4">
                    {formatarData(orcamento.created_at)}
                  </td>

                  <td className="p-4">
                    {formatarMoeda(orcamento.valor)}
                  </td>

                  <td className="p-4">
                    <span className={`${corStatus(orcamento.status)} px-3 py-1 rounded-full text-sm`}>
                      {orcamento.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => editarOrcamento(orcamento)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => excluirOrcamento(orcamento.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {orcamentos.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhum orçamento cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <OrcamentoModal
          open={openModal}
          onClose={() => {
            setOpenModal(false)
            setOrcamentoEditando(null)
          }}
          onSave={salvarOrcamento}
          clientes={clientes}
          orcamento={orcamentoEditando}
        />
      </main>
    </div>
  )
}