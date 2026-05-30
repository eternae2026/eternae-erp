import { useEffect, useState } from 'react'
import ClientModal from '../../components/ClientModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Clientes() {
  const [openModal, setOpenModal] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')

  async function carregarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar clientes:', error)
      return
    }

    setClientes(data || [])
  }

  useEffect(() => {
    carregarClientes()
  }, [])

  async function handleAddClient(cliente) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([cliente])
      .select()

    if (error) {
      console.log('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente.')
      return
    }

    setClientes([data[0], ...clientes])
    setOpenModal(false)
  }

  async function handleSaveClient(cliente) {
    if (clienteEditando) {
      const { data, error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', clienteEditando.id)
        .select()

      if (error) {
        console.log('Erro ao editar cliente:', error)
        alert('Erro ao editar cliente.')
        return
      }

      setClientes(
        clientes.map(item =>
          item.id === clienteEditando.id ? data[0] : item
        )
      )

      setClienteEditando(null)
      setOpenModal(false)
      return
    }

    await handleAddClient(cliente)
  }

  function editarCliente(cliente) {
    setClienteEditando(cliente)
    setOpenModal(true)
  }

  async function excluirCliente(id) {
    const confirmar = confirm('Tem certeza que deseja excluir este cliente?')

    if (!confirmar) return

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao excluir cliente:', error)
      alert('Erro ao excluir cliente.')
      return
    }

    setClientes(clientes.filter(cliente => cliente.id !== id))
  }

  const clientesFiltrados = clientes.filter(cliente =>
    `${cliente.nome || ''} ${cliente.whatsapp || ''} ${cliente.instagram || ''}`
      .toLowerCase()
      .includes(busca.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Clientes
            </h1>

            <p className="text-gray-500">
              Gerencie seus clientes.
            </p>
          </div>

          <button
            onClick={() => {
              setClienteEditando(null)
              setOpenModal(true)
            }}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            + Novo Cliente
          </button>

        </div>

        <div className="mb-6">

          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full md:w-96 border rounded-xl px-4 py-3"
          />

        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left p-4 text-gray-600">
                  Nome
                </th>

                <th className="text-left p-4 text-gray-600">
                  WhatsApp
                </th>

                <th className="text-left p-4 text-gray-600">
                  Instagram
                </th>

                <th className="text-left p-4 text-gray-600">
                  Aniversário
                </th>

                <th className="text-left p-4 text-gray-600">
                  Ações
                </th>

              </tr>

            </thead>

            <tbody>

              {clientesFiltrados.map(cliente => (

                <tr
                  key={cliente.id}
                  className="border-t"
                >

                  <td className="p-4">
                    {cliente.nome}
                  </td>

                  <td className="p-4">

                    {cliente.whatsapp ? (
                      <a
                        href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        {cliente.whatsapp}
                      </a>
                    ) : '-'}
                  </td>

                  <td className="p-4">
                    {cliente.instagram || '-'}
                  </td>

                  <td className="p-4">
                    {cliente.aniversario
                      ? new Date(cliente.aniversario)
                          .toLocaleDateString('pt-BR')
                      : '-'}
                  </td>

                  <td className="p-4">

                    <div className="flex gap-3">

                      <button
                        onClick={() => editarCliente(cliente)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => excluirCliente(cliente.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

              {clientesFiltrados.length === 0 && (

                <tr>

                  <td
                    colSpan="5"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhum cliente encontrado.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        <ClientModal
          open={openModal}
          onClose={() => {
            setOpenModal(false)
            setClienteEditando(null)
          }}
          onSave={handleSaveClient}
          cliente={clienteEditando}
        />

      </main>

    </div>
  )
}