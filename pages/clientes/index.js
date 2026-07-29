import { useEffect, useState } from 'react'
import ClientModal from '../../components/ClientModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Clientes() {
  const [openModal, setOpenModal] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [excluindoId, setExcluindoId] = useState(null)

  async function carregarClientes() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar clientes:', error)
      alert('Erro ao carregar os clientes.')
      setClientes([])
      setCarregando(false)
      return
    }

    setClientes(data || [])
    setCarregando(false)
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

      if (error.code === '23505') {
        alert(
          'Já existe um cliente cadastrado com uma informação única igual.'
        )
      } else {
        alert('Erro ao salvar cliente.')
      }

      return false
    }

    const novoCliente = data?.[0]

    if (!novoCliente) {
      alert('O cliente não foi retornado após o cadastro.')
      return false
    }

    setClientes((listaAtual) => [
      novoCliente,
      ...listaAtual
    ])

    setOpenModal(false)
    return true
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

        if (error.code === '23505') {
          alert(
            'Já existe outro cliente cadastrado com uma informação única igual.'
          )
        } else {
          alert('Erro ao editar cliente.')
        }

        return false
      }

      const clienteAtualizado = data?.[0]

      if (!clienteAtualizado) {
        alert('O cliente não foi retornado após a edição.')
        return false
      }

      setClientes((listaAtual) =>
        listaAtual.map((item) =>
          item.id === clienteEditando.id
            ? clienteAtualizado
            : item
        )
      )

      setClienteEditando(null)
      setOpenModal(false)
      return true
    }

    return handleAddClient(cliente)
  }

  function editarCliente(cliente) {
    setClienteEditando(cliente)
    setOpenModal(true)
  }

  async function clientePossuiHistorico(clienteId) {
    const consultas = [
      supabase
        .from('orcamentos')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', clienteId),

      supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', clienteId),

      supabase
        .from('financeiro')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', clienteId)
    ]

    const resultados = await Promise.all(consultas)

    const erroConsulta = resultados.find(
      (resultado) => resultado.error
    )

    if (erroConsulta) {
      console.log(
        'Erro ao verificar histórico do cliente:',
        erroConsulta.error
      )

      throw erroConsulta.error
    }

    return resultados.some(
      (resultado) => Number(resultado.count || 0) > 0
    )
  }

  async function excluirCliente(cliente) {
    if (excluindoId) return

    setExcluindoId(cliente.id)

    try {
      const possuiHistorico =
        await clientePossuiHistorico(cliente.id)

      if (possuiHistorico) {
        alert(
          'Este cliente possui orçamento, pedido ou lançamento financeiro e não pode ser excluído. O histórico precisa ser preservado.'
        )
        return
      }

      const confirmar = confirm(
        `Tem certeza que deseja excluir o cliente ${cliente.nome}? Esta ação é indicada apenas para cadastros criados por engano.`
      )

      if (!confirmar) return

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id)

      if (error) {
        console.log('Erro ao excluir cliente:', error)
        alert(
          'Não foi possível excluir o cliente. Verifique se ele possui algum vínculo no sistema.'
        )
        return
      }

      setClientes((listaAtual) =>
        listaAtual.filter(
          (item) => item.id !== cliente.id
        )
      )

      alert('Cliente excluído com sucesso.')
    } catch (error) {
      console.log(
        'Erro ao validar exclusão do cliente:',
        error
      )

      alert(
        'Não foi possível verificar o histórico do cliente. A exclusão não foi realizada.'
      )
    } finally {
      setExcluindoId(null)
    }
  }

  function formatarDataSemFuso(data) {
    if (!data) return '-'

    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString('pt-BR')
  }

  function gerarLinkWhatsapp(numero) {
    let digitos = String(numero || '').replace(/\D/g, '')

    if (!digitos) return null

    if (digitos.startsWith('55') && digitos.length >= 12) {
      return `https://wa.me/${digitos}`
    }

    return `https://wa.me/55${digitos}`
  }

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      `${cliente.nome || ''} ${cliente.whatsapp || ''} ${
        cliente.instagram || ''
      } ${cliente.observacoes || ''}`
        .toLowerCase()
        .includes(busca.trim().toLowerCase())
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
            type="button"
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
          <div className="relative w-full md:w-96">
            <span
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            >
              🔍
            </span>

            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full border rounded-xl pl-11 pr-4 py-3"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
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
                {carregando ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500"
                    >
                      Carregando clientes...
                    </td>
                  </tr>
                ) : clientesFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500"
                    >
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map((cliente) => {
                    const linkWhatsapp =
                      gerarLinkWhatsapp(cliente.whatsapp)

                    return (
                      <tr
                        key={cliente.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-4">
                          {cliente.nome}
                        </td>

                        <td className="p-4">
                          {linkWhatsapp ? (
                            <a
                              href={linkWhatsapp}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-600 hover:underline"
                            >
                              {cliente.whatsapp}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="p-4">
                          {cliente.instagram || '-'}
                        </td>

                        <td className="p-4">
                          {formatarDataSemFuso(
                            cliente.aniversario
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                editarCliente(cliente)
                              }
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                excluirCliente(cliente)
                              }
                              disabled={
                                excluindoId === cliente.id
                              }
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              {excluindoId === cliente.id
                                ? 'Verificando...'
                                : 'Excluir'}
                            </button>
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