import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import InsumoModal from '../../components/InsumoModal'
import { supabase } from '../../lib/supabase'

export default function Estoque() {
  const [itensEstoque, setItensEstoque] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState(null)
  const [filtroTipo, setFiltroTipo] =
  useState('todos')
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

  const itensFiltrados =
  itensEstoque.filter(item => {

    const passouBusca =
      item.nome
        ?.toLowerCase()
        .includes(
          buscaItem.toLowerCase()
        )

    if (!passouBusca) {
      return false
    }

    if (filtroTipo === 'todos') {
      return true
    }

    if (filtroTipo === 'vendaveis') {
      return item.vendavel
    }

    if (filtroTipo === 'baixo') {
  return (
    statusEstoque(item) === 'Baixo'
  )
}

if (filtroTipo === 'esgotado') {
  return (
    statusEstoque(item) === 'Esgotado'
  )
}

    return (
      item.categoria_item === filtroTipo
    )
  })

  function totalProducao() {
  return itensEstoque.filter(
    item =>
      item.categoria_item ===
      'producao'
  ).length
}

function totalEmbalagens() {
  return itensEstoque.filter(
    item =>
      item.categoria_item ===
      'embalagem'
  ).length
}

function totalAcessorios() {
  return itensEstoque.filter(
    item =>
      item.categoria_item ===
      'acessorio'
  ).length
}

function totalVendaveis() {
  return itensEstoque.filter(
    item => item.vendavel
  ).length
}

function totalBaixoEstoque() {
  return itensEstoque.filter(
    item =>
      statusEstoque(item) === 'Baixo'
  ).length
}

function totalEsgotados() {
  return itensEstoque.filter(
    item =>
      statusEstoque(item) === 'Esgotado'
  ).length
}

  function totalInsumos() {
    return itensEstoque.length
  }

  function totalBaixo() {
    return itensEstoque.filter(item => statusEstoque(item) === 'Baixo').length
  }

  function totalEsgotado() {
    return itensEstoque.filter(item => statusEstoque(item) === 'Esgotado').length
  }

  function valorTotalEstoque() {
    return itensEstoque.reduce((total, item) => {
      return total + (
        quantidadeLivre(item) *
        Number(item.custo_unitario || 0)
      )
    }, 0)
  }

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-8 overflow-hidden">

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

<div className="flex gap-3 mb-6 flex-wrap">

  <button
    onClick={() => setFiltroTipo('todos')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroTipo === 'todos'
        ? 'bg-gray-900 text-white'
        : 'bg-white border'
    }`}
  >
    Todos ({itensEstoque.length})
  </button>

  <button
    onClick={() => setFiltroTipo('producao')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroTipo === 'producao'
        ? 'bg-gray-900 text-white'
        : 'bg-white border'
    }`}
  >
    Produção ({totalProducao()})
  </button>

  <button
    onClick={() => setFiltroTipo('embalagem')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroTipo === 'embalagem'
        ? 'bg-gray-900 text-white'
        : 'bg-white border'
    }`}
  >
    Embalagens ({totalEmbalagens()})
  </button>

  <button
    onClick={() => setFiltroTipo('acessorio')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroTipo === 'acessorio'
        ? 'bg-gray-900 text-white'
        : 'bg-white border'
    }`}
  >
    Acessórios ({totalAcessorios()})
  </button>

  <button
    onClick={() => setFiltroTipo('vendaveis')}
    className={`px-4 py-2 rounded-xl transition ${
      filtroTipo === 'vendaveis'
        ? 'bg-gray-900 text-white'
        : 'bg-white border'
    }`}
  >
    Vendáveis ({totalVendaveis()})
  </button>

  <button
  onClick={() =>
    setFiltroTipo('baixo')
  }
  className={`px-4 py-2 rounded-xl transition ${
    filtroTipo === 'baixo'
      ? 'bg-yellow-500 text-white'
      : 'bg-white border'
  }`}
>
  Baixo ({totalBaixoEstoque()})
</button>

<button
  onClick={() =>
    setFiltroTipo('esgotado')
  }
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
          <div className="overflow-auto max-h-[55vh] w-full">
            <table className="w-full min-w-[1500px]">

            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Item</th>
                <th className="text-left p-4 text-gray-600">Categoria</th>
                <th className="text-left p-4 text-gray-600">
  Tipo
</th>

<th className="text-left p-4 text-gray-600">
  Vendável
</th>

<th className="text-left p-4 text-gray-600">
  Preço Venda
</th>
                <th className="text-left p-4 text-gray-600">Disponível</th>
                <th className="text-left p-4 text-gray-600">Reservado</th>
                <th className="text-left p-4 text-gray-600">Livre</th>
                <th className="text-left p-4 text-gray-600">Mínimo</th>
                <th className="text-left p-4 text-gray-600">Unidade</th>
                <th className="text-left p-4 text-gray-600">Valor Compra</th>
                <th className="text-left p-4 text-gray-600">Qtd Compra</th>
                <th className="text-left p-4 text-gray-600">Custo Unit.</th>
                <th className="text-left p-4 text-gray-600">Status</th>
                <th className="text-left p-4 text-gray-600">Fornecedor</th>
                <th className="text-left p-4 text-gray-600">Ações</th>
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

                    <td className="p-4">
                      <button
                        onClick={() => editarInsumo(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
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