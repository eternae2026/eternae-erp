import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Kits() {
  const [kits, setKits] = useState([])
  const [produtos, setProdutos] = useState([])
  const [itensVendaveis, setItensVendaveis] = useState([])
  const [kitSelecionado, setKitSelecionado] = useState(null)
  const [kitEditando, setKitEditando] = useState(null)
  const [openModalKit, setOpenModalKit] =
  useState(false)
  const [itensKit, setItensKit] = useState([])
  const [
  configuracaoSistema,
  setConfiguracaoSistema
] = useState(null)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [descontoPercentual, setDescontoPercentual] = useState('0')

  const [tipoItemSelecionado, setTipoItemSelecionado] =
  useState('produto')

const [itemSelecionadoId, setItemSelecionadoId] =
  useState('')

const [quantidade, setQuantidade] =
  useState('1')

  async function carregarKits() {
  const { data, error } = await supabase
    .from('kits')
    .select(`
      *,
      kit_itens (
        id,
        kit_id,
        tipo_item,
        produto_id,
        estoque_id,
        quantidade,
        produtos (
          id,
          nome,
          preco,
          preco_final,
          margem_lucro
        ),
        estoque (
          id,
          nome,
          categoria,
          categoria_item,
          vendavel,
          embalagem_premium,
          preco_venda,
          custo_unitario,
          unidade
        )
      )
    `)
    .order('created_at', {
      ascending: false
    })

  if (error) {
    console.log(
      'Erro ao carregar kits:',
      error
    )
    return
  }

  setKits(data || [])
}

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .gt('preco', 0)
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar produtos:', error)
      return
    }

    setProdutos(data || [])
  }

  async function carregarItensVendaveis() {
  const { data, error } = await supabase
    .from('estoque')
    .select(`
      id,
      nome,
      categoria,
      categoria_item,
      vendavel,
      embalagem_premium,
      preco_venda,
      custo_unitario,
      quantidade_disponivel,
      quantidade_reservada,
      unidade
    `)
    .eq('vendavel', true)
    .in('categoria_item', [
      'acessorio',
      'embalagem'
    ])
    .order('categoria_item', {
      ascending: true
    })
    .order('nome', {
      ascending: true
    })

  if (error) {
    console.log(
      'Erro ao carregar itens vendáveis:',
      error
    )

    setItensVendaveis([])
    return
  }

  setItensVendaveis(data || [])
}

async function carregarConfiguracaoSistema() {
  const { data } = await supabase
    .from('configuracoes_sistema')
    .select('*')
    .limit(1)
    .single()

  setConfiguracaoSistema(data)
}

  async function carregarItensKit(kitId) {
  const { data, error } = await supabase
    .from('kit_itens')
    .select(`
      id,
      kit_id,
      tipo_item,
      produto_id,
      estoque_id,
      quantidade,
      produtos (
        id,
        nome,
        preco,
        preco_final,
        margem_lucro
      ),
      estoque (
        id,
        nome,
        categoria,
        categoria_item,
        vendavel,
        embalagem_premium,
        preco_venda,
        custo_unitario,
        unidade
      )
    `)
    .eq('kit_id', kitId)

  if (error) {
    console.log(
      'Erro ao carregar itens do kit:',
      error
    )

    return []
  }

  setItensKit(data || [])

  return data || []
}

  useEffect(() => {
  carregarKits()
  carregarProdutos()
  carregarItensVendaveis()
  carregarConfiguracaoSistema()
}, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      maximumFractionDigits: 2
    })
  }

  function precoProduto(produto) {
    return Number(produto?.preco_final || produto?.preco || 0)
  }

  function margemProduto(produto) {
    return Number(produto?.margem_lucro || 0) / 100
  }

  function custoEstimadoProduto(produto) {
    const preco = precoProduto(produto)
    const margem = margemProduto(produto)

    return preco * (1 - margem)
  }

  function itemEhProduto(item) {
  return (
    item.tipo_item === 'produto' ||
    Boolean(item.produto_id)
  )
}

function itemEhEstoque(item) {
  return (
    item.tipo_item === 'estoque' ||
    Boolean(item.estoque_id)
  )
}

function calcularSubtotal(itens) {
  return itens.reduce((total, item) => {
    const quantidadeItem =
      Number(item.quantidade || 0)

    if (itemEhProduto(item)) {
      return (
        total +
        precoProduto(item.produtos) *
          quantidadeItem
      )
    }

    /*
      Acessórios e embalagens não aumentam
      o valor individual usado como base
      para o desconto do kit.

      Dentro do kit, eles entram somente
      pelo custo.
    */
    return total
  }, 0)
}

function calcularCusto(itens) {
  return itens.reduce((total, item) => {
    const quantidadeItem =
      Number(item.quantidade || 0)

    if (itemEhProduto(item)) {
      return (
        total +
        custoEstimadoProduto(
          item.produtos
        ) *
          quantidadeItem
      )
    }

    if (itemEhEstoque(item)) {
      const custoUnitario =
        Number(
          item.estoque?.custo_unitario ||
          0
        )

      return (
        total +
        custoUnitario *
          quantidadeItem
      )
    }

    return total
  }, 0)
}

  function calcularMetricas(kit, itens) {
    const valorIndividual = calcularSubtotal(itens)
    const descontoPercentual = Number(kit?.desconto_percentual || 0)
    const valorDesconto = valorIndividual * (descontoPercentual / 100)
    const precoFinal = valorIndividual - valorDesconto
    const custoEstimado = calcularCusto(itens)
    const lucroEstimado = precoFinal - custoEstimado
    const margemEstimada = precoFinal > 0 ? (lucroEstimado / precoFinal) * 100 : 0

    let statusMargem = 'Crítica'

    if (margemEstimada >= 50) {
      statusMargem = 'Saudável'
    } else if (margemEstimada >= 35) {
      statusMargem = 'Reduzida'
    }

    return {
      valor_individual: valorIndividual,
      valor_desconto: valorDesconto,
      preco_final: precoFinal,
      lucro_estimado: lucroEstimado,
      margem_estimada: margemEstimada,
      status_margem: statusMargem
    }
  }

  async function atualizarMetricasKit(kit, itens) {
    const metricas = calcularMetricas(kit, itens)

    const { data, error } = await supabase
      .from('kits')
      .update(metricas)
      .eq('id', kit.id)
      .select()
      .single()

    if (error) {
      console.log('Erro ao atualizar métricas do kit:', error)
      return null
    }

    return data
  }

  async function salvarKit() {
    if (!nome) {
      alert('Informe o nome do kit.')
      return
    }

    if (kitEditando) {
      const { data, error } = await supabase
        .from('kits')
        .update({
          nome,
          descricao,
          desconto_percentual: Number(descontoPercentual || 0)
        })
        .eq('id', kitEditando.id)
        .select()
        .single()

      if (error) {
        console.log('Erro ao editar kit:', error)
        alert('Erro ao editar kit.')
        return
      }

      const itens = await carregarItensKit(data.id)
      await atualizarMetricasKit(data, itens)

      await carregarKits()

      if (kitSelecionado?.id === data.id) {
        setKitSelecionado(data)
      }

      setKitEditando(null)
setNome('')
setDescricao('')
setDescontoPercentual('0')
setOpenModalKit(false)

alert('Kit atualizado!')
return
    }

    const { data, error } = await supabase
      .from('kits')
      .insert([
        {
          nome,
          descricao,
          desconto_percentual: Number(descontoPercentual || 0),
          ativo: true
        }
      ])
      .select()

    if (error) {
      console.log('Erro ao salvar kit:', error)
      alert('Erro ao salvar kit.')
      return
    }

    setKits([data[0], ...kits])
setNome('')
setDescricao('')
setDescontoPercentual('0')
setOpenModalKit(false)

alert('Kit criado com sucesso!')
  }

  function editarKit(kit) {
  setKitEditando(kit)
  setNome(kit.nome || '')
  setDescricao(kit.descricao || '')
  setDescontoPercentual(kit.desconto_percentual || '0'
  )

    setOpenModalKit(true)
 }

  function cancelarEdicao() {
    setKitEditando(null)
    setNome('')
    setDescricao('')
    setDescontoPercentual('0')
    setOpenModalKit(false)
  }

  async function excluirKit(id) {
    const confirmar = confirm('Tem certeza que deseja excluir este kit?')
    if (!confirmar) return

    const { error } = await supabase
      .from('kits')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao excluir kit:', error)
      alert('Erro ao excluir kit.')
      return
    }

    setKits(kits.filter(kit => kit.id !== id))

    if (kitSelecionado?.id === id) {
      setKitSelecionado(null)
      setItensKit([])
    }
  }

 async function duplicarKit(kit) {
  const { data: novoKit, error: erroKit } = await supabase
    .from('kits')
    .insert([
      {
        nome: `${kit.nome} (Cópia)`,
        descricao: kit.descricao,
        desconto_percentual: kit.desconto_percentual,
        ativo: true,
        valor_individual: kit.valor_individual,
        valor_desconto: kit.valor_desconto,
        preco_final: kit.preco_final,
        lucro_estimado: kit.lucro_estimado,
        margem_estimada: kit.margem_estimada,
        status_margem: kit.status_margem
      }
    ])
    .select()
    .single()

  if (erroKit) {
    console.log('Erro ao duplicar kit:', erroKit)
    alert('Erro ao duplicar kit.')
    return
  }

  const itens = kit.kit_itens || []

  if (itens.length > 0) {
    const itensDuplicados =
  itens.map(item => ({
    kit_id: novoKit.id,
    tipo_item: item.tipo_item,
    produto_id: item.produto_id,
    estoque_id: item.estoque_id,
    quantidade: item.quantidade
  }))

    const { error: erroItens } = await supabase
      .from('kit_itens')
      .insert(itensDuplicados)

    if (erroItens) {
      console.log('Erro ao copiar itens:', erroItens)
    }
  }

  await carregarKits()

  alert('Kit duplicado com sucesso!')
}
  
  async function selecionarKit(kit) {
  setKitSelecionado(kit)
  setTipoItemSelecionado('produto')
  setItemSelecionadoId('')
  setQuantidade('1')

  await carregarItensKit(kit.id)
}

  async function adicionarItemAoKit() {
  if (!kitSelecionado) {
    alert('Selecione um kit.')
    return
  }

  if (!itemSelecionadoId) {
    alert('Selecione um item.')
    return
  }

  const quantidadeNumero =
    Number(quantidade || 0)

  if (quantidadeNumero <= 0) {
    alert(
      'Informe uma quantidade maior que zero.'
    )
    return
  }

  const itemJaExiste = itensKit.some(item => {
    if (
      tipoItemSelecionado === 'produto'
    ) {
      return (
        item.tipo_item === 'produto' &&
        String(item.produto_id) ===
          String(itemSelecionadoId)
      )
    }

    return (
      item.tipo_item === 'estoque' &&
      String(item.estoque_id) ===
        String(itemSelecionadoId)
    )
  })

  if (itemJaExiste) {
    alert(
      'Este item já faz parte do kit.'
    )
    return
  }

  const dadosNovoItem =
    tipoItemSelecionado === 'produto'
      ? {
          kit_id: kitSelecionado.id,
          tipo_item: 'produto',
          produto_id: itemSelecionadoId,
          estoque_id: null,
          quantidade: quantidadeNumero
        }
      : {
          kit_id: kitSelecionado.id,
          tipo_item: 'estoque',
          produto_id: null,
          estoque_id: itemSelecionadoId,
          quantidade: quantidadeNumero
        }

  const { error } = await supabase
    .from('kit_itens')
    .insert([dadosNovoItem])

  if (error) {
    console.log(
      'Erro ao adicionar item ao kit:',
      error
    )

    alert(
      'Erro ao adicionar item ao kit.'
    )
    return
  }

  setItemSelecionadoId('')
  setQuantidade('1')

  const itens = await carregarItensKit(
    kitSelecionado.id
  )

  const kitAtualizado =
    await atualizarMetricasKit(
      kitSelecionado,
      itens
    )

  if (kitAtualizado) {
    setKitSelecionado(kitAtualizado)
  }

  await carregarKits()
}

  async function removerItemKit(id) {
    const { error } = await supabase
      .from('kit_itens')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao remover item:', error)
      alert('Erro ao remover item.')
      return
    }

    const itens = await carregarItensKit(kitSelecionado.id)
    const kitAtualizado = await atualizarMetricasKit(kitSelecionado, itens)

    if (kitAtualizado) {
      setKitSelecionado(kitAtualizado)
    }

    await carregarKits()
  }

  function nomesItensKit(kit) {
  const itens = kit.kit_itens || []

  if (itens.length === 0) {
    return 'Nenhum item'
  }

  return itens
    .map(item => {
      const quantidadeItem =
        Number(item.quantidade || 0)

      const nomeItem =
        item.produtos?.nome ||
        item.estoque?.nome ||
        'Item não identificado'

      return `${quantidadeItem}x ${nomeItem}`
    })
    .join(', ')
}

  function kitPossuiEmbalagemPremium() {
    return itensKit.some(item =>
    item.estoque?.embalagem_premium
  )
}

function custoEmbalagemKit() {
  if (
    kitPossuiEmbalagemPremium()
  ) {
    return 0
  }

  return Number(
    configuracaoSistema
      ?.embalagem_padrao || 0
  )
}

  function subtotalProdutos() {
    return calcularSubtotal(itensKit)
  }

  function valorDesconto() {
    const desconto = Number(kitSelecionado?.desconto_percentual || 0)

    return subtotalProdutos() * (desconto / 100)
  }

  function precoFinalKit() {
    return subtotalProdutos() - valorDesconto()
  }

  function custoEstimadoKit() {
  return (
    calcularCusto(itensKit) +
    custoEmbalagemKit()
  )
}

  function lucroEstimadoKit() {
    return precoFinalKit() - custoEstimadoKit()
  }

  function margemKit() {
    const preco = precoFinalKit()

    if (preco <= 0) return 0

    return (lucroEstimadoKit() / preco) * 100
  }

  function statusMargemKit() {
    const margem = margemKit()

    if (margem >= 50) return 'Saudável'
    if (margem >= 35) return 'Reduzida'
    return 'Crítica'
  }

  function corStatus(status) {
    if (status === 'Saudável') return 'bg-green-100 text-green-700'
    if (status === 'Reduzida') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex items-start justify-between gap-4 mb-8">

  <div>
    <h1 className="text-3xl font-bold text-gray-800">
      Kits
    </h1>

    <p className="text-gray-500 mt-1">
      Monte combinações especiais de produtos,
      acessórios e embalagens.
    </p>
  </div>

  <button
    onClick={() => {
      setKitEditando(null)

      setNome('')
      setDescricao('')
      setDescontoPercentual('0')

      setOpenModalKit(true)
    }}
    className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
  >
    ➕ Novo Kit
  </button>

</div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
  <div className="max-h-[500px] overflow-auto">
    <table className="w-full min-w-[1250px] table-fixed">
      <colgroup>
  <col className="w-[15%]" />
  <col className="w-[14%]" />
  <col className="w-[10%]" />
  <col className="w-[10%]" />
  <col className="w-[10%]" />
  <col className="w-[9%]" />
  <col className="w-[8%]" />
  <col className="w-[8%]" />
  <col className="w-[16%]" />
</colgroup>

            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="text-left p-4 text-gray-600">Kit</th>
                <th className="text-left p-4 text-gray-600">Itens</th>
                <th className="text-left p-4 text-gray-600">Valor Individual</th>
                <th className="text-left p-4 text-gray-600">Desconto</th>
                <th className="text-left p-4 text-gray-600">Preço Kit</th>
                <th className="text-left p-4 text-gray-600">Lucro</th>
                <th className="text-left p-4 text-gray-600">Margem</th>
                <th className="text-left p-4 text-gray-600">Status</th>
                <th className="text-left p-4 text-gray-600">Ações</th>
              </tr>
            </thead>

            <tbody>
  {kits.map(kit => (
    <tr
      key={kit.id}
      className="border-t align-top"
    >
      <td className="p-4">
        <div>
          <p className="font-semibold text-gray-800">
            {kit.nome}
          </p>

          {kit.descricao && (
            <p className="text-sm text-gray-500 mt-1">
              {kit.descricao}
            </p>
          )}
        </div>
      </td>

      <td className="p-4 text-sm text-gray-600 break-words">
        {nomesItensKit(kit)}
      </td>

      <td className="p-4">
        {formatarMoeda(kit.valor_individual)}
      </td>

      <td className="p-4">
        <p className="font-medium text-gray-800">
          {kit.desconto_percentual || 0}%
        </p>

        <p className="text-xs text-gray-500 mt-1">
          {formatarMoeda(kit.valor_desconto)}
        </p>
      </td>

      <td className="p-4 font-semibold text-green-700">
        {formatarMoeda(kit.preco_final)}
      </td>

      <td className="p-4">
        {formatarMoeda(kit.lucro_estimado)}
      </td>

      <td className="p-4">
        {formatarNumero(kit.margem_estimada)}%
      </td>

      <td className="p-4">
        <span
          className={`${corStatus(
            kit.status_margem
          )} inline-flex px-3 py-1 rounded-full text-sm`}
        >
          {kit.status_margem || 'Saudável'}
        </span>
      </td>

      <td className="p-4">
  <div className="flex items-center gap-2 whitespace-nowrap">

    <button
      type="button"
      onClick={() => editarKit(kit)}
      className="
        px-3 py-2
        rounded-lg
        border border-gray-300
        bg-white
        text-sm font-medium text-gray-700
        hover:bg-gray-50
        transition
      "
    >
      Editar
    </button>

    <button
      type="button"
      onClick={() => selecionarKit(kit)}
      className="
        px-3 py-2
        rounded-lg
        bg-gray-900
        text-sm font-medium text-white
        hover:bg-gray-800
        transition
      "
    >
      Montar
    </button>

    <button
      type="button"
      onClick={() => duplicarKit(kit)}
      title="Duplicar kit"
      aria-label="Duplicar kit"
      className="
        w-9 h-9
        rounded-lg
        border border-gray-300
        bg-white
        flex items-center justify-center
        text-lg font-semibold text-gray-600
        hover:bg-gray-50
        hover:text-gray-900
        transition
      "
    >
      ⧉
    </button>

    <button
      type="button"
      onClick={() => excluirKit(kit.id)}
      title="Excluir kit"
      aria-label="Excluir kit"
      className="
        w-9 h-9
        rounded-lg
        border border-red-200
        bg-white
        flex items-center justify-center
        text-lg font-semibold text-red-600
        hover:bg-red-50
        hover:border-red-300
        transition
      "
    >
      🗑
    </button>

  </div>
</td>
    </tr>
  ))}

  {kits.length === 0 && (
    <tr>
      <td
        colSpan="9"
        className="p-8 text-center text-gray-500"
      >
        Nenhum kit cadastrado.
      </td>
    </tr>
  )}
</tbody>

          </table>
        </div>
      </div>

{openModalKit && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
    <div className="bg-white w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {kitEditando
              ? 'Editar Kit'
              : 'Novo Kit'}
          </h2>

          <p className="text-gray-500 mt-1">
            Configure as informações básicas do kit.
          </p>
        </div>

        <button
          type="button"
          onClick={cancelarEdicao}
          className="text-gray-500 hover:text-gray-800 text-xl"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do kit
          </label>

          <input
            type="text"
            placeholder="Ex.: Kit Café com Afeto"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desconto do kit
          </label>

          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              value={descontoPercentual}
              onChange={(e) =>
                setDescontoPercentual(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3 pr-12"
            />

            <span className="absolute right-4 top-3 text-gray-500">
              %
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>

          <textarea
            rows="4"
            placeholder="Descreva a proposta e os itens principais do kit..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />
        </div>

      </div>

      <div className="flex justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={cancelarEdicao}
          className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={salvarKit}
          className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          {kitEditando
            ? 'Salvar alterações'
            : 'Salvar Kit'}
        </button>
      </div>

    </div>
  </div>
)}

        {kitSelecionado && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-6xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Montar Kit: {kitSelecionado.nome}
          </h2>

          <p className="text-gray-500">
  Adicione produtos, acessórios e embalagens que fazem parte deste kit.
</p>
        </div>

        <button
          onClick={() => {
            setKitSelecionado(null)
            setItensKit([])
          }}
          className="text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-2 grid grid-cols-2 gap-3">

  <select
    value={tipoItemSelecionado}
    onChange={(e) => {
      setTipoItemSelecionado(
        e.target.value
      )

      setItemSelecionadoId('')
    }}
    className="border rounded-xl px-4 py-3 bg-white"
  >
    <option value="produto">
      Produto
    </option>

    <option value="estoque">
      Acessório ou embalagem
    </option>
  </select>

  <select
    value={itemSelecionadoId}
    onChange={(e) =>
      setItemSelecionadoId(
        e.target.value
      )
    }
    className="border rounded-xl px-4 py-3 bg-white"
  >
    <option value="">
      Selecione um item
    </option>

    {tipoItemSelecionado === 'produto' ? (
      produtos.map(produto => (
        <option
          key={produto.id}
          value={produto.id}
        >
          {produto.nome}
          {' — '}
          {formatarMoeda(
            precoProduto(produto)
          )}
        </option>
      ))
    ) : (
      <>
        <optgroup label="Acessórios">
          {itensVendaveis
            .filter(
              item =>
                item.categoria_item ===
                'acessorio'
            )
            .map(item => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.nome}
                {' — custo '}
                {formatarMoeda(
                  item.custo_unitario
                )}
              </option>
            ))}
        </optgroup>

        <optgroup label="Embalagens">
          {itensVendaveis
            .filter(
              item =>
                item.categoria_item ===
                'embalagem'
            )
            .map(item => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.nome}
                {' — custo '}
                {formatarMoeda(
                  item.custo_unitario
                )}
              </option>
            ))}
        </optgroup>
      </>
    )}

  </select>

</div>

        <input
          type="number"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="border rounded-xl px-4 py-3"
        />

        <button
          onClick={adicionarItemAoKit}
          className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          + Adicionar
        </button>
      </div>

      <div className="border rounded-2xl overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
  <tr>
    <th className="text-left p-4 text-gray-600">
      Item
    </th>

    <th className="text-left p-4 text-gray-600">
      Tipo
    </th>

    <th className="text-left p-4 text-gray-600">
      Qtd
    </th>

    <th className="text-left p-4 text-gray-600">
      Preço Unit.
    </th>

    <th className="text-left p-4 text-gray-600">
      Subtotal
    </th>

    <th className="text-left p-4 text-gray-600">
      Ações
    </th>
  </tr>
</thead>

          <tbody>
            {itensKit.map(item => (
              <tr key={item.id} className="border-t">
                <td className="p-4">
  <p className="font-medium text-gray-800">
    {item.produtos?.nome ||
      item.estoque?.nome ||
      '-'}
  </p>
</td>

<td className="p-4">
  <span
    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
      itemEhProduto(item)
        ? 'bg-blue-50 text-blue-700'
        : item.estoque?.categoria_item === 'embalagem'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-violet-50 text-violet-700'
    }`}
  >
    {itemEhProduto(item)
      ? 'Produto'
      : item.estoque?.categoria_item === 'embalagem'
        ? 'Embalagem'
        : 'Acessório'}
  </span>
</td>

<td className="p-4">
  {item.quantidade}
</td>

                <td className="p-4">
                  {formatarMoeda(
  itemEhProduto(item)
    ? precoProduto(item.produtos)
    : item.estoque?.custo_unitario || 0
)}
                </td>

                <td className="p-4 font-semibold">
                  {formatarMoeda(
  (
    itemEhProduto(item)
      ? precoProduto(item.produtos)
      : Number(
          item.estoque
            ?.custo_unitario || 0
        )
  ) *
    Number(item.quantidade || 0)
)}
                </td>

                <td className="p-4">
                  <button
                    onClick={() => removerItemKit(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}

            {itensKit.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="p-6 text-center text-gray-500"
                >
                  Nenhum item adicionado ao kit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Valor individual</p>
          <p className="font-semibold text-gray-800">
            {formatarMoeda(subtotalProdutos())}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Desconto</p>
          <p className="font-semibold text-gray-800">
            {formatarMoeda(valorDesconto())}
          </p>
        </div>

        <div className="bg-gray-900 text-white rounded-xl p-4">
          <p className="text-sm text-gray-300">Preço do Kit</p>
          <p className="font-bold">
            {formatarMoeda(precoFinalKit())}
          </p>
        </div>

<div className="bg-gray-50 rounded-xl p-4">

  <p className="text-sm text-gray-500">
    Embalagem
  </p>

  <p className="font-semibold text-gray-800">
    {formatarMoeda(
      custoEmbalagemKit()
    )}
  </p>

  {kitPossuiEmbalagemPremium() && (
    <p className="text-xs text-green-600 mt-2">
      Embalagem premium detectada
    </p>
  )}

</div>

        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-700">Lucro estimado</p>
          <p className="font-bold text-green-700">
            {formatarMoeda(lucroEstimadoKit())}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Margem</p>
          <p className="font-semibold text-gray-800">
            {formatarNumero(margemKit())}%
          </p>

          <span className={`${corStatus(statusMargemKit())} inline-block mt-2 px-3 py-1 rounded-full text-xs`}>
            {statusMargemKit()}
          </span>
        </div>
      </div>

    </div>
  </div>
)}

</main>
    </div>
  )
}