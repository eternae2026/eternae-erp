import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import OrcamentoModal from '../../components/OrcamentoModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Orcamentos() {
  const [openModal, setOpenModal] = useState(false)
  const [orcamentoEditando, setOrcamentoEditando] = useState(null)
  const [clientes, setClientes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [orcamentos, setOrcamentos] = useState([])
  const [configuracoes, setConfiguracoes] = useState(null)

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

  async function carregarConfiguracoes() {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.log('Erro ao carregar configurações:', error)
      return
    }

    setConfiguracoes(data)
  }

  async function carregarOrcamentos() {
    const { data: listaOrcamentos, error } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes (
          nome
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

    const { data: listaPedidos, error: erroPedidos } = await supabase
      .from('pedidos')
      .select('id, orcamento_id')

    if (erroPedidos) {
      console.log('Erro ao carregar pedidos vinculados:', erroPedidos)
      setOrcamentos(listaOrcamentos || [])
      return
    }

    const orcamentosTratados = (listaOrcamentos || []).map(orcamento => {
      const pedido = (listaPedidos || []).find(
        item => item.orcamento_id === orcamento.id
      )

      return {
        ...orcamento,
        pedido_criado: Boolean(pedido),
        pedido_id: pedido?.id || null
      }
    })

    setOrcamentos(orcamentosTratados)
  }

  useEffect(() => {
    carregarClientes()
    carregarProdutos()
    carregarConfiguracoes()
    carregarOrcamentos()
  }, [])

  async function salvarNovoOrcamento(orcamento) {
    const { itens, ...dadosOrcamento } = orcamento

    const { data, error } = await supabase
      .from('orcamentos')
      .insert([dadosOrcamento])
      .select()

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
        kit_id: item.kit_id,
        tipo_item: item.tipo_item,
        nome_item: item.nome_item,
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
          kit_id: item.kit_id,
          tipo_item: item.tipo_item,
          nome_item: item.nome_item,
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

  function jaVirouPedido(orcamento) {
    return Boolean(orcamento.pedido_criado)
  }

  async function excluirOrcamento(orcamento) {
    if (jaVirouPedido(orcamento)) {
      alert('Este orçamento já foi convertido em pedido e não pode ser excluído.')
      return
    }

    const confirmar = confirm('Tem certeza que deseja excluir este orçamento?')
    if (!confirmar) return

    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', orcamento.id)

    if (error) {
      console.log('Erro ao excluir orçamento:', error)
      alert('Erro ao excluir orçamento.')
      return
    }

    setOrcamentos(
      orcamentos.filter(item => item.id !== orcamento.id)
    )
  }

  async function converterEmPedido(orcamento) {
    const confirmar = confirm('Deseja aprovar este orçamento e gerar o pedido automaticamente?')
    if (!confirmar) return

    const { data: pedidoCriado, error: erroPedido } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_id: orcamento.cliente_id,
          orcamento_id: orcamento.id,
          valor: orcamento.valor,
          etapa_producao: 'Aguardando Pagamento',
          estoque_baixado: false
        }
      ])
      .select()

    if (erroPedido) {
      console.log('Erro ao converter em pedido:', erroPedido)

      if (erroPedido.code === '23505') {
        alert('Este orçamento já foi convertido em pedido.')
        await carregarOrcamentos()
        return
      }

      alert('Erro ao converter orçamento em pedido.')
      return
    }

    const novoPedido = pedidoCriado[0]

    const { error: erroFinanceiro } = await supabase
      .from('financeiro')
      .insert([
        {
          pedido_id: novoPedido.id,
          cliente_id: orcamento.cliente_id,
          valor: orcamento.valor,
          forma_pagamento: 'PIX',
          status: 'Pendente'
        }
      ])

    if (erroFinanceiro) {
      console.log('Erro ao gerar cobrança:', erroFinanceiro)
      alert('Pedido criado, mas houve erro ao gerar a cobrança financeira.')
      await carregarOrcamentos()
      return
    }

    const { error: erroStatus } = await supabase
      .from('orcamentos')
      .update({
        status: 'Aprovado'
      })
      .eq('id', orcamento.id)

    if (erroStatus) {
      console.log('Erro ao aprovar orçamento:', erroStatus)
      alert('Pedido e cobrança criados, mas houve erro ao marcar o orçamento como aprovado.')
      await carregarOrcamentos()
      return
    }

    alert('Orçamento aprovado, pedido criado e cobrança gerada com sucesso!')
    await carregarOrcamentos()
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

  function quantidadeItens(orcamento) {
    return orcamento.orcamento_itens?.length || 0
  }

  function nomeItem(item) {
    return item.nome_item || item.produtos?.nome || 'Item'
  }

  function nomesProdutos(orcamento) {
    const itens = orcamento.orcamento_itens || []

    if (itens.length === 0) return 'Sem itens'

    return itens
      .map(item => nomeItem(item))
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
      mensagem += `Item: ${nomeItem(item)}\n`
      mensagem += `Valor unitário: ${formatarMoeda(item.valor_unitario)}\n`
      mensagem += `Quantidade: ${item.quantidade}\n`
      mensagem += `Subtotal: ${formatarMoeda(item.subtotal)}\n\n`
    })

    mensagem += `------------------------------\n`
    mensagem += `Total do orçamento: ${formatarMoeda(orcamento.valor)}\n\n`
    mensagem += `${configuracoes?.mensagem_orcamento || 'Aguardamos sua aprovação.'}\n\n`
    mensagem += `${configuracoes?.nome_empresa || 'Eternaê'}`

    const telefone = cliente.whatsapp.replace(/\D/g, '')

    window.open(
      `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`,
      '_blank'
    )
  }

  function gerarPDF(orcamento) {
  const doc = new jsPDF()
  const clienteNome = orcamento.clientes?.nome || 'Cliente não informado'
  const itens = orcamento.orcamento_itens || []

  const nomeEmpresa = configuracoes?.nome_empresa || 'Eternaê'
  const whatsapp = configuracoes?.whatsapp || ''
  const instagram = configuracoes?.instagram || ''
  const email = configuracoes?.email || ''
  const site = configuracoes?.site || ''
  const pix = configuracoes?.pix || ''
  const prazo = configuracoes?.prazo_padrao || ''
  const mensagem = configuracoes?.mensagem_orcamento || 'Aguardamos sua aprovação.'

  const numeroOrcamento = orcamento.id?.slice(0, 8).toUpperCase() || '00000000'

  // Cabeçalho
  doc.setFillColor(31, 41, 55)
  doc.rect(0, 0, 210, 34, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont(undefined, 'bold')
  doc.text(nomeEmpresa, 14, 16)

  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text('Proposta comercial personalizada', 14, 24)

  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('ORÇAMENTO', 196, 16, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.text(`Nº ${numeroOrcamento}`, 196, 24, { align: 'right' })

  // Contatos
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)

  const contatos = []
  if (whatsapp) contatos.push(`WhatsApp: ${whatsapp}`)
  if (instagram) contatos.push(`Instagram: ${instagram}`)
  if (email) contatos.push(`E-mail: ${email}`)
  if (site) contatos.push(`Site: ${site}`)

  if (contatos.length > 0) {
    doc.text(contatos.join('  |  '), 14, 43)
  }

  // Dados do cliente
  doc.setDrawColor(230, 230, 230)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, 52, 182, 30, 3, 3, 'FD')

  doc.setTextColor(31, 41, 55)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('Dados do cliente', 20, 62)

  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  doc.text(`Cliente: ${clienteNome}`, 20, 70)
doc.text(`Data: ${formatarData(orcamento.created_at)}`, 20, 77)

  // Tabela
  autoTable(doc, {
    startY: 92,
    head: [['Item', 'Qtd', 'Valor Unitário', 'Subtotal']],
    body: itens.map(item => [
      nomeItem(item),
      item.quantidade,
      formatarMoeda(item.valor_unitario),
      formatarMoeda(item.subtotal)
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  })

  const finalY = doc.lastAutoTable.finalY || 110

  // Total
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(116, finalY + 10, 80, 24, 3, 3, 'F')

  doc.setTextColor(31, 41, 55)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text('Total do orçamento', 122, finalY + 20)

  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text(formatarMoeda(orcamento.valor), 190, finalY + 20, { align: 'right' })

  let y = finalY + 48

  // Condições
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Condições comerciais', 14, y)

  y += 8

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')

  if (prazo) {
    doc.text(`Prazo de produção: ${prazo}`, 14, y)
    y += 7
  }

  doc.text(mensagem, 14, y, { maxWidth: 180 })
  y += 14

  if (pix) {
    doc.setFont(undefined, 'bold')
    doc.text('Pagamento via PIX', 14, y)
    y += 7

    doc.setFont(undefined, 'normal')
    doc.text(`Chave PIX: ${pix}`, 14, y)
    y += 10
  }

  // Rodapé
  doc.setDrawColor(230, 230, 230)
  doc.line(14, 280, 196, 280)

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`${nomeEmpresa} • Criando memórias afetivas em cada detalhe.`, 105, 287, {
    align: 'center'
  })

  doc.save(`orcamento-${clienteNome}.pdf`)
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
                        onClick={() => gerarPDF(orcamento)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        PDF
                      </button>

                      {!jaVirouPedido(orcamento) && (
                        <button
                          onClick={() => excluirOrcamento(orcamento)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      )}

                      {!jaVirouPedido(orcamento) && (
                        <button
                          onClick={() => converterEmPedido(orcamento)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Aprovar e Gerar Pedido
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