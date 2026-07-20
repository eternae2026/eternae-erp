import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PrecificacaoDrawer({
  aberto,
  onClose,
  produto,
  configuracao,
  composicao = [],
  precoFinal,
  setPrecoFinal,
  onPrecoSalvo,
  modoNovoCadastro = false,
  produtos = []
}) {

  const [salvando, setSalvando] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [tempoEdicao, setTempoEdicao] = useState('')
  const [margemEdicao, setMargemEdicao] = useState('')
  const [insumosEdicao, setInsumosEdicao] = useState([])
  const [estoque, setEstoque] = useState([])
  const [novoInsumo, setNovoInsumo] = useState('')
  const [novaQuantidade, setNovaQuantidade] = useState(1)
  const [
  produtoNovoSelecionado,
  setProdutoNovoSelecionado
] = useState('')

    useEffect(() => {
    async function carregarEstoque() {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('nome')

      if (error) {
        console.log('Erro ao carregar estoque:', error)
        setEstoque([])
        return
      }

      setEstoque(data || [])
    }

    carregarEstoque()

    if (modoNovoCadastro) {
      setProdutoNovoSelecionado('')
      setTempoEdicao('')
      setMargemEdicao(
        configuracao?.margem_padrao || ''
      )
      setPrecoFinal('')
      setInsumosEdicao([])
      setNovoInsumo('')
      setNovaQuantidade(1)
      setModoEdicao(false)
      return
    }

    if (!produto) return

    setTempoEdicao(
      produto.tempo_producao || ''
    )

    setMargemEdicao(
      produto.margem_lucro ||
      configuracao?.margem_padrao ||
      ''
    )

    setPrecoFinal(
      produto.preco_final ||
      produto.preco ||
      ''
    )

    setInsumosEdicao(
      composicao.map(item => ({
        ...item,
        quantidade: item.quantidade
      }))
    )

    setNovoInsumo('')
    setNovaQuantidade(1)
    setModoEdicao(false)
  }, [
    produto?.id,
    aberto,
    modoNovoCadastro,
    configuracao?.margem_padrao
  ])

    const produtoNovo = produtos.find(
    item =>
      String(item.id) ===
      String(produtoNovoSelecionado)
  )

  const produtoAtivo = modoNovoCadastro
    ? produtoNovo
    : produto

  if (
  !aberto ||
  !configuracao ||
  (!produto && !modoNovoCadastro)
) {
    return null
  }

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

  function custosFixosTotais() {
    return (
      Number(configuracao.energia || 0) +
      Number(configuracao.internet || 0) +
      Number(configuracao.canva || 0) +
      Number(configuracao.dominio || 0) +
      Number(configuracao.outros_custos || 0)
    )
  }

  function horasMensais() {
    return (
      Number(configuracao.horas_por_dia || 0) *
      Number(configuracao.dias_por_semana || 0) *
      4.33
    )
  }

  function valorHora() {
    const horas = horasMensais()

    if (horas <= 0) {
      return 0
    }

    return Number(configuracao.pro_labore_desejado || 0) / horas
  }

  function custoFixoPorHora() {
    const horas = horasMensais()

    if (horas <= 0) {
      return 0
    }

    return custosFixosTotais() / horas
  }

  function custoInsumos() {
  const itens = modoEdicao
    ? insumosEdicao
    : composicao

  return itens.reduce((total, item) => {
    const custoUnitario = Number(
      item.estoque?.custo_unitario || 0
    )

    const quantidade = Number(
      item.quantidade || 0
    )

    return total + custoUnitario * quantidade
  }, 0)
}

function itensFichaTecnica() {
  return modoEdicao
    ? insumosEdicao
    : composicao
}

function categoriaDoItem(item) {
  return (
    item.estoque?.categoria_item ||
    'producao'
  )
}

function custoPorCategoria(categoria) {
  return itensFichaTecnica()
    .filter(
      item =>
        categoriaDoItem(item) === categoria
    )
    .reduce((total, item) => {
      const custoUnitario = Number(
        item.estoque?.custo_unitario || 0
      )

      const quantidade = Number(
        item.quantidade || 0
      )

      return (
        total +
        custoUnitario * quantidade
      )
    }, 0)
}

function custoProducao() {
  return custoPorCategoria('producao')
}

function custoEmbalagens() {
  return custoPorCategoria('embalagem')
}

function custoAcessorios() {
  return custoPorCategoria('acessorio')
}

  function horasProduto() {
  const tempoUtilizado =
    modoEdicao || modoNovoCadastro
      ? tempoEdicao
      : produto?.tempo_producao

  return Number(tempoUtilizado || 0) / 60
}

  function custoMaoDeObra() {
    return horasProduto() * valorHora()
  }

  function custoFixoProduto() {
    return horasProduto() * custoFixoPorHora()
  }

  function custoTotalProduto() {
    return (
      custoInsumos() +
      custoMaoDeObra() +
      custoFixoProduto()
    )
  }

  function margemProduto() {
  if (modoEdicao || modoNovoCadastro) {
    return Number(
      margemEdicao ||
      configuracao?.margem_padrao ||
      0
    )
  }

  return Number(
    produto?.margem_lucro ||
    configuracao?.margem_padrao ||
    0
  )
}

  function precoSugerido() {
    const margem = margemProduto() / 100

    if (margem >= 1) {
      return 0
    }

    return custoTotalProduto() / (1 - margem)
  }

  function taxaCartao() {
    return Number(configuracao.taxa_cartao || 0) / 100
  }

  function precoCartao() {
    const taxa = taxaCartao()
    const precoPix = precoSugerido()

    if (taxa >= 1) {
      return 0
    }

    return precoPix / (1 - taxa)
  }

  function descontoPixPercentual() {
    const cartao = precoCartao()
    const pix = precoSugerido()

    if (cartao <= 0) {
      return 0
    }

    return ((cartao - pix) / cartao) * 100
  }

  function lucroSugerido() {
    return precoSugerido() - custoTotalProduto()
  }

  function margemReal(valorVenda) {
    const venda = Number(valorVenda || 0)

    if (venda <= 0) {
      return 0
    }

    return (
      ((venda - custoTotalProduto()) / venda) *
      100
    )
  }

  function lucroNoPrecoFinal() {
    return (
      Number(precoFinal || 0) -
      custoTotalProduto()
    )
  }

    async function salvarAlteracoes() {
    const produtoId = modoNovoCadastro
      ? produtoNovoSelecionado
      : produto?.id

    if (!produtoId) {
      alert('Selecione um produto.')
      return
    }

    const tempo = Number(tempoEdicao || 0)
    const margem = Number(margemEdicao || 0)
    const valorFinal = Number(precoFinal || 0)

    if (tempo <= 0) {
      alert('Informe um tempo de produção maior que zero.')
      return
    }

    if (margem < 0 || margem >= 100) {
      alert('A margem deve ser maior ou igual a zero e menor que 100%.')
      return
    }

    if (insumosEdicao.length === 0) {
      alert('Adicione pelo menos um insumo à ficha técnica.')
      return
    }

    if (valorFinal <= 0) {
      alert('Informe um preço final maior que zero.')
      return
    }

    const insumosInvalidos = insumosEdicao.some(
      item =>
        !(
          item.insumo_id ||
          item.estoque_id ||
          item.estoque?.id
        ) ||
        Number(item.quantidade || 0) <= 0
    )

    if (insumosInvalidos) {
      alert(
        'Confira os insumos e informe quantidades maiores que zero.'
      )
      return
    }

    setSalvando(true)

    const { data, error } = await supabase
      .from('produtos')
      .update({
        tempo_producao: tempo,
        margem_lucro: margem,
        preco_final: valorFinal,
        preco: valorFinal
      })
      .eq('id', produtoId)
      .select()
      .single()

    if (error) {
      setSalvando(false)
      console.log('Erro ao salvar precificação:', error)
      alert('Não foi possível salvar a precificação.')
      return
    }

    const { error: erroExcluir } = await supabase
      .from('produto_composicao')
      .delete()
      .eq('produto_id', produtoId)

    if (erroExcluir) {
      setSalvando(false)
      console.log(
        'Erro ao excluir composição:',
        erroExcluir
      )
      alert(
        'O produto foi atualizado, mas não foi possível atualizar a ficha técnica.'
      )
      return
    }

    const composicaoSalvar =
      insumosEdicao.map(item => ({
        produto_id: produtoId,
        insumo_id:
          item.insumo_id ||
          item.estoque_id ||
          item.estoque?.id,
        quantidade: Number(
          item.quantidade || 0
        )
      }))

    const { error: erroInserir } = await supabase
      .from('produto_composicao')
      .insert(composicaoSalvar)

    setSalvando(false)

    if (erroInserir) {
      console.log(
        'Erro ao salvar composição:',
        erroInserir
      )

      alert(
        'O produto foi atualizado, mas houve erro ao salvar os insumos.'
      )
      return
    }

    if (onPrecoSalvo) {
      onPrecoSalvo(data)
    }

    setModoEdicao(false)

    alert(
      modoNovoCadastro
        ? 'Precificação criada com sucesso!'
        : 'Precificação atualizada com sucesso!'
    )

    if (modoNovoCadastro) {
      onClose()
    }
  }

  function adicionarInsumo() {
  if (!novoInsumo) {
    alert('Selecione um insumo.')
    return
  }

  const item = estoque.find(
    insumo =>
      String(insumo.id) ===
      String(novoInsumo)
  )

  if (!item) return

  const jaExiste =
    insumosEdicao.some(
      insumo =>
        String(insumo.estoque_id) ===
        String(item.id)
    )

  if (jaExiste) {
    alert('Este insumo já está na ficha técnica.')
    return
  }

  setInsumosEdicao([
    ...insumosEdicao,
    {
      id: `novo-${Date.now()}`,
      estoque_id: item.id,
      quantidade: Number(novaQuantidade),
      estoque: item
    }
  ])

  setNovoInsumo('')
  setNovaQuantidade(1)
}

    function cancelarEdicao() {
    if (modoNovoCadastro) {
      setProdutoNovoSelecionado('')
      setTempoEdicao('')
      setMargemEdicao(
        configuracao?.margem_padrao || ''
      )
      setPrecoFinal('')
      setInsumosEdicao([])
      setNovoInsumo('')
      setNovaQuantidade(1)
      setModoEdicao(false)
      return
    }

    setTempoEdicao(
      produto?.tempo_producao || ''
    )

    setMargemEdicao(
      produto?.margem_lucro ||
      configuracao?.margem_padrao ||
      ''
    )

    setPrecoFinal(
      produto?.preco_final ||
      produto?.preco ||
      ''
    )

    setInsumosEdicao(
      composicao.map(item => ({
        ...item,
        quantidade: item.quantidade
      }))
    )

    setModoEdicao(false)
  }

  return (
    <>
      {/* Fundo escuro */}
      <div
        onClick={onClose}
        className="
          fixed inset-0
          bg-black/40
          z-40
        "
      />

      {/* Drawer */}
      <aside
        className="
          fixed
          top-0
          right-0
          h-screen
          w-full
          lg:w-[60vw]
          bg-white
          shadow-2xl
          z-50
          flex
          flex-col
        "
      >
        {/* Cabeçalho fixo */}
        <div
          className="
            border-b
            border-gray-200
            px-6 py-5
            flex
            items-center
            justify-between
            gap-4
            bg-white
            shrink-0
          "
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500">
              Precificação
            </p>

            <h2 className="text-2xl font-bold text-gray-800 truncate">
              {modoNovoCadastro
  ? 'Nova precificação'
  : produto?.nome}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {modoNovoCadastro
  ? 'Selecione um produto para iniciar a precificação.'
  : 'Consulte os custos e defina o preço de venda.'}
            </p>
          </div>

                    <div className="flex items-center gap-3 shrink-0">

            {modoNovoCadastro ? (
              produtoNovoSelecionado && modoEdicao ? (
                <>
                  <button
                    type="button"
                    onClick={cancelarEdicao}
                    disabled={salvando}
                    className="
                      bg-gray-100
                      hover:bg-gray-200
                      text-gray-700
                      rounded-xl
                      px-4 py-2.5
                      font-medium
                      transition
                      disabled:opacity-60
                    "
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={salvarAlteracoes}
                    disabled={salvando}
                    className="
                      bg-gray-900
                      hover:bg-gray-800
                      text-white
                      rounded-xl
                      px-4 py-2.5
                      font-semibold
                      transition
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                    "
                  >
                    {salvando
                      ? 'Salvando...'
                      : 'Salvar precificação'
                    }
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    bg-gray-100
                    hover:bg-gray-200
                    text-gray-700
                    rounded-xl
                    px-4 py-2.5
                    font-medium
                    transition
                  "
                >
                  Fechar
                </button>
              )
            ) : modoEdicao ? (
              <>
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                  className="
                    bg-gray-100
                    hover:bg-gray-200
                    text-gray-700
                    rounded-xl
                    px-4 py-2.5
                    font-medium
                    transition
                    disabled:opacity-60
                  "
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={salvarAlteracoes}
                  disabled={salvando}
                  className="
                    bg-gray-900
                    hover:bg-gray-800
                    text-white
                    rounded-xl
                    px-4 py-2.5
                    font-semibold
                    transition
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar alterações'
                  }
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModoEdicao(true)}
                  className="
                    border border-gray-300
                    bg-white
                    hover:bg-gray-50
                    text-gray-700
                    rounded-xl
                    px-4 py-2.5
                    font-medium
                    transition
                  "
                >
                  Editar precificação
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="
                    bg-gray-100
                    hover:bg-gray-200
                    text-gray-700
                    rounded-xl
                    px-4 py-2.5
                    font-medium
                    transition
                  "
                >
                  Fechar
                </button>
              </>
            )}

          </div>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-5 md:p-6 space-y-6">

            {/* Resumo principal */}
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                  <p className="text-sm font-medium text-green-700">
                    Preço PIX sugerido
                  </p>

                  <p className="text-2xl font-bold text-green-800 mt-2">
                    {formatarMoeda(precoSugerido())}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <p className="text-sm font-medium text-blue-700">
                    Preço no cartão
                  </p>

                  <p className="text-2xl font-bold text-blue-800 mt-2">
                    {formatarMoeda(precoCartao())}
                  </p>
                </div>

                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
                  <p className="text-sm font-medium text-violet-700">
                    Lucro sugerido
                  </p>

                  <p className="text-2xl font-bold text-violet-800 mt-2">
                    {formatarMoeda(lucroSugerido())}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <p className="text-sm font-medium text-amber-700">
                    Margem desejada
                  </p>

                  <p className="text-2xl font-bold text-amber-800 mt-2">
                    {formatarNumero(margemProduto())}%
                  </p>
                </div>

              </div>
            </section>

            {/* Dados do produto */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">

              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  Dados do produto
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Informações utilizadas na formação do preço.
                </p>
              </div>

              {modoNovoCadastro && (
                <div className="p-5 border-b border-gray-100">

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produto
                  </label>

                  <select
                    value={produtoNovoSelecionado}
                    onChange={event => {
                      const id = event.target.value

                      setProdutoNovoSelecionado(id)

                      const selecionado = produtos.find(
                        item =>
                          String(item.id) ===
                          String(id)
                      )

                      if (!selecionado) {
                        setTempoEdicao('')
                        setMargemEdicao(
                          configuracao?.margem_padrao ||
                          ''
                        )
                        setPrecoFinal('')
                        setInsumosEdicao([])
                        setModoEdicao(false)
                        return
                      }

                      setTempoEdicao(
                        selecionado.tempo_producao ||
                        ''
                      )

                      setMargemEdicao(
                        selecionado.margem_lucro ||
                        configuracao?.margem_padrao ||
                        ''
                      )

                      setPrecoFinal(
                        selecionado.preco_final ||
                        selecionado.preco ||
                        ''
                      )

                      setInsumosEdicao([])
                      setNovoInsumo('')
                      setNovaQuantidade(1)
                      setModoEdicao(true)
                    }}
                    className="
                      w-full
                      border
                      border-gray-300
                      rounded-xl
                      px-4 py-3
                      bg-white
                    "
                  >
                    <option value="">
                      Selecione um produto
                    </option>

                    {produtos
                      .filter(
                        item =>
                          !Number(
                            item.preco_final ||
                            item.preco ||
                            0
                          )
                      )
                      .map(item => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.nome}
                        </option>
                      ))}

                  </select>

                </div>
              )}

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Produto
                  </p>

                  <p className="font-semibold text-gray-800 mt-2">
                    {produtoAtivo?.nome || 'Selecione um produto'}
                  </p>
                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Tempo de produção
                  </p>

                  {modoEdicao ? (
                    <div className="relative mt-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={tempoEdicao}
                        onChange={event =>
                          setTempoEdicao(event.target.value)
                        }
                        className="
                          w-full
                          border border-gray-300
                          bg-white
                          rounded-lg
                          px-3 py-2
                          pr-12
                          outline-none
                          focus:ring-2
                          focus:ring-gray-200
                        "
                      />

                      <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                        min
                      </span>
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-800 mt-2">
                      {formatarNumero(produtoAtivo?.tempo_producao || 0)} min
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Margem utilizada
                  </p>

                  {modoEdicao ? (
                    <div className="relative mt-2">
                      <input
                        type="number"
                        min="0"
                        max="99.99"
                        step="0.01"
                        value={margemEdicao}
                        onChange={event =>
                          setMargemEdicao(event.target.value)
                        }
                        className="
                          w-full
                          border border-gray-300
                          bg-white
                          rounded-lg
                          px-3 py-2
                          pr-10
                          outline-none
                          focus:ring-2
                          focus:ring-gray-200
                        "
                      />

                      <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                        %
                      </span>
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-800 mt-2">
                      {formatarNumero(margemProduto())}%
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Preço atual
                  </p>

                  <p className="font-semibold text-gray-800 mt-2">
                    {formatarMoeda(
                      produtoAtivo?.preco_final ||
                      produtoAtivo?.preco ||
                      0
                    )}
                  </p>
                </div>

              </div>

            </section>

            {/* Ficha técnica */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">

              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Ficha técnica
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Materiais utilizados para produzir e entregar uma unidade.
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-xl px-4 py-2">
                    <p className="text-xs text-gray-500">
                      Total dos materiais
                    </p>

                    <p className="font-bold text-gray-800">
                      {formatarMoeda(custoInsumos())}
                    </p>
                  </div>

                </div>
              </div>

{modoEdicao && (
  <div className="px-5 pb-5">

    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">

      <p className="text-sm font-medium text-gray-700 mb-4">
        Adicionar item à ficha técnica
      </p>

      <div className="flex flex-col lg:flex-row gap-3">

        <select
          value={novoInsumo}
          onChange={event =>
            setNovoInsumo(
              event.target.value
            )
          }
          className="
            flex-1
            border border-gray-300
            rounded-xl
            px-4 py-3
          "
        >
          <option value="">
            Selecione um item
          </option>

          <optgroup label="Produção">
  {estoque
    .filter(
      item =>
        item.categoria_item ===
        'producao'
    )
    .map(item => (
      <option
        key={item.id}
        value={item.id}
      >
        {item.nome}
      </option>
    ))}
</optgroup>

<optgroup label="Embalagens">
  {estoque
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
      </option>
    ))}
</optgroup>

<optgroup label="Acessórios">
  {estoque
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
      </option>
    ))}
</optgroup>

          

        </select>

        <input
          type="number"
          min="0"
          step="0.01"
          value={novaQuantidade}
          onChange={event =>
            setNovaQuantidade(
              event.target.value
            )
          }
          className="
            w-36
            border border-gray-300
            rounded-xl
            px-4 py-3
          "
        />

        <button
          type="button"
          onClick={adicionarInsumo}
          className="
            bg-gray-900
            hover:bg-gray-800
            text-white
            rounded-xl
            px-5 py-3
            font-semibold
          "
        >
          + Adicionar
        </button>

      </div>

    </div>

  </div>
)}

              <div className="overflow-x-auto">

                <table className="w-full min-w-[620px]">

                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Item
                      </th>

                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tipo
                      </th>

                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quantidade
                      </th>

                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Custo unitário
                      </th>

                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Subtotal
                      </th>

                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
  Ações
</th>
                    </tr>
                  </thead>

                                    <tbody className="divide-y divide-gray-100">

                    {(modoEdicao
                      ? insumosEdicao
                      : composicao
                    ).map(item => {
                      const custoUnitario = Number(
                        item.estoque?.custo_unitario || 0
                      )

                      const quantidade = Number(
                        item.quantidade || 0
                      )

                      const subtotal =
                        custoUnitario * quantidade

                      return (
                        <tr key={item.id}>

                          <td className="px-5 py-4">
  <p className="font-medium text-gray-800">
    {item.estoque?.nome || 'Item não identificado'}
  </p>
</td>

<td className="px-5 py-4">
  <span
    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
      categoriaDoItem(item) === 'embalagem'
        ? 'bg-amber-50 text-amber-700'
        : categoriaDoItem(item) === 'acessorio'
          ? 'bg-violet-50 text-violet-700'
          : 'bg-blue-50 text-blue-700'
    }`}
  >
    {categoriaDoItem(item) === 'embalagem'
      ? 'Embalagem'
      : categoriaDoItem(item) === 'acessorio'
        ? 'Acessório'
        : 'Produção'}
  </span>
</td>

                          <td className="px-5 py-4">

                            {modoEdicao ? (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantidade}
                                onChange={event => {
                                  setInsumosEdicao(insumos =>
                                    insumos.map(insumo =>
                                      insumo.id === item.id
                                        ? {
                                            ...insumo,
                                            quantidade: event.target.value
                                          }
                                        : insumo
                                    )
                                  )
                                }}
                                className="
                                  w-24
                                  border
                                  border-gray-300
                                  rounded-lg
                                  px-3
                                  py-2
                                "
                              />
                            ) : (
                              <span className="text-sm text-gray-700">
                                {formatarNumero(quantidade)}
                              </span>
                            )}

                          </td>

                          <td className="px-5 py-4 text-sm text-gray-700">
                            {formatarMoeda(custoUnitario)}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-gray-800">
                            {formatarMoeda(subtotal)}
                          </td>

                          <td className="px-5 py-4 text-center">

                            {modoEdicao && (
                              <button
                                type="button"
                                onClick={() => {
                                  setInsumosEdicao(
                                    insumosEdicao.filter(
                                      insumo =>
                                        insumo.id !== item.id
                                    )
                                  )
                                }}
                                className="
                                  text-red-600
                                  hover:text-red-700
                                  font-medium
                                "
                              >
                                Remover
                              </button>
                            )}

                          </td>

                        </tr>
                      )
                    })}

                    {(modoEdicao
                      ? insumosEdicao
                      : composicao
                    ).length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-5 py-10 text-center"
                        >
                          <p className="font-medium text-gray-700">
                            Este produto ainda não possui ficha técnica.
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            Adicione os materiais utilizados na produção, embalagem ou composição do produto.
                          </p>
                        </td>
                      </tr>
                                        )}

                  </tbody>

                </table>

              </div>

              <div className="border-t border-gray-100 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-700">
                      Produção
                    </p>

                    <p className="text-lg font-bold text-blue-800 mt-2">
                      {formatarMoeda(custoProducao())}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-sm font-medium text-amber-700">
                      Embalagens
                    </p>

                    <p className="text-lg font-bold text-amber-800 mt-2">
                      {formatarMoeda(custoEmbalagens())}
                    </p>
                  </div>

                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                    <p className="text-sm font-medium text-violet-700">
                      Acessórios
                    </p>

                    <p className="text-lg font-bold text-violet-800 mt-2">
                      {formatarMoeda(custoAcessorios())}
                    </p>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-300">
                      Total dos materiais
                    </p>

                    <p className="text-lg font-bold text-white mt-2">
                      {formatarMoeda(custoInsumos())}
                    </p>
                  </div>

                </div>
              </div>

            </section>

            {/* Composição dos custos */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">

              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  Composição dos custos
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Custos diretos e indiretos aplicados ao produto?.
                </p>
              </div>

              <div className="p-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">
                      Materiais
                    </p>

                    <p className="text-lg font-bold text-gray-800 mt-2">
                      {formatarMoeda(custoInsumos())}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">
                      Mão de obra
                    </p>

                    <p className="text-lg font-bold text-gray-800 mt-2">
                      {formatarMoeda(custoMaoDeObra())}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Hora: {formatarMoeda(valorHora())}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">
                      Custos fixos aplicados
                    </p>

                    <p className="text-lg font-bold text-gray-800 mt-2">
                      {formatarMoeda(custoFixoProduto())}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Hora: {formatarMoeda(custoFixoPorHora())}
                    </p>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-sm text-gray-300">
                      Custo total
                    </p>

                    <p className="text-lg font-bold text-white mt-2">
                      {formatarMoeda(custoTotalProduto())}
                    </p>
                  </div>

                </div>

              </div>

            </section>

            {/* Formação do preço */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">

              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  Formação do preço
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Comparação entre custo, margem e condições de pagamento.
                </p>
              </div>

              <div className="p-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-500">
                      Custo total
                    </p>

                    <p className="text-xl font-bold text-gray-800 mt-2">
                      {formatarMoeda(custoTotalProduto())}
                    </p>
                  </div>

                  <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-700">
                      Preço PIX sugerido
                    </p>

                    <p className="text-xl font-bold text-green-800 mt-2">
                      {formatarMoeda(precoSugerido())}
                    </p>
                  </div>

                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      Preço no cartão
                    </p>

                    <p className="text-xl font-bold text-blue-800 mt-2">
                      {formatarMoeda(precoCartao())}
                    </p>
                  </div>

                  <div className="border border-violet-200 bg-violet-50 rounded-xl p-4">
                    <p className="text-sm text-violet-700">
                      Desconto equivalente no PIX
                    </p>

                    <p className="text-xl font-bold text-violet-800 mt-2">
                      {formatarNumero(descontoPixPercentual())}%
                    </p>
                  </div>

                  <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-amber-700">
                      Lucro sugerido
                    </p>

                    <p className="text-xl font-bold text-amber-800 mt-2">
                      {formatarMoeda(lucroSugerido())}
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-500">
                      Margem real sugerida
                    </p>

                    <p className="text-xl font-bold text-gray-800 mt-2">
                      {formatarNumero(
                        margemReal(precoSugerido())
                      )}%
                    </p>
                  </div>

                </div>

              </div>

            </section>

            {/* Preço final */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">

              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  Definição do preço final
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Defina o valor que será utilizado no catálogo e nos pedidos.
                </p>
              </div>

              <div className="p-5">

                <div>

                  <div className="flex-1">

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço final de venda
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precoFinal}
                      disabled={!modoEdicao}
                      onChange={event =>
                        setPrecoFinal(event.target.value)
                      }
                      placeholder="0,00"
                      className="
                        w-full
                        border border-gray-300
                        rounded-xl
                        px-4 py-3
                        outline-none
                        focus:ring-2
                        focus:ring-gray-200
                        focus:border-gray-400
                        disabled:bg-gray-100
                        disabled:text-gray-600
                        disabled:cursor-not-allowed
                      "
                    />


                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">
                        Preço informado
                      </p>

                      <p className="font-bold text-gray-800 mt-2">
                        {formatarMoeda(precoFinal)}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">
                        Lucro no preço final
                      </p>

                      <p
                        className={`
                        font-bold mt-2
                        ${lucroNoPrecoFinal() >= 0
                            ? 'text-green-700'
                            : 'text-red-700'
                          }
                      `}
                      >
                        {formatarMoeda(lucroNoPrecoFinal())}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">
                        Margem no preço final
                      </p>

                      <p className="font-bold text-gray-800 mt-2">
                        {formatarNumero(
                          margemReal(precoFinal)
                        )}%
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </section>

          </div>
        </div>
      </aside>
    </>
  )
}