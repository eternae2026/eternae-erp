import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import FichaTecnicaModal from '../../components/FichaTecnicaModal'
import { supabase } from '../../lib/supabase'

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [composicao, setComposicao] = useState([])
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [openFicha, setOpenFicha] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)

  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [margemLucro, setMargemLucro] = useState('60')

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar produtos:', error)
      return
    }

    setProdutos(data || [])
  }

  async function carregarInsumos() {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar insumos:', error)
      return
    }

    setInsumos(data || [])
  }

  async function carregarComposicao(produtoId) {
    const { data, error } = await supabase
      .from('produto_composicao')
      .select(`
        *,
        estoque (
          nome,
          custo_unitario
        )
      `)
      .eq('produto_id', produtoId)

    if (error) {
      console.log('Erro ao carregar ficha técnica:', error)
      return
    }

    setComposicao(data || [])
  }

  useEffect(() => {
    carregarProdutos()
    carregarInsumos()
  }, [])

  async function salvarProduto() {
  const dadosProduto = {
    nome,
    categoria,
    descricao,
    margem_lucro: Number(margemLucro || 0)
  }

  if (produtoEditando) {
    const { data, error } = await supabase
      .from('produtos')
      .update(dadosProduto)
      .eq('id', produtoEditando.id)
      .select()

    if (error) {
      console.log('Erro ao editar produto:', error)
      alert('Erro ao editar produto.')
      return
    }

    setProdutos(
      produtos.map(produto =>
        produto.id === produtoEditando.id ? data[0] : produto
      )
    )

    setProdutoEditando(null)
    setNome('')
    setCategoria('')
    setDescricao('')
    setMargemLucro('60')

    alert('Produto atualizado!')
    return
  }

  const { data, error } = await supabase
    .from('produtos')
    .insert([
      {
        ...dadosProduto,
        tempo_producao: 0
      }
    ])
    .select()

  if (error) {
    console.log('Erro ao salvar produto:', error)
    alert('Erro ao salvar produto.')
    return
  }

  setProdutos([data[0], ...produtos])
  setNome('')
  setCategoria('')
  setDescricao('')
  setMargemLucro('60')
}

function editarProduto(produto) {
  
  window.scrollTo({
  top: 0,
  behavior: 'smooth'
})
  setProdutoEditando(produto)
  setNome(produto.nome || '')
  setCategoria(produto.categoria || '')
  setDescricao(produto.descricao || '')
  setMargemLucro(produto.margem_lucro ?? '60')
}

function cancelarEdicao() {
  setProdutoEditando(null)
  setNome('')
  setCategoria('')
  setDescricao('')
  setMargemLucro('60')
}

  async function excluirProduto(id) {
    const confirmar = confirm('Tem certeza que deseja excluir este produto?')

    if (!confirmar) return

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto.')
      return
    }

    setProdutos(produtos.filter(produto => produto.id !== id))
  }

  async function abrirFichaTecnica(produto) {
    setProdutoSelecionado(produto)
    await carregarComposicao(produto.id)
    setOpenFicha(true)
  }

  async function adicionarInsumoFicha(dados) {
    const { error } = await supabase
      .from('produto_composicao')
      .insert([dados])

    if (error) {
      console.log('Erro ao adicionar insumo:', error)
      alert('Erro ao adicionar insumo.')
      return
    }

    carregarComposicao(dados.produto_id)
  }

  async function removerInsumoFicha(id) {
    const { error } = await supabase
      .from('produto_composicao')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao remover insumo:', error)
      alert('Erro ao remover insumo.')
      return
    }

    carregarComposicao(produtoSelecionado.id)
  }

  async function salvarTempoProducao(produtoId, tempo) {
    const { data, error } = await supabase
      .from('produtos')
      .update({ tempo_producao: tempo })
      .eq('id', produtoId)
      .select()

    if (error) {
      console.log('Erro ao salvar tempo:', error)
      alert('Erro ao salvar tempo de produção.')
      return
    }

    setProdutos(
      produtos.map(produto =>
        produto.id === produtoId ? data[0] : produto
      )
    )

    setProdutoSelecionado(data[0])
    alert('Tempo de produção salvo!')
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Produtos
          </h1>

          <p className="text-gray-500">
            Cadastre os produtos vendidos e configure suas fichas técnicas.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
          </h2>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome do produto"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="number"
              placeholder="Margem (%)"
              value={margemLucro}
              onChange={(e) => setMargemLucro(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <div className="flex gap-3">

  <button
    onClick={salvarProduto}
    className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
  >
    {produtoEditando ? 'Salvar Alterações' : 'Salvar Produto'}
  </button>

  {produtoEditando && (
    <button
      onClick={cancelarEdicao}
      className="bg-gray-200 text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-300 transition"
    >
      Cancelar
    </button>
  )}

</div>
          </div>

          <textarea
            rows="3"
            placeholder="Descrição do produto"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Produto</th>
                <th className="text-left p-4 text-gray-600">Categoria</th>
                                <th className="text-left p-4 text-gray-600">Tempo</th>
                <th className="text-left p-4 text-gray-600">Margem desejada</th>
                <th className="text-left p-4 text-gray-600">Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map(produto => (
                <tr key={produto.id} className="border-t">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {produto.nome}
                      </p>

                      {produto.descricao && (
                        <p className="text-sm text-gray-500">
                          {produto.descricao}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    {produto.categoria || '-'}
                  </td>

                  <td className="p-4">
                    {produto.tempo_producao || 0} min
                  </td>

                  <td className="p-4">
                    {produto.margem_lucro || 0}%
                  </td>

                  <td className="p-4">
                    <div className="flex gap-4">
                      
                      <button
  onClick={() => editarProduto(produto)}
  className="text-gray-700 hover:text-gray-900"
>
  Editar
</button>

                      <button
                        onClick={() => abrirFichaTecnica(produto)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ⚙️ Ficha Técnica
                      </button>

                      <button
                        onClick={() => excluirProduto(produto.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {produtos.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <FichaTecnicaModal
          open={openFicha}
          onClose={() => {
            setOpenFicha(false)
            setProdutoSelecionado(null)
            setComposicao([])
          }}
          produto={produtoSelecionado}
          insumos={insumos}
          composicao={composicao}
          onAdicionarInsumo={adicionarInsumoFicha}
          onRemoverInsumo={removerInsumoFicha}
          onSalvarTempo={salvarTempoProducao}
        />

      </main>
    </div>
  )
}