import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Precificacao() {
  const [configuracao, setConfiguracao] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [composicao, setComposicao] = useState([])
  const [precoFinal, setPrecoFinal] = useState('')

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

  useEffect(() => {
    carregarConfiguracao()
    carregarProdutos()
  }, [])

  useEffect(() => {
    if (!produtoSelecionadoId) {
      setProdutoSelecionado(null)
      setComposicao([])
      setPrecoFinal('')
      return
    }

    const produto = produtos.find(item => item.id === produtoSelecionadoId)

    setProdutoSelecionado(produto || null)
    setPrecoFinal(produto?.preco_final || '')
    carregarComposicao(produtoSelecionadoId)
  }, [produtoSelecionadoId, produtos])

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
    if (!configuracao) return 0

    return (
      Number(configuracao.energia || 0) +
      Number(configuracao.internet || 0) +
      Number(configuracao.canva || 0) +
      Number(configuracao.dominio || 0) +
      Number(configuracao.outros_custos || 0)
    )
  }

  function horasMensais() {
    if (!configuracao) return 0

    return (
      Number(configuracao.horas_por_dia || 0) *
      Number(configuracao.dias_por_semana || 0) *
      4.33
    )
  }

  function valorHora() {
    const horas = horasMensais()
    if (horas <= 0) return 0

    return Number(configuracao?.pro_labore_desejado || 0) / horas
  }

  function custoFixoPorHora() {
    const horas = horasMensais()
    if (horas <= 0) return 0

    return custosFixosTotais() / horas
  }

  function metaMinima() {
    if (!configuracao) return 0

    return Number(configuracao.pro_labore_desejado || 0) + custosFixosTotais()
  }

  function metaIdeal() {
    if (!configuracao) return 0

    const margem = Number(configuracao.margem_padrao || 0)

    return metaMinima() * (1 + margem / 100)
  }

  function custoInsumos() {
    return composicao.reduce((total, item) => {
      const custoUnitario = Number(item.estoque?.custo_unitario || 0)
      const quantidade = Number(item.quantidade || 0)

      return total + custoUnitario * quantidade
    }, 0)
  }

  function horasProduto() {
    return Number(produtoSelecionado?.tempo_producao || 0) / 60
  }

  function custoMaoDeObra() {
    return horasProduto() * valorHora()
  }

  function custoFixoProduto() {
    return horasProduto() * custoFixoPorHora()
  }

  function custoTotalProduto() {
    return custoInsumos() + custoMaoDeObra() + custoFixoProduto()
  }

  function margemProduto() {
    return Number(
      produtoSelecionado?.margem_lucro ||
      configuracao?.margem_padrao ||
      0
    )
  }

  function precoSugerido() {
    const margem = margemProduto() / 100

    if (margem >= 1) return 0

    return custoTotalProduto() / (1 - margem)
  }

  function lucroSugerido() {
    return precoSugerido() - custoTotalProduto()
  }

  function margemReal(valorVenda) {
    const venda = Number(valorVenda || 0)
    if (venda <= 0) return 0

    return ((venda - custoTotalProduto()) / venda) * 100
  }

  async function salvarPrecoFinal() {
    if (!produtoSelecionado) return

    const { data, error } = await supabase
      .from('produtos')
      .update({
        preco_final: Number(precoFinal || 0),
        preco: Number(precoFinal || 0)
     })
      .eq('id', produtoSelecionado.id)
      .select()

    if (error) {
      console.log('Erro ao salvar preço final:', error)
      alert('Erro ao salvar preço final.')
      return
    }

    setProdutos(
      produtos.map(produto =>
        produto.id === produtoSelecionado.id ? data[0] : produto
      )
    )

    setProdutoSelecionado(data[0])
    alert('Preço final salvo!')
  }

  if (!configuracao) {
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

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Precificação Inteligente
          </h1>

          <p className="text-gray-500">
            Entenda seus custos, valor de hora, metas e preço ideal de venda.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Pró-labore desejado</p>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {formatarMoeda(configuracao.pro_labore_desejado)}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Custos fixos</p>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {formatarMoeda(custosFixosTotais())}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Horas mensais</p>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {formatarNumero(horasMensais())}h
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Valor da sua hora</p>
            <h2 className="text-2xl font-bold text-green-700 mt-2">
              {formatarMoeda(valorHora())}
            </h2>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Meta mínima mensal</p>
            <h2 className="text-3xl font-bold text-yellow-700 mt-2">
              {formatarMoeda(metaMinima())}
            </h2>
            <p className="text-sm text-gray-500 mt-3">
              Valor necessário para cobrir custos fixos e pró-labore.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Meta ideal mensal</p>
            <h2 className="text-3xl font-bold text-green-700 mt-2">
              {formatarMoeda(metaIdeal())}
            </h2>
            <p className="text-sm text-gray-500 mt-3">
              Meta mínima acrescida da margem padrão.
            </p>
          </div>

        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Simulador de Precificação
          </h2>

          <select
            value={produtoSelecionadoId}
            onChange={(e) => setProdutoSelecionadoId(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 mb-6"
          >
            <option value="">Selecione um produto</option>

            {produtos.map(produto => (
              <option
                key={produto.id}
                value={produto.id}
              >
                {produto.nome}
              </option>
            ))}
          </select>

          {!produtoSelecionado ? (
            <p className="text-gray-500">
              Selecione um produto para calcular a precificação.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Tempo de produção</p>
                  <p className="font-semibold text-gray-800">
                    {produtoSelecionado.tempo_producao || 0} min
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Margem desejada</p>
                  <p className="font-semibold text-gray-800">
                    {margemProduto()}%
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Custo fixo por hora</p>
                  <p className="font-semibold text-gray-800">
                    {formatarMoeda(custoFixoPorHora())}
                  </p>
                </div>

              </div>

              <div className="border rounded-2xl overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 text-gray-600">Insumo</th>
                      <th className="text-left p-4 text-gray-600">Qtd</th>
                      <th className="text-left p-4 text-gray-600">Custo Unit.</th>
                      <th className="text-left p-4 text-gray-600">Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {composicao.map(item => {
                      const custoUnitario = Number(item.estoque?.custo_unitario || 0)
                      const subtotal = custoUnitario * Number(item.quantidade || 0)

                      return (
                        <tr key={item.id} className="border-t">
                          <td className="p-4">
                            {item.estoque?.nome || '-'}
                          </td>

                          <td className="p-4">
                            {item.quantidade}
                          </td>

                          <td className="p-4">
                            {formatarMoeda(custoUnitario)}
                          </td>

                          <td className="p-4 font-semibold">
                            {formatarMoeda(subtotal)}
                          </td>
                        </tr>
                      )
                    })}

                    {composicao.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-gray-500">
                          Este produto ainda não possui ficha técnica.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Custo dos insumos</p>
                  <p className="font-semibold text-gray-800">
                    {formatarMoeda(custoInsumos())}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Mão de obra</p>
                  <p className="font-semibold text-gray-800">
                    {formatarMoeda(custoMaoDeObra())}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Custos fixos aplicados</p>
                  <p className="font-semibold text-gray-800">
                    {formatarMoeda(custoFixoProduto())}
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">

                <div className="bg-gray-900 text-white rounded-xl p-4">
                  <p className="text-sm text-gray-300">Custo total</p>
                  <p className="text-xl font-bold">
                    {formatarMoeda(custoTotalProduto())}
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-700">Preço sugerido</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatarMoeda(precoSugerido())}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700">Lucro sugerido</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatarMoeda(lucroSugerido())}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-700">Margem real</p>
                  <p className="text-xl font-bold text-purple-700">
                    {formatarNumero(margemReal(precoSugerido()))}%
                  </p>
                </div>

              </div>

              <div className="border rounded-2xl p-5">

                <h3 className="font-bold text-gray-800 mb-4">
                  Preço final
                </h3>

                <div className="flex gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="Preço final"
                    value={precoFinal}
                    onChange={(e) => setPrecoFinal(e.target.value)}
                    className="border rounded-xl px-4 py-3 flex-1"
                  />

                  <button
                    onClick={salvarPrecoFinal}
                    className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
                  >
                    Salvar Preço Final
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Preço final</p>
                    <p className="font-semibold text-gray-800">
                      {formatarMoeda(precoFinal)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Lucro no preço final</p>
                    <p className="font-semibold text-gray-800">
                      {formatarMoeda(Number(precoFinal || 0) - custoTotalProduto())}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Margem no preço final</p>
                    <p className="font-semibold text-gray-800">
                      {formatarNumero(margemReal(precoFinal))}%
                    </p>
                  </div>

                </div>

              </div>
            </>
          )}

        </div>

      </main>
    </div>
  )
}