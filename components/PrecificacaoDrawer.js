import { useEffect, useRef, useState } from 'react'

import { supabase } from '../lib/supabase'
import { calcularPreviaPrecificacaoV2 } from '../lib/previaPrecificacaoV2'
import {
  obterCustoAtualProduto,
  obterUltimaPrecificacaoV2,
  confirmarPrecificacaoV2
} from '../lib/precificacaoV2'



export default function PrecificacaoDrawer({

  aberto,

  onClose,

  produto,

  configuracao,

  composicao = [],
  composicaoPronta = false,
  erroComposicao = '',

  precoFinal,

  setPrecoFinal,

  onPrecoSalvo,

  modoNovoCadastro = false,

  produtos = [],

  totalCustosOperacionais = 0

}) {



  const [salvando, setSalvando] = useState(false)
  const operacaoPendente = useRef(null)

  const [modoEdicao, setModoEdicao] = useState(false)
  const [edicaoInicializadaPara, setEdicaoInicializadaPara] = useState('')
  const [carregandoEdicao, setCarregandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')
  const requisicaoEdicao = useRef(0)

  const [tempoEdicao, setTempoEdicao] = useState('')

  const [margemEdicao, setMargemEdicao] = useState('')
  const [semEmbalagemEdicao, setSemEmbalagemEdicao] = useState(false)

  const [insumosEdicao, setInsumosEdicao] = useState([])

  const [estoque, setEstoque] = useState([])

  const [

  configuracaoSistema,

  setConfiguracaoSistema

] = useState(null)

  const [novoInsumo, setNovoInsumo] = useState('')

  const [novaQuantidade, setNovaQuantidade] = useState(1)

  const [

  produtoNovoSelecionado,

  setProdutoNovoSelecionado

] = useState('')

  const [calculoAtual, setCalculoAtual] = useState(null)
  const [estadoCalculo, setEstadoCalculo] = useState('idle')
  const [ultimaPrecificacao, setUltimaPrecificacao] = useState(null)

    useEffect(() => {
    let ativo = true

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



    async function carregarConfiguracoesSistema() {

  const { data } = await supabase

    .from('configuracoes_sistema')

    .select('*')

    .limit(1)

    .single()



  setConfiguracaoSistema(data)

}



carregarConfiguracoesSistema()

    if (produto?.id && !modoNovoCadastro) {
      setCalculoAtual(null)
      setEstadoCalculo('loading')
      Promise.all([
        obterCustoAtualProduto(produto.id),
        obterUltimaPrecificacaoV2(produto.id)
      ]).then(([calculo, ultima]) => {
        if (!ativo) return
        setCalculoAtual(calculo)
        setEstadoCalculo(calculo ? 'ready' : 'error')
        setUltimaPrecificacao(ultima)
      }).catch(error => {
        if (!ativo) return
        console.log('Precificação V2 ainda não disponível:', error)
        setCalculoAtual(null)
        setEstadoCalculo('error')
        setUltimaPrecificacao(null)
      })
    } else {
      setCalculoAtual(null)
      setEstadoCalculo('idle')
      setUltimaPrecificacao(null)
    }



    if (modoNovoCadastro) {

      requisicaoEdicao.current += 1
      setEdicaoInicializadaPara('')
      setCarregandoEdicao(false)
      setErroEdicao('')
      setProdutoNovoSelecionado('')

      setTempoEdicao('')

      setMargemEdicao(

        configuracao?.margem_padrao || ''

      )
      setSemEmbalagemEdicao(false)

      setPrecoFinal('')

      setInsumosEdicao([])

      setNovoInsumo('')

      setNovaQuantidade(1)

      setModoEdicao(false)

      return () => { ativo = false }

    }



    if (!produto) return () => { ativo = false }

    requisicaoEdicao.current += 1
    setEdicaoInicializadaPara('')
    setCarregandoEdicao(false)
    setErroEdicao('')



    setTempoEdicao(

      produto.tempo_producao || ''

    )



    setMargemEdicao(

      produto.margem_lucro ||

      configuracao?.margem_padrao ||

      ''

    )

    setSemEmbalagemEdicao(Boolean(produto.sem_embalagem_avulsa))



    setPrecoFinal(

      produto.preco_final ||

      produto.preco ||

      ''

    )



    setInsumosEdicao([])



    setNovoInsumo('')

    setNovaQuantidade(1)

    setModoEdicao(false)

    return () => { ativo = false }
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

  const produtoEdicaoId = modoNovoCadastro ? produtoNovoSelecionado : produto?.id
  const calculoProntoParaProduto = Boolean(
    estadoCalculo === 'ready' &&
    produtoEdicaoId && calculoAtual &&
    String(calculoAtual.produto_id) === String(produtoEdicaoId)
  )

  function fichaConfereComCalculo(itens, calculo = calculoAtual, produtoId = produtoEdicaoId) {
    if (!calculo || String(calculo.produto_id) !== String(produtoId) ||
        !Array.isArray(calculo.ficha_componentes)) return false
    const referencia = calculo.ficha_componentes
    const chave = (id, quantidade) => `${String(id)}:${Number(quantidade)}`
    const carregados = itens.map(item =>
      chave(item.insumo_id || item.estoque_id || item.estoque?.id, item.quantidade)
    ).sort()
    const oficiais = referencia.map(item =>
      chave(item.estoque_id, item.quantidade)
    ).sort()
    return carregados.length === oficiais.length &&
      carregados.every((item, indice) => item === oficiais[indice])
  }

  const consultaProntaParaEdicao = !modoNovoCadastro &&
    composicaoPronta && calculoProntoParaProduto &&
    fichaConfereComCalculo(composicao)



  if (

  !aberto ||

  !configuracao ||

  (!produto && !modoNovoCadastro)

) {

    return null

  }



  function formatarMoeda(valor) {

    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) return '—'

    return Number(valor || 0).toLocaleString('pt-BR', {

      style: 'currency',

      currency: 'BRL'

    })

  }



  function formatarNumero(valor) {

    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) return '—'

    return Number(valor || 0).toLocaleString('pt-BR', {

      maximumFractionDigits: 2

    })

  }



  // O custo vigente vem da RPC V2; a prévia usa suas taxas por hora.
  // A confirmação continua sendo recalculada no banco.
  function economiaExibida() {
    if (!calculoProntoParaProduto ||
        ((modoEdicao || modoNovoCadastro) &&
         (carregandoEdicao || edicaoInicializadaPara !== String(produtoEdicaoId)))) return null
    if (!modoEdicao && !modoNovoCadastro) return {
      ficha: Number(calculoAtual.custo_ficha_tecnica),
      maoObra: Number(calculoAtual.custo_mao_obra),
      operacional: Number(calculoAtual.custo_operacional),
      producao: Number(calculoAtual.custo_producao),
      embalagem: Number(calculoAtual.custo_embalagem_avulsa),
      venda: Number(calculoAtual.custo_venda_avulsa)
    }
    return calcularPreviaPrecificacaoV2(
      calculoAtual, insumosEdicao, estoque, tempoEdicao, semEmbalagemEdicao
    )
  }

  function categoriaDoItem(item) { return item.estoque?.categoria_item || 'producao' }
  function custoInsumos() { return economiaExibida()?.ficha ?? null }
  function custoMaoDeObra() { return economiaExibida()?.maoObra ?? null }
  function custoOperacionalProduto() { return economiaExibida()?.operacional ?? null }
  function custoProducao() { return economiaExibida()?.producao ?? null }
  function custoEmbalagemPadrao() { return economiaExibida()?.embalagem ?? null }
  function custoTotalProduto() { return economiaExibida()?.venda ?? null }
  function valorHora() { return calculoAtual ? Number(calculoAtual.valor_hora) : null }
  function custoOperacionalPorHora() {
    return calculoAtual ? Number(calculoAtual.custo_operacional_por_hora) : null
  }
  function margemProduto() {
    return modoEdicao || modoNovoCadastro
      ? Number(margemEdicao || 0)
      : Number(calculoAtual?.margem_desejada || 0)
  }
  function precoSugerido() {
    if (!calculoProntoParaProduto) return null
    if (!modoEdicao && !modoNovoCadastro) return Number(calculoAtual.preco_base_sugerido)
    const divisor = 1 - margemProduto() / 100
    return divisor > 0 ? custoTotalProduto() / divisor : null
  }
  function precoCartao() {
    if (!calculoProntoParaProduto) return null
    if (!modoEdicao && !modoNovoCadastro) return Number(calculoAtual.preco_oficial_sugerido)
    const divisor = 1 - Number(calculoAtual.taxa_cartao) / 100
    return divisor > 0 ? precoSugerido() / divisor : null
  }
  function margemReal(valorVenda) {
    const venda = Number(valorVenda)
    return venda > 0 && custoTotalProduto() !== null
      ? ((venda - custoTotalProduto()) / venda) * 100 : null
  }
  function lucroNoPrecoFinal() {
    return custoTotalProduto() === null ? null : Number(precoFinal || 0) - custoTotalProduto()
  }

  function iniciarEdicao() {
    if (!consultaProntaParaEdicao) return
    setInsumosEdicao(composicao.map(item => ({ ...item, quantidade: item.quantidade })))
    setEdicaoInicializadaPara(String(produto.id))
    setErroEdicao('')
    setModoEdicao(true)
  }

  async function selecionarProdutoParaNovaPrecificacao(id) {
    const token = ++requisicaoEdicao.current
    const selecionado = produtos.find(item => String(item.id) === String(id))
    setProdutoNovoSelecionado(id)
    setModoEdicao(false)
    setEdicaoInicializadaPara('')
    setCalculoAtual(null)
    setEstadoCalculo(selecionado ? 'loading' : 'idle')
    setInsumosEdicao([])
    setErroEdicao('')
    setCarregandoEdicao(Boolean(selecionado))
    if (!selecionado) return

    setTempoEdicao(selecionado.tempo_producao || '')
    setMargemEdicao(selecionado.margem_lucro || configuracao?.margem_padrao || '')
    setSemEmbalagemEdicao(Boolean(selecionado.sem_embalagem_avulsa))
    setPrecoFinal(selecionado.preco_final || selecionado.preco || '')
    setNovoInsumo('')
    setNovaQuantidade(1)

    try {
      const [{ data, error }, calculo] = await Promise.all([
        supabase
          .from('produto_composicao')
          .select('*, estoque (id, nome, custo_unitario, categoria_item)')
          .eq('produto_id', id),
        obterCustoAtualProduto(id)
      ])
      if (token !== requisicaoEdicao.current) return
      if (error) throw error
      if (!fichaConfereComCalculo(data || [], calculo, id)) {
        throw new Error('A Ficha Técnica carregada não coincide com o custo atual.')
      }
      setCalculoAtual(calculo)
      setEstadoCalculo('ready')
      setInsumosEdicao((data || []).map(item => ({ ...item, quantidade: item.quantidade })))
      setEdicaoInicializadaPara(String(id))
      setModoEdicao(true)
    } catch (error) {
      if (token !== requisicaoEdicao.current) return
      console.error('Erro ao carregar Ficha Técnica para edição:', error)
      setEstadoCalculo('error')
      setErroEdicao('Não foi possível carregar a Ficha Técnica. Selecione o produto novamente antes de editar.')
    } finally {
      if (token === requisicaoEdicao.current) setCarregandoEdicao(false)
    }
  }



  async function salvarAlteracoes() {
    if (salvando) return

    const produtoId = modoNovoCadastro ? produtoNovoSelecionado : produto?.id
    if (!modoEdicao || carregandoEdicao ||
        edicaoInicializadaPara !== String(produtoId) ||
        (!modoNovoCadastro && !composicaoPronta) ||
        !calculoProntoParaProduto) {
      alert('A Ficha Técnica e o custo atual precisam terminar de carregar antes de confirmar.')
      return
    }
    if (semEmbalagemEdicao && calculoAtual.embalagem_configurada) {
      alert('O produto possui uma embalagem associada. Remova essa associação explicitamente em Embalagens antes de confirmar como sem embalagem.')
      return
    }
    if (!semEmbalagemEdicao && !calculoAtual.embalagem_configurada) {
      alert('Configure uma embalagem avulsa ou informe que este produto é deliberadamente vendido sem embalagem.')
      return
    }

    const tempo = Number(tempoEdicao)
    const margem = Number(margemEdicao)
    const valorFinal = Number(precoFinal)

    if (!produtoId) {
      alert('Selecione um produto.')
      return
    }
    if (!Number.isFinite(tempo) || tempo <= 0) {
      alert('Informe um tempo de produção maior que zero.')
      return
    }
    if (!Number.isFinite(margem) || margem < 0 || margem >= 100) {
      alert('A margem deve ser maior ou igual a zero e menor que 100%.')
      return
    }
    if (!Number.isFinite(valorFinal) || valorFinal <= 0) {
      alert('Informe um preço final maior que zero.')
      return
    }

    const componentes = insumosEdicao.map(item => ({
      estoque_id: item.insumo_id || item.estoque_id || item.estoque?.id,
      quantidade: Number(item.quantidade)
    }))
    if (!componentes.length || componentes.some(item =>
      !item.estoque_id || !Number.isFinite(item.quantidade) ||
      item.quantidade <= 0
    )) {
      alert('Confira os itens e as quantidades da Ficha Técnica.')
      return
    }

    const assinatura = JSON.stringify({
      produtoId,
      precoFinal: valorFinal,
      margemDesejada: margem,
      tempoProducao: tempo,
      componentes,
      semEmbalagemAvulsa: semEmbalagemEdicao
    })
    if (!operacaoPendente.current ||
        operacaoPendente.current.assinatura !== assinatura) {
      operacaoPendente.current = {
        assinatura,
        chave: globalThis.crypto.randomUUID()
      }
    }

    setSalvando(true)
    let confirmada = false
    try {
      await confirmarPrecificacaoV2({
        operacaoId: operacaoPendente.current.chave,
        produtoId,
        precoFinal: valorFinal,
        margemDesejada: margem,
        tempoProducao: tempo,
        componentes,
        semEmbalagemAvulsa: semEmbalagemEdicao
      })
      confirmada = true
      operacaoPendente.current = null

      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', produtoId)
        .single()
      if (error) throw error
      onPrecoSalvo?.(data)

      const [calculo, ultima] = await Promise.all([
        obterCustoAtualProduto(produtoId),
        obterUltimaPrecificacaoV2(produtoId)
      ])
      setCalculoAtual(calculo)
      setUltimaPrecificacao(ultima)
      setModoEdicao(false)
      alert('Precificação confirmada e registrada no histórico.')
      if (modoNovoCadastro) onClose()
    } catch (error) {
      console.log('Falha ao confirmar ou atualizar a tela de precificação:', error)
      if (confirmada) {
        setModoEdicao(false)
        alert('Precificação confirmada. Atualize a página para consultar os dados.')
      } else {
        alert(error?.message || 'Não foi possível confirmar. Tente novamente com a mesma operação.')
      }
    } finally {
      setSalvando(false)
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

      requisicaoEdicao.current += 1
      setCarregandoEdicao(false)
      setEdicaoInicializadaPara('')
      setErroEdicao('')
      setCalculoAtual(null)
      setEstadoCalculo('idle')
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

                    disabled={salvando || carregandoEdicao || edicaoInicializadaPara !== String(produtoEdicaoId) || !calculoProntoParaProduto}

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

                    disabled={salvando || carregandoEdicao || edicaoInicializadaPara !== String(produtoEdicaoId) || !consultaProntaParaEdicao}

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

                  onClick={iniciarEdicao}
                  disabled={!consultaProntaParaEdicao}

                  className="

                    border border-gray-300

                    bg-white

                    hover:bg-gray-50

                    text-gray-700

                    rounded-xl

                    px-4 py-2.5

                    font-medium

                    transition
                    disabled:opacity-60
                    disabled:cursor-not-allowed

                  "

                >

                  {erroComposicao || (composicaoPronta && calculoProntoParaProduto && !fichaConfereComCalculo(composicao))
                    ? 'Ficha Técnica indisponível'
                    : consultaProntaParaEdicao ? 'Editar precificação' : 'Carregando Ficha Técnica...'}

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

            {(carregandoEdicao || (!modoNovoCadastro && !composicaoPronta && !erroComposicao)) && (
              <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                Carregando Ficha Técnica. A edição ficará disponível quando os dados estiverem prontos.
              </p>
            )}
            {(erroComposicao || erroEdicao) && (
              <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                {erroComposicao || erroEdicao}
              </p>
            )}
            {!modoNovoCadastro && composicaoPronta && calculoProntoParaProduto &&
              !fichaConfereComCalculo(composicao) && (
                <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  A Ficha Técnica carregada não coincide com o custo atual. Atualize a página antes de editar.
                </p>
              )}






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

                    onChange={event => selecionarProdutoParaNovaPrecificacao(event.target.value)}

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

              {modoEdicao && (
                <label className="mx-5 mb-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={semEmbalagemEdicao}
                    onChange={event => setSemEmbalagemEdicao(event.target.checked)}
                  />
                  Produto deliberadamente sem embalagem avulsa
                </label>
              )}

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

                    Materiais efetivamente consumidos na fabricação. A embalagem avulsa é considerada separadamente.

                    </p>

                  </div>



                  <div className="bg-gray-100 rounded-xl px-4 py-2">

                    <p className="text-xs text-gray-500">

                      Custo da Ficha Técnica

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



                    {(modoEdicao || (!modoNovoCadastro && composicaoPronta)) && (modoEdicao

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



                    {((!modoNovoCadastro && !composicaoPronta) || carregandoEdicao) && (
                      <tr>
                        <td colSpan="6" className="px-5 py-10 text-center text-gray-500">
                          {erroComposicao || erroEdicao || 'Carregando Ficha Técnica...'}
                        </td>
                      </tr>
                    )}

                    {!carregandoEdicao && (modoEdicao || (!modoNovoCadastro && composicaoPronta)) && (modoEdicao

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

                            Adicione apenas os materiais efetivamente consumidos na fabricação.

                          </p>

                        </td>

                      </tr>

                                        )}



                  </tbody>



                </table>



              </div>






            </section>



            {/* A — produção: todos os valores são da fonte econômica V2 */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-800">A. Custo de Produção</h3>
              <p className="text-sm text-gray-500 mt-1">Ficha Técnica + Mão de Obra + Custos Operacionais.</p>
              {estadoCalculo === 'loading' && <p role="status" className="text-gray-600 mt-3">Carregando custo atual...</p>}
              {estadoCalculo === 'error' && <p role="alert" className="text-amber-700 mt-3">Custo atual indisponível. Não confirme até atualizar a página.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
                {[
                  ['Custo da Ficha Técnica', custoInsumos()],
                  ['Mão de Obra', custoMaoDeObra()],
                  ['Custos Operacionais', custoOperacionalProduto()],
                  ['Custo de Produção', custoProducao()]
                ].map(([rotulo, valor]) => (
                  <div key={rotulo} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">{rotulo}</p>
                    <p className="text-lg font-bold text-gray-800 mt-2">{formatarMoeda(valor)}</p>
                  </div>
                ))}
              </div>
              {calculoAtual && (
                <p className="text-xs text-gray-500 mt-3">
                  Custos Operacionais incluem a parcela estimada das sacolas: {formatarMoeda(calculoAtual.custo_sacolas_estimado)} ao mês
                  ({formatarMoeda(calculoAtual.custo_operacional_por_hora)} por hora operacional total).
                </p>
              )}
            </section>

            {/* B — venda avulsa */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-800">B. Custo para Venda Avulsa</h3>
              <p className="text-sm text-gray-500 mt-1">Custo de Produção + Embalagem Avulsa.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {[
                  ['Custo de Produção', custoProducao()],
                  ['Embalagem Avulsa', custoEmbalagemPadrao()],
                  ['Custo para Venda Avulsa', custoTotalProduto()]
                ].map(([rotulo, valor]) => (
                  <div key={rotulo} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">{rotulo}</p>
                    <p className="text-lg font-bold text-gray-800 mt-2">{formatarMoeda(valor)}</p>
                  </div>
                ))}
              </div>
              {semEmbalagemEdicao && modoEdicao && (
                <p className="text-sm text-gray-600 mt-3">Prévia sem embalagem: somente a Embalagem Avulsa foi zerada. O Custo de Produção permanece com a parcela de sacolas.</p>
              )}
              {calculoAtual && !semEmbalagemEdicao && !calculoAtual.embalagem_configurada && (
                <p className="text-sm text-amber-700 mt-3">Embalagem Avulsa ainda não configurada.</p>
              )}
            </section>

            {/* C — preço */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-800">C. Formação do Preço</h3>
              <p className="text-sm text-gray-500 mt-1">O preço sugerido é uma referência. Você define o preço final.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
                {[
                  ['Margem Desejada', `${formatarNumero(margemProduto())}%`],
                  ['Preço Sugerido', formatarMoeda(precoCartao())]
                ].map(([rotulo, valor]) => (
                  <div key={rotulo} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">{rotulo}</p>
                    <p className="text-lg font-bold text-gray-800 mt-2">{valor}</p>
                  </div>
                ))}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">
                    Preço Final
                  </p>
                  {modoEdicao ? (
                    <input
                      aria-label="Preço Final"
                      type="number"
                      min="0"
                      step="0.01"
                      value={precoFinal}
                      onChange={event => setPrecoFinal(event.target.value)}
                      placeholder="0,00"
                      className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
                    />
                  ) : (
                    <p className="text-lg font-bold text-gray-800 mt-2">
                      {formatarMoeda(precoFinal)}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Margem Real</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">
                    {margemReal(precoFinal) === null ? '—' : `${formatarNumero(margemReal(precoFinal))}%`}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">O Preço Sugerido já considera a taxa de cartão de {formatarNumero(calculoAtual?.taxa_cartao)}%.</p>
            </section>

            {/* D — histórico, depois da economia corrente */}
            {!modoNovoCadastro && produto && (
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-lg font-bold text-gray-800">D. Última Precificação × Custo Atual</h3>
                <p className="text-sm text-gray-500 mt-1">Mudanças de custo não alteram o Preço Final.</p>
                {!ultimaPrecificacao ? (
                  <p className="text-sm text-amber-700 mt-4">Ainda não há histórico para comparação.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold mb-2">Na última Precificação</p>
                      <p>Custo de Produção: {formatarMoeda(ultimaPrecificacao.custo_producao)}</p>
                      <p>Embalagem Avulsa: {formatarMoeda(ultimaPrecificacao.custo_embalagem_avulsa)}</p>
                      <p>Custo para Venda Avulsa: {formatarMoeda(ultimaPrecificacao.custo_venda_avulsa)}</p>
                      <p>Preço Final: {formatarMoeda(ultimaPrecificacao.preco_final_oficial)}</p>
                      <p>Margem Real: {formatarNumero(ultimaPrecificacao.margem_real)}%</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold mb-2">Hoje</p>
                      <p>Custo de Produção Atual: {formatarMoeda(calculoAtual?.custo_producao)}</p>
                      <p>Embalagem Avulsa Atual: {formatarMoeda(calculoAtual?.custo_embalagem_avulsa)}</p>
                      <p>Custo para Venda Avulsa Atual: {formatarMoeda(calculoAtual?.custo_venda_avulsa)}</p>
                      <p>Preço Final: {formatarMoeda(calculoAtual?.preco_oficial_atual)}</p>
                      <p>Margem Atual: {formatarNumero(calculoAtual?.margem_atual)}%</p>
                    </div>
                  </div>
                )}
              </section>
            )}






          </div>

        </div>

      </aside>

    </>

  )

}
