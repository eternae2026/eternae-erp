import { useEffect, useState } from 'react'
import OrcamentoModal from '../../components/OrcamentoModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Orcamentos() {
  const [openModal, setOpenModal] = useState(false)
  const [orcamentoEditando, setOrcamentoEditando] = useState(null)
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
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

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar produtos:', error)
      return
    }

    setProdutos(data || [])
  }

  async function carregarOrcamentos() {
    const { data, error } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes (
          nome
        ),
        pedidos (
          id
        ),
        orcamento_itens (
          *,
          produtos (
            nome
          )
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
    carregarProdutos()
    carregarOrcamentos()
  }, [])

  async function salvarNovoOrcamento(orcamento) {
    const { itens, ...dadosOrcamento } = orcamento

    const { data, error } = await supabase
      .from('orcamentos')
      .insert([dadosOrcamento])
      .select(`
        *,
        clientes (
          nome
        ),
        pedidos (
          id
        ),
        orcamento_itens (
          *,
          produtos (
            nome
          )
        )
      `)

    if (error) {
      console.log('Erro ao salvar orçamento:', error)
      alert('Erro ao salvar orçamento.')
      return
    }

    const orcamentoCriado = data[0]

    if (itens && itens.length > 0) {
      const itensParaSalvar = itens.map(item => ({
        orcamento_id: orcamentoCriado.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        subtotal: item.subtotal
      }))

      const { error: erroItens } = await supabase
        .from('orcamento_itens')
        .insert(itensParaSalvar)

      if (erroItens) {
        console.log('Erro ao salvar itens do orçamento:', erroItens)
        alert('Orçamento salvo, mas houve erro ao salvar os itens.')
        return
      }
    }

    await carregarOrcamentos()
    setOpenModal(false)
  }

  async function salvarOrcamento(orcamento) {
    const { itens, ...dadosOrcamento } = orcamento

    if (orcamentoEditando) {
      const { error } = await supabase
        .from('orcamentos')
        .update(dadosOrcamento)
        .eq('id', orcamentoEditando.id)

      if (error) {
        console.log('Erro ao editar orçamento:', error)
        alert('Erro ao editar orçamento.')
        return
      }

      await supabase
        .from('orcamento_itens')
        .delete()
        .eq('orcamento_id', orcamentoEditando.id)

      if (itens && itens.length > 0) {
        const itensParaSalvar = itens.map(item => ({
          orcamento_id: orcamentoEditando.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          subtotal: item.subtotal
        }))

        const { error: erroItens } = await supabase
          .from('orcamento_itens')
          .insert(itensParaSalvar)

        if (erroItens) {
          console.log('Erro ao salvar itens do orçamento:', erroItens)
          alert('Orçamento editado, mas houve erro ao salvar os itens.')
          return
        }
      }

      await carregarOrcamentos()
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

  async function converterEmPedido(orcamento) {
    const confirmar = confirm('Deseja converter este orçamento em pedido?')

    if (!confirmar) return

    const { error } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_id: orcamento.cliente_id,
          orcamento_id: orcamento.id,
          valor: orcamento.valor,
          status: 'Novo Pedido'
        }
      ])

    if (error) {
      console.log('Erro ao converter em pedido:', error)

      if (error.code === '23505') {
        alert('Este orçamento já foi convertido em pedido.')
        return
      }

      alert('Erro ao converter orçamento em pedido.')
      return
    }

    alert('Pedido criado com sucesso!')
    carregarOrcamentos()
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

  function jaVirouPedido(orcamento) {
    return orcamento.pedidos && orcamento.pedidos.length > 0
  }

  function quantidadeItens(orcamento) {
    return orcamento.orcamento_itens?.length || 0
  }

  function nomesProdutos(orcamento) {
    const itens = orcamento.orcamento_itens || []

    if (itens.length === 0) return 'Sem produtos'

    return itens
      .map(item => item.produtos?.nome)
      .filter(Boolean)
      .join(', ')
  }

  function enviarWhatsApp(orcamento) {
  const cliente = clientes.find(
    cliente => cliente.id === orcamento.cliente_id
  )

  if (!cliente?.whatsapp) {
    alert('Este cliente não possui WhatsApp cadastrado.')
    return
  }

  let mensagem = `Olá ${cliente.nome}!\n\n`
  mensagem += `Segue seu orçamento:\n\n`

  orcamento.orcamento_itens?.forEach(item => {
  mensagem += `Produto: ${item.produtos?.nome}\n`
  mensagem += `Valor unitário: ${formatarMoeda(item.valor_unitario)}\n`
  mensagem += `Quantidade: ${item.quantidade}\n`
  mensagem += `Subtotal: ${formatarMoeda(item.subtotal)}\n\n`
})

  mensagem += `------------------------------\n`
  mensagem += `Total do orçamento: ${formatarMoeda(orcamento.valor)}\n\n`
  mensagem += `Aguardamos sua aprovação.\n\n`
  mensagem += `Eternaê`

const telefone = cliente.whatsapp.replace(/\D/g, '')

window.open(
  `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`,
  '_blank'
)
}  return (
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
                <th className="text-left p-4 text-gray-600">Produtos</th>
                <th className="text-left p-4 text-gray-600">Data</th>
                <th className="text-left p-4 text-gray-600">Itens</th>
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

                  <td className="p-4 text-sm text-gray-600 max-w-xs">
                    {nomesProdutos(orcamento)}
                  </td>

                  <td className="p-4">
                    {formatarData(orcamento.created_at)}
                  </td>

                  <td className="p-4">
                    {quantidadeItens(orcamento)} item(ns)
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
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => editarOrcamento(orcamento)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => enviarWhatsApp(orcamento)}
                        className="text-green-600 hover:text-green-800"
                      >
                        WhatsApp
                      </button>

                      <button
                        onClick={() => excluirOrcamento(orcamento.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>

                      {orcamento.status === 'Aprovado' && !jaVirouPedido(orcamento) && (
                        <button
                          onClick={() => converterEmPedido(orcamento)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Converter em Pedido
                        </button>
                      )}

                      {jaVirouPedido(orcamento) && (
                        <span className="text-gray-500">
                          Pedido criado
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {orcamentos.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
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
          produtos={produtos}
          orcamento={orcamentoEditando}
        />
      </main>
    </div>
  )
}