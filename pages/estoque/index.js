import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import InsumoModal from '../../components/InsumoModal'
import { supabase } from '../../lib/supabase'

export default function Estoque() {
  const [itensEstoque, setItensEstoque] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState(null)
  const [menuAberto, setMenuAberto] = useState(null)
  const [filtroTipo, setFiltroTipo] =
useState('todos')

const [filtroAtivo, setFiltroAtivo] =
useState('ativos')

const [buscaItem, setBuscaItem] =
useState('')

  async function carregarEstoque() {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar estoque:', error)
      return
    }

    setItensEstoque(data || [])
  }

  useEffect(() => {
    carregarEstoque()
  }, [])

  useEffect(() => {
  function fecharMenuAoClicarFora() {
    setMenuAberto(null)
  }

  if (menuAberto !== null) {
    document.addEventListener(
      'click',
      fecharMenuAoClicarFora
    )
  }

  return () => {
    document.removeEventListener(
      'click',
      fecharMenuAoClicarFora
    )
  }
}, [menuAberto])

  async function salvarInsumo(insumo) {
    if (insumoEditando) {
      const { error } = await supabase
        .from('estoque')
        .update(insumo)
        .eq('id', insumoEditando.id)

      if (error) {
        console.log(error)
        alert('Erro ao editar insumo.')
        return
      }

      setInsumoEditando(null)
      setOpenModal(false)
      carregarEstoque()
      return
    }

    const { error } = await supabase
      .from('estoque')
      .insert([insumo])

    if (error) {
      console.log(error)
      alert('Erro ao salvar insumo.')
      return
    }

    setOpenModal(false)
    carregarEstoque()
  }

  function editarInsumo(insumo) {
    setInsumoEditando(insumo)
    setOpenModal(true)
  }

  async function desativarInsumo(insumo) {

  const confirmar = window.confirm(
    `Deseja realmente desativar "${insumo.nome}"?`
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('estoque')
    .update({
      ativo: false
    })
    .eq('id', insumo.id)

  if (error) {
    console.log(error)
    alert('Erro ao desativar item.')
    return
  }

  setMenuAberto(null)

  carregarEstoque()
}

async function reativarInsumo(insumo) {

  const confirmar = window.confirm(
    `Deseja realmente reativar "${insumo.nome}"?`
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('estoque')
    .update({
      ativo: true
    })
    .eq('id', insumo.id)

  if (error) {
    console.log(error)
    alert('Erro ao reativar item.')
    return
  }

  setMenuAberto(null)

  carregarEstoque()
}

async function excluirInsumo(insumo) {

  /*
    Verifica em quais produtos o item
    do estoque é utilizado.
  */
  const {
    data: composicoesProduto,
    error: erroComposicoes
  } = await supabase
    .from('produto_composicao')
    .select(`
      id,
      produto_id
    `)
    .eq('insumo_id', insumo.id)

  if (erroComposicoes) {
    console.log(
      'Erro ao verificar composição de produtos:',
      erroComposicoes
    )

    alert(
      'Não foi possível verificar os vínculos deste item.'
    )

    return
  }

  /*
    Verifica se o item foi adicionado
    diretamente a algum kit como
    acessório ou embalagem.
  */
  const {
    data: kitsDiretos,
    error: erroKitsDiretos
  } = await supabase
    .from('kit_itens')
    .select(`
      id,
      kit_id
    `)
    .eq('estoque_id', insumo.id)

  if (erroKitsDiretos) {
    console.log(
      'Erro ao verificar vínculos diretos com kits:',
      erroKitsDiretos
    )

    alert(
      'Não foi possível verificar os vínculos deste item.'
    )

    return
  }

  /*
    Obtém os produtos que utilizam
    este item do estoque.
  */
  const produtosIds = [
    ...new Set(
      (composicoesProduto || [])
        .map(composicao =>
          composicao.produto_id
        )
        .filter(Boolean)
    )
  ]

  /*
    Verifica se algum dos produtos
    encontrados faz parte de kits.
  */
  let kitsIndiretos = []

  if (produtosIds.length > 0) {
    const {
      data,
      error: erroKitsIndiretos
    } = await supabase
      .from('kit_itens')
      .select(`
        id,
        kit_id,
        produto_id
      `)
      .in('produto_id', produtosIds)

    if (erroKitsIndiretos) {
      console.log(
        'Erro ao verificar produtos utilizados em kits:',
        erroKitsIndiretos
      )

      alert(
        'Não foi possível verificar os vínculos deste item.'
      )

      return
    }

    kitsIndiretos = data || []
  }

  /*
    Verifica se o item aparece
    diretamente em orçamento.
  */
  const {
    data: orcamentos,
    error: erroOrcamentos
  } = await supabase
    .from('orcamento_itens')
    .select('id')
    .eq('estoque_id', insumo.id)

  if (erroOrcamentos) {
    console.log(
      'Erro ao verificar orçamentos:',
      erroOrcamentos
    )

    alert(
      'Não foi possível verificar os vínculos deste item.'
    )

    return
  }

  const mensagens = []

  if ((composicoesProduto || []).length > 0) {
    mensagens.push(
      '• Utilizado na composição de Produtos'
    )
  }

  if ((kitsDiretos || []).length > 0) {
    mensagens.push(
      '• Adicionado diretamente a Kits como acessório ou embalagem'
    )
  }

  if (kitsIndiretos.length > 0) {
    mensagens.push(
      '• Utilizado em Produtos que fazem parte de Kits'
    )
  }

  if ((orcamentos || []).length > 0) {
    mensagens.push(
      '• Utilizado diretamente em Orçamentos/Pedidos'
    )
  }

  if (mensagens.length > 0) {
    alert(
`Este item não pode ser excluído.

Motivos:

${mensagens.join('\n')}

Utilize a opção DESATIVAR caso não deseje mais utilizá-lo.`
    )

    setMenuAberto(null)

    return
  }

  const confirmar = window.confirm(
`Deseja realmente excluir "${insumo.nome}"?

Esta ação é definitiva e não poderá ser desfeita.`
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('estoque')
    .delete()
    .eq('id', insumo.id)

  if (error) {
    console.log(
      'Erro ao excluir item:',
      error
    )

    alert(
      'Erro ao excluir item.'
    )

    return
  }

  setMenuAberto(null)

  carregarEstoque()
}

  function quantidadeLivre(item) {
    return (
      Number(item.quantidade_disponivel || 0) -
      Number(item.quantidade_reservada || 0)
    )
  }

  function statusEstoque(item) {
    const livre = quantidadeLivre(item)
    const minimo = Number(item.estoque_minimo || 0)

    if (livre <= 0) return 'Esgotado'
    if (livre <= minimo) return 'Baixo'
    return 'OK'
  }

  function corStatus(status) {
    if (status === 'Esgotado') return 'bg-red-100 text-red-700'
    if (status === 'Baixo') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function tipoVisual(item) {
  if (item.categoria_item === 'embalagem') {
    return 'Embalagem'
  }

  if (item.categoria_item === 'acessorio') {
    return 'Acessório'
  }

  return 'Produção'
}

function vendavelVisual(item) {
  return item.vendavel ? 'Sim' : 'Não'
}

  function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      maximumFractionDigits: 2
    })
  }

    const itensPorAtividadeEBusca = itensEstoque.filter(item => {
    if (
      filtroAtivo === 'ativos' &&
      item.ativo === false
    ) {
      return false
    }

    if (
      filtroAtivo === 'inativos' &&
      item.ativo !== false
    ) {
      return false
    }

    const nomeItem = item.nome || ''
    const textoBusca = buscaItem.trim().toLowerCase()

    if (
      textoBusca &&
      !nomeItem.toLowerCase().includes(textoBusca)
    ) {
      return false
    }

    return true
  })

  const itensFiltrados = itensPorAtividadeEBusca.filter(item => {
    if (filtroTipo === 'todos') {
      return true
    }

    if (filtroTipo === 'vendaveis') {
      return item.vendavel === true
    }

    if (filtroTipo === 'baixo') {
      return statusEstoque(item) === 'Baixo'
    }

    if (filtroTipo === 'esgotado') {
      return statusEstoque(item) === 'Esgotado'
    }

    return item.categoria_item === filtroTipo
  })

  function totalProducao() {
    return itensPorAtividadeEBusca.filter(
      item => item.categoria_item === 'producao'
    ).length
  }

  function totalEmbalagens() {
    return itensPorAtividadeEBusca.filter(
      item => item.categoria_item === 'embalagem'
    ).length
  }

  function totalAcessorios() {
    return itensPorAtividadeEBusca.filter(
      item => item.categoria_item === 'acessorio'
    ).length
  }

  function totalVendaveis() {
    return itensPorAtividadeEBusca.filter(
      item => item.vendavel === true
    ).length
  }

  function totalBaixoEstoque() {
    return itensPorAtividadeEBusca.filter(
      item => statusEstoque(item) === 'Baixo'
    ).length
  }

  function totalEsgotados() {
    return itensPorAtividadeEBusca.filter(
      item => statusEstoque(item) === 'Esgotado'
    ).length
  }

  function totalInsumos() {
    return itensFiltrados.length
  }

  function totalBaixo() {
    return itensFiltrados.filter(
      item => statusEstoque(item) === 'Baixo'
    ).length
  }

  function totalEsgotado() {
    return itensFiltrados.filter(
      item => statusEstoque(item) === 'Esgotado'
    ).length
  }

  function valorTotalEstoque() {
    return itensFiltrados.reduce((total, item) => {
      return total + (
        quantidadeLivre(item) *
        Number(item.custo_unitario || 0)
      )
    }, 0)
  }

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-8 min-w-0">

        <div className="flex items-start justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Estoque
            </h1>

            <p className="text-gray-500">
              Controle de materiais de produção, embalagens, acessórios e custos da Eternaê.
            </p>
          </div>

          <button
            onClick={() => {
              setInsumoEditando(null)
              setOpenModal(true)
            }}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            ➕ Novo Item
          </button>

        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Total de itens
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {totalInsumos()}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Estoque baixo
            </p>

            <h2 className="text-2xl font-bold text-yellow-600 mt-2">
              {totalBaixo()}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Esgotados
            </p>

            <h2 className="text-2xl font-bold text-red-600 mt-2">
              {totalEsgotado()}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Valor em estoque
            </p>

            <h2 className="text-2xl font-bold text-green-700 mt-2">
              {formatarMoeda(valorTotalEstoque())}
            </h2>
          </div>

        </div>

<div className="mb-4">

  <input
    type="text"
    placeholder="Buscar item..."
    value={buscaItem}
    onChange={(e) =>
      setBuscaItem(e.target.value)
    }
    className="
      w-full
      md:w-96
      border
      rounded-xl
      px-4
      py-3
      bg-white
    "
  />

</div>

<div className="flex gap-3 mb-4">

  <button
    onClick={() => setFiltroAtivo('ativos')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroAtivo === 'ativos'
        ? 'bg-green-600 text-white'
        : 'bg-white border'
    }`}
  >
    Ativos
  </button>

  <button
    onClick={() => setFiltroAtivo('inativos')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroAtivo === 'inativos'
        ? 'bg-gray-700 text-white'
        : 'bg-white border'
    }`}
  >
    Inativos
  </button>

  <button
    onClick={() => setFiltroAtivo('todos')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroAtivo === 'todos'
        ? 'bg-blue-600 text-white'
        : 'bg-white border'
    }`}
  >
    Todos
  </button>

</div>

<div className="flex gap-3 mb-6 flex-wrap">

  <button
    onClick={() => setFiltroTipo('todos')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroTipo === 'todos'
        ? 'bg-gray-900 text-white'
        : 'bg-white border'
    }`}
  >
    Todos ({itensPorAtividadeEBusca.length})
  </button>

  <button
    onClick={() => setFiltroTipo('baixo')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroTipo === 'baixo'
        ? 'bg-yellow-500 text-white'
        : 'bg-white border'
    }`}
  >
    Baixo ({totalBaixoEstoque()})
  </button>

  <button
    onClick={() => setFiltroTipo('esgotado')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroTipo === 'esgotado'
        ? 'bg-red-600 text-white'
        : 'bg-white border'
    }`}
  >
    Esgotados ({totalEsgotados()})
  </button>

</div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full">
  <div className="overflow-y-auto overflow-x-hidden max-h-[60vh] w-full">

    <table className="w-full table-fixed text-xs">

      <colgroup>
        <col className="w-[10%]" />
        <col className="w-[7%]" />
        <col className="w-[6%]" />
        <col className="w-[5%]" />
        <col className="w-[6%]" />
        <col className="w-[6%]" />
        <col className="w-[6%]" />
        <col className="w-[5%]" />
        <col className="w-[5%]" />
        <col className="w-[6%]" />
        <col className="w-[7%]" />
        <col className="w-[5%]" />
        <col className="w-[7%]" />
        <col className="w-[6%]" />
        <col className="w-[9%]" />
        <col className="w-[4%]" />
      </colgroup>

      <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200">
        <tr>
          <th className="text-left px-3 py-3 font-semibold text-gray-600">
            Item
          </th>

          <th className="text-left px-2 py-3 font-semibold text-gray-600">
            Categoria
          </th>

          <th className="text-left px-2 py-3 font-semibold text-gray-600">
            Tipo
          </th>

          <th className="text-center px-1 py-3 font-semibold text-gray-600">
            Vendável
          </th>

          <th className="text-right px-2 py-3 font-semibold text-gray-600">
            Preço
          </th>

          <th className="text-right px-2 py-3 font-semibold text-gray-600">
            Disponível
          </th>

          <th className="text-right px-2 py-3 font-semibold text-gray-600">
            Reservado
          </th>

          <th className="text-right px-2 py-3 font-semibold text-gray-600">
            Livre
          </th>

          <th className="text-right px-2 py-3 font-semibold text-gray-600">
            Mínimo
          </th>

          <th className="text-center px-2 py-3 font-semibold text-gray-600">
            Unidade
          </th>

          <th className="text-right px-2 py-3 font-semibold text-gray-600">
            Valor compra
          </th>

          <th className="text-right px-2 py-3 font-semibold text-gray-600">
            Qtd. compra
          </th>

          <th className="text-right px-2 py-3 font-semibold text-gray-700">
            Custo unit.
          </th>

          <th className="text-center px-2 py-3 font-semibold text-gray-600">
            Status
          </th>

          <th className="text-left px-2 py-3 font-semibold text-gray-600">
            Fornecedor
          </th>

          <th className="text-center px-1 py-3 font-semibold text-gray-600">
            Ações
          </th>
        </tr>
      </thead>

            <tbody>

              {itensFiltrados.map(item => {
                const status = statusEstoque(item)

                return (
                  <tr
                    key={item.id}
                    className={`border-t ${
                      status === 'Esgotado'
                        ? 'bg-red-50'
                        : status === 'Baixo'
                          ? 'bg-yellow-50'
                          : ''
                    }`}
                  >
                    <td className="p-4 font-semibold text-gray-800">
                      {item.nome}
                    </td>

                    <td className="p-4">
                      {item.categoria || '-'}
                    </td>

                    <td className="p-4">
  {tipoVisual(item)}
</td>

<td className="p-4">
  <span
    className={`px-3 py-1 rounded-full text-sm ${
      item.vendavel
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    {vendavelVisual(item)}
  </span>
</td>

<td className="p-4 font-semibold">
  {item.vendavel
    ? formatarMoeda(item.preco_venda)
    : '-'}
</td>

                    <td className="p-4">
                      {formatarNumero(item.quantidade_disponivel)}
                    </td>

                    <td className="p-4">
                      {formatarNumero(item.quantidade_reservada)}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatarNumero(quantidadeLivre(item))}
                    </td>

                    <td className="p-4">
                      {formatarNumero(item.estoque_minimo)}
                    </td>

                    <td className="p-4">
                      {item.unidade}
                    </td>

                    <td className="p-4">
                      {formatarMoeda(item.valor_compra)}
                    </td>

                    <td className="p-4">
                      {formatarNumero(item.quantidade_compra)}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatarMoeda(item.custo_unitario)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`${corStatus(status)} px-3 py-1 rounded-full text-sm`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="p-4">
                      {item.fornecedor || '-'}
                    </td>

                    <td className="p-4 relative">

  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation()

      setMenuAberto(
        menuAberto === item.id
          ? null
          : item.id
      )
    }}
    className="
      w-9
      h-9
      inline-flex
      items-center
      justify-center
      rounded-lg
      border
      border-gray-200
      bg-white
      text-gray-600
      hover:bg-gray-50
      hover:text-gray-900
      transition
    "
    title="Ações"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  </button>

  {menuAberto === item.id && (

    <div
      onClick={(event) =>
        event.stopPropagation()
      }
      className="
        absolute
        right-4
        top-12
        z-50
        w-48
        bg-white
        border
        border-gray-100
        rounded-xl
        shadow-xl
        p-2
      "
    >

      <button
        type="button"
        onClick={() => {
          setMenuAberto(null)
          editarInsumo(item)
        }}
        className="
          w-full
          flex
          items-center
          gap-3
          px-3
          py-2.5
          rounded-lg
          text-sm
          text-gray-700
          hover:bg-gray-50
          transition
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>

        Editar
      </button>

      {item.ativo !== false && (

        <button
          type="button"
          onClick={() => desativarInsumo(item)}
          className="
            w-full
            flex
            items-center
            gap-3
            px-3
            py-2.5
            rounded-lg
            text-sm
            text-amber-700
            hover:bg-amber-50
            transition
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect
              x="6"
              y="4"
              width="4"
              height="16"
              rx="1"
            />

            <rect
              x="14"
              y="4"
              width="4"
              height="16"
              rx="1"
            />
          </svg>

          Desativar
        </button>

      )}

      {item.ativo === false && (

        <button
          type="button"
          onClick={() => reativarInsumo(item)}
          className="
            w-full
            flex
            items-center
            gap-3
            px-3
            py-2.5
            rounded-lg
            text-sm
            text-green-700
            hover:bg-green-50
            transition
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>

          Reativar
        </button>

      )}

      <div className="h-px bg-gray-100 my-1" />

      <button
        type="button"
        onClick={() => excluirInsumo(item)}
        className="
          w-full
          flex
          items-center
          gap-3
          px-3
          py-2.5
          rounded-lg
          text-sm
          text-red-600
          hover:bg-red-50
          transition
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>

        Excluir
      </button>

    </div>

  )}

</td>
                  </tr>
                )
              })}

              {itensFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan="16"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhum item encontrado no estoque.
                  </td>
                </tr>
              )}

            </tbody>

          </table>
         </div>
        </div>

        <InsumoModal
          open={openModal}
          onClose={() => {
            setOpenModal(false)
            setInsumoEditando(null)
          }}
          onSave={salvarInsumo}
          insumo={insumoEditando}
        />

      </main>
    </div>
  )
}