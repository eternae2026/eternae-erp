import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [preco, setPreco] = useState('')
  const [descricao, setDescricao] = useState('')

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

  useEffect(() => {
    carregarProdutos()
  }, [])

  async function salvarProduto() {
    const { data, error } = await supabase
      .from('produtos')
      .insert([
        {
          nome,
          categoria,
          preco: Number(preco || 0),
          descricao
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
    setPreco('')
    setDescricao('')
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
            Cadastre os produtos que serão usados nos orçamentos.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Novo Produto
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
              placeholder="Preço"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <button
              onClick={salvarProduto}
              className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
            >
              Salvar Produto
            </button>
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
                <th className="text-left p-4 text-gray-600">Preço</th>
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
                    {formatarMoeda(produto.preco)}
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => excluirProduto(produto.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}

              {produtos.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}