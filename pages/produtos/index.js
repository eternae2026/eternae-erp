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

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState(null)

  async function carregarProdutos() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar produtos:', error)
      alert('Erro ao carregar os produtos.')
      setProdutos([])
      setCarregando(false)
      return
    }

    setProdutos(data || [])
    setCarregando(false)
  }

  async function carregarInsumos() {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar insumos:', error)
      alert('Erro ao carregar os itens do estoque.')
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
      alert('Erro ao carregar a ficha técnica.')
      return
    }

    setComposicao(data || [])
  }

  useEffect(() => {
    carregarProdutos()
    carregarInsumos()
  }, [])

  function limparFormulario() {
    setProdutoEditando(null)
    setNome('')
    setCategoria('')
    setDescricao('')
    setMargemLucro('60')
  }

  function validarProduto() {
    const nomeNormalizado = nome.trim()
    const margemNumero = Number(margemLucro)

    if (!nomeNormalizado) {
      alert('Informe o nome do produto.')
      return null
    }

    if (!Number.isFinite(margemNumero)) {
      alert('Informe uma margem de lucro válida.')
      return null
    }

    if (margemNumero < 0 || margemNumero >= 100) {
      alert(
        'A margem de lucro deve ser maior ou igual a 0% e menor que 100%.'
      )
      return null
    }

    return {
      nome: nomeNormalizado,
      categoria: categoria.trim() || null,
      descricao: descricao.trim() || null,
      margem_lucro: margemNumero
    }
  }

  async function salvarProduto() {
    if (salvando) return

    const dadosProduto = validarProduto()

    if (!dadosProduto) return

    setSalvando(true)

    try {
      if (produtoEditando) {
        const { data, error } = await supabase
          .from('produtos')
          .update(dadosProduto)
          .eq('id', produtoEditando.id)
          .select()

        if (error) {
          console.log('Erro ao editar produto:', error)

          if (error.code === '23505') {
            alert('Já existe um produto cadastrado com esse nome.')
          } else {
            alert('Erro ao editar produto.')
          }

          return
        }

        const produtoAtualizado = data?.[0]

        if (!produtoAtualizado) {
          alert('O produto não foi retornado após a edição.')
          return
        }

        setProdutos((listaAtual) =>
          listaAtual.map((produto) =>
            produto.id === produtoEditando.id
              ? produtoAtualizado
              : produto
          )
        )

        limparFormulario()
        alert('Produto atualizado com sucesso!')
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

        if (error.code === '23505') {
          alert('Já existe um produto cadastrado com esse nome.')
        } else {
          alert('Erro ao salvar produto.')
        }

        return
      }

      const novoProduto = data?.[0]

      if (!novoProduto) {
        alert('O produto não foi retornado após o cadastro.')
        return
      }

      setProdutos((listaAtual) => [
        novoProduto,
        ...listaAtual
      ])

      limparFormulario()
      alert('Produto cadastrado com sucesso!')
    } finally {
      setSalvando(false)
    }
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
    setMargemLucro(
      produto.margem_lucro !== null &&
        produto.margem_lucro !== undefined
        ? String(produto.margem_lucro)
        : '60'
    )
  }

  function cancelarEdicao() {
    limparFormulario()
  }

  async function produtoPossuiHistorico(produtoId) {
    const consultas = [
      supabase
        .from('orcamento_itens')
        .select('id', { count: 'exact', head: true })
        .eq('produto_id', produtoId),

      supabase
        .from('kit_itens')
        .select('id', { count: 'exact', head: true })
        .eq('produto_id', produtoId)
    ]

    const resultados = await Promise.all(consultas)

    const resultadoComErro = resultados.find(
      (resultado) => resultado.error
    )

    if (resultadoComErro) {
      console.log(
        'Erro ao verificar histórico do produto:',
        resultadoComErro.error
      )

      throw resultadoComErro.error
    }

    return resultados.some(
      (resultado) => Number(resultado.count || 0) > 0
    )
  }

  async function excluirProduto(produto) {
    if (excluindoId) return

    setExcluindoId(produto.id)

    try {
      const possuiHistorico =
        await produtoPossuiHistorico(produto.id)

      if (possuiHistorico) {
        alert(
          'Este produto já foi utilizado em orçamento, pedido ou kit e não pode ser excluído. O histórico precisa ser preservado.'
        )
        return
      }

      const confirmar = confirm(
        `Tem certeza que deseja excluir o produto ${produto.nome}? Esta ação é indicada apenas para cadastros criados por engano.`
      )

      if (!confirmar) return

      const { error: erroComposicao } = await supabase
        .from('produto_composicao')
        .delete()
        .eq('produto_id', produto.id)

      if (erroComposicao) {
        console.log(
          'Erro ao excluir ficha técnica do produto:',
          erroComposicao
        )

        alert(
          'Não foi possível excluir a ficha técnica do produto.'
        )
        return
      }

      const { error: erroProduto } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produto.id)

      if (erroProduto) {
        console.log(
          'Erro ao excluir produto:',
          erroProduto
        )

        alert(
          'Não foi possível excluir o produto. Verifique se ele possui algum vínculo no sistema.'
        )
        return
      }

      setProdutos((listaAtual) =>
        listaAtual.filter(
          (item) => item.id !== produto.id
        )
      )

      alert('Produto excluído com sucesso.')
    } catch (error) {
      console.log(
        'Erro ao validar exclusão do produto:',
        error
      )

      alert(
        'Não foi possível verificar o histórico do produto. A exclusão não foi realizada.'
      )
    } finally {
      setExcluindoId(null)
    }
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
      return false
    }

    await carregarComposicao(dados.produto_id)
    return true
  }

  async function removerInsumoFicha(id) {
    const { error } = await supabase
      .from('produto_composicao')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao remover insumo:', error)
      alert('Erro ao remover insumo.')
      return false
    }

    await carregarComposicao(produtoSelecionado.id)
    return true
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
      return false
    }

    const produtoAtualizado = data?.[0]

    if (!produtoAtualizado) {
      alert(
        'O produto não foi retornado após salvar o tempo.'
      )
      return false
    }

    setProdutos((listaAtual) =>
      listaAtual.map((produto) =>
        produto.id === produtoId
          ? produtoAtualizado
          : produto
      )
    )

    setProdutoSelecionado(produtoAtualizado)
    alert('Tempo de produção salvo!')
    return true
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

        <div
          className={`bg-white rounded-2xl p-6 shadow-sm mb-8 border ${
            produtoEditando
              ? 'border-blue-200'
              : 'border-transparent'
          }`}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {produtoEditando
              ? 'Editar Produto'
              : 'Novo Produto'}
          </h2>

          {produtoEditando && (
            <p className="text-sm text-gray-500 mb-4">
              Atualize as informações do produto. As alterações serão utilizadas apenas em novos orçamentos e pedidos.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Nome <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                placeholder="Nome do produto"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={salvando}
                className="w-full border rounded-xl px-4 py-3 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Categoria
              </label>

              <input
                type="text"
                placeholder="Categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={salvando}
                className="w-full border rounded-xl px-4 py-3 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Margem desejada (%)
              </label>

              <input
                type="number"
                min="0"
                max="99.99"
                step="0.01"
                placeholder="Margem (%)"
                value={margemLucro}
                onChange={(e) =>
                  setMargemLucro(e.target.value)
                }
                disabled={salvando}
                className="w-full border rounded-xl px-4 py-3 disabled:bg-gray-100"
              />
            </div>
          </div>

          <label className="block text-sm text-gray-600 mb-2">
            Descrição
          </label>

          <textarea
            rows="3"
            placeholder="Descrição do produto"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            disabled={salvando}
            className="w-full border rounded-xl px-4 py-3 disabled:bg-gray-100"
          />

          <div className="flex justify-end gap-3 mt-4">
            {produtoEditando && (
              <button
                type="button"
                onClick={cancelarEdicao}
                disabled={salvando}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-100 transition whitespace-nowrap disabled:opacity-50"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={salvarProduto}
              disabled={salvando}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {salvando
                ? 'Salvando...'
                : produtoEditando
                  ? 'Salvar Alterações'
                  : 'Salvar Produto'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-gray-600">
                    Produto
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Categoria
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Tempo
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Margem desejada
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
                      Carregando produtos...
                    </td>
                  </tr>
                ) : produtos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500"
                    >
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                ) : (
                  produtos.map((produto) => (
                    <tr
                      key={produto.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {produto.nome || 'Produto sem nome'}
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
                        {produto.margem_lucro ?? 0}%
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              abrirFichaTecnica(produto)
                            }
                            className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition"
                          >
                            Ficha Técnica
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editarProduto(produto)
                            }
                            className="bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              excluirProduto(produto)
                            }
                            disabled={
                              excluindoId === produto.id
                            }
                            className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {excluindoId === produto.id
                              ? 'Verificando...'
                              : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
