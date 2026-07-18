import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import PrecificacaoDrawer from '../../components/PrecificacaoDrawer'
import { supabase } from '../../lib/supabase'

export default function Precificacao() {
  const [configuracao, setConfiguracao] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [composicao, setComposicao] = useState([])
  const [precoFinal, setPrecoFinal] = useState('')
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modoNovoCadastro, setModoNovoCadastro] =
  useState(false)

  async function carregarConfiguracao() {
    const { data, error } = await supabase
      .from('configuracoes_precificacao')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.log('Erro ao carregar configurações:', error)
      return
    }

    setConfiguracao(data)
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

  async function carregarComposicao(produtoId) {
    if (!produtoId) {
      setComposicao([])
      return
    }

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
      console.log('Erro ao carregar composição:', error)
      return
    }

    setComposicao(data || [])
  }

  async function carregarDados() {
    setCarregando(true)

    await Promise.all([
      carregarConfiguracao(),
      carregarProdutos()
    ])

    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (!produtoSelecionadoId) {
      setProdutoSelecionado(null)
      setComposicao([])
      setPrecoFinal('')
      return
    }

    const produto = produtos.find(
      item => String(item.id) === String(produtoSelecionadoId)
    )

    setProdutoSelecionado(produto || null)
    setPrecoFinal(produto?.preco_final || produto?.preco || '')
    carregarComposicao(produtoSelecionadoId)
  }, [produtoSelecionadoId, produtos])

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) {
      return produtos
    }

    return produtos.filter(produto =>
      produto.nome?.toLowerCase().includes(termo)
    )
  }, [produtos, busca])

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

  function abrirPrecificacao(produto) {
    setProdutoSelecionadoId(produto.id)
    setProdutoSelecionado(produto)
    setPrecoFinal(produto.preco_final || produto.preco || '')
    setDrawerAberto(true)
  }

  function abrirNovaPrecificacao() {
  setProdutoSelecionado(null)
  setProdutoSelecionadoId('')
  setComposicao([])
  setPrecoFinal('')
  setModoNovoCadastro(true)
  setDrawerAberto(true)
  }

  function fecharDrawer() {
  setDrawerAberto(false)
  setModoNovoCadastro(false)
}

  function atualizarProdutoPrecificado(produtoAtualizado) {
  setProdutos(produtosAtuais =>
    produtosAtuais.map(produto =>
      String(produto.id) === String(produtoAtualizado.id)
        ? produtoAtualizado
        : produto
    )
  )

  setProdutoSelecionado(produtoAtualizado)

  setPrecoFinal(
    produtoAtualizado.preco_final ||
    produtoAtualizado.preco ||
    ''
  )
}

  function margemDoProduto(produto) {
    return Number(
      produto?.margem_lucro ||
      configuracao?.margem_padrao ||
      0
    )
  }

  function produtoEstaPrecificado(produto) {
    return Number(produto?.preco_final || produto?.preco || 0) > 0
  }

  const totalPrecificados = produtos.filter(
    produto => produtoEstaPrecificado(produto)
  ).length

  const totalNaoPrecificados = produtos.length - totalPrecificados

  const precoMedio = produtos.length > 0
    ? produtos.reduce(
        (total, produto) =>
          total + Number(produto.preco_final || produto.preco || 0),
        0
      ) / produtos.length
    : 0

  if (carregando) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          <p className="text-gray-500">
            Carregando precificação...
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">

        {/* Cabeçalho */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Precificação
            </h1>

            <p className="text-gray-500 mt-1">
              Consulte e gerencie a formação de preço dos produtos da Eternaê.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              className="
                border border-gray-300
                bg-white
                text-gray-700
                px-5 py-3
                rounded-xl
                font-medium
                hover:bg-gray-50
                transition
              "
            >
              Configurações
            </button>

            <button
                type="button"
                onClick={abrirNovaPrecificacao}
                className="
                bg-gray-900
                text-white
                px-5 py-3
                rounded-xl
                font-medium
                hover:bg-gray-800
                transition
              "
            >
              + Nova precificação
            </button>

          </div>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">
              Produtos cadastrados
            </p>

            <p className="text-2xl font-bold text-gray-800 mt-2">
              {produtos.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">
              Produtos precificados
            </p>

            <p className="text-2xl font-bold text-green-700 mt-2">
              {totalPrecificados}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">
              Aguardando precificação
            </p>

            <p className="text-2xl font-bold text-amber-700 mt-2">
              {totalNaoPrecificados}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">
              Preço médio cadastrado
            </p>

            <p className="text-2xl font-bold text-gray-800 mt-2">
              {formatarMoeda(precoMedio)}
            </p>
          </div>

        </div>

        {/* Lista de produtos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="p-5 border-b border-gray-100">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Produtos
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Selecione um produto para consultar ou editar sua precificação.
                </p>
              </div>

              <div className="w-full lg:w-80">
                <input
                  type="text"
                  value={busca}
                  onChange={event => setBusca(event.target.value)}
                  placeholder="Buscar produto..."
                  className="
                    w-full
                    border border-gray-300
                    rounded-xl
                    px-4 py-3
                    outline-none
                    focus:ring-2
                    focus:ring-gray-200
                    focus:border-gray-400
                  "
                />
              </div>

            </div>

          </div>

          {/* Área rolável da tabela */}
<div className="max-h-[360px] overflow-y-auto">

  {/* Cabeçalho da tabela */}
  <div
    className="
      hidden lg:grid
      lg:grid-cols-12
      gap-4
      px-6 py-4
      bg-gray-50
      border-b border-gray-100
      sticky top-0 z-10
    "
  >
    <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Produto
    </div>

    <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Tempo
    </div>

    <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Margem
    </div>

    <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Preço final
    </div>

    <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Ações
    </div>
  </div>

  {/* Produtos */}
  <div className="divide-y divide-gray-100">

    {produtosFiltrados.map(produto => {
      const preco = Number(
        produto.preco_final ||
        produto.preco ||
        0
      )

      const precificado = preco > 0

      return (
        <div
          key={produto.id}
          className="
            grid grid-cols-1
            lg:grid-cols-12
            gap-4
            px-6 py-5
            items-center
            hover:bg-gray-50
            transition
          "
        >
          {/* Produto */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">

              <div
                className="
                  h-11 w-11
                  rounded-xl
                  bg-gray-100
                  flex items-center justify-center
                  text-gray-600
                  font-bold
                  shrink-0
                "
              >
                {produto.nome?.charAt(0)?.toUpperCase() || 'P'}
              </div>

              <div>
                <p className="font-semibold text-gray-800">
                  {produto.nome}
                </p>

                <div className="mt-1">
                  {precificado ? (
                    <span
                      className="
                        inline-flex
                        px-2.5 py-1
                        rounded-full
                        bg-green-50
                        text-green-700
                        text-xs
                        font-medium
                      "
                    >
                      Precificado
                    </span>
                  ) : (
                    <span
                      className="
                        inline-flex
                        px-2.5 py-1
                        rounded-full
                        bg-amber-50
                        text-amber-700
                        text-xs
                        font-medium
                      "
                    >
                      Aguardando precificação
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Tempo */}
          <div className="lg:col-span-2">
            <p className="text-xs text-gray-500 lg:hidden">
              Tempo de produção
            </p>

            <p className="text-sm font-medium text-gray-700 mt-1 lg:mt-0">
              {formatarNumero(produto.tempo_producao || 0)} min
            </p>
          </div>

          {/* Margem */}
          <div className="lg:col-span-2">
            <p className="text-xs text-gray-500 lg:hidden">
              Margem desejada
            </p>

            <p className="text-sm font-medium text-gray-700 mt-1 lg:mt-0">
              {formatarNumero(margemDoProduto(produto))}%
            </p>
          </div>

          {/* Preço */}
          <div className="lg:col-span-2">
            <p className="text-xs text-gray-500 lg:hidden">
              Preço final
            </p>

            <p
              className={`
                text-sm font-bold mt-1 lg:mt-0
                ${precificado
                  ? 'text-gray-800'
                  : 'text-gray-400'
                }
              `}
            >
              {precificado
                ? formatarMoeda(preco)
                : 'Não definido'
              }
            </p>
          </div>

          {/* Ações */}
          <div className="lg:col-span-2 lg:text-right">
            <button
              type="button"
              onClick={() => abrirPrecificacao(produto)}
              className="
                w-full lg:w-auto
                border border-gray-300
                bg-white
                text-gray-700
                px-4 py-2.5
                rounded-xl
                text-sm
                font-medium
                hover:bg-gray-100
                transition
              "
            >
              Ver precificação
            </button>
          </div>
        </div>
      )
    })}

    {produtosFiltrados.length === 0 && (
      <div className="p-12 text-center">

        <div
          className="
            h-14 w-14
            rounded-2xl
            bg-gray-100
            flex items-center justify-center
            mx-auto mb-4
            text-2xl
          "
        >
          🔎
        </div>

        <h3 className="font-semibold text-gray-800">
          Nenhum produto encontrado
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Tente buscar por outro nome.
        </p>

      </div>
    )}

             </div>

          </div>

        </div>

      </main>

      <PrecificacaoDrawer
  aberto={drawerAberto}
  onClose={fecharDrawer}
  produto={produtoSelecionado}
  configuracao={configuracao}
  composicao={composicao}
  precoFinal={precoFinal}
  setPrecoFinal={setPrecoFinal}
  onPrecoSalvo={atualizarProdutoPrecificado}
  modoNovoCadastro={modoNovoCadastro}
  produtos={produtos}
/>

    </div>
  )
}