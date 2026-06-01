import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function RelatorioPrecificacao() {
  const [configuracao, setConfiguracao] = useState(null)
  const [produtos, setProdutos] = useState([])

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
      .select(`
        *,
        produto_composicao (
          id,
          quantidade,
          estoque (
            nome,
            custo_unitario
          )
        )
      `)
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar produtos:', error)
      return
    }

    setProdutos(data || [])
  }

  useEffect(() => {
    carregarConfiguracao()
    carregarProdutos()
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

  function custoInsumos(produto) {
    const composicao = produto.produto_composicao || []

    return composicao.reduce((total, item) => {
      const custoUnitario = Number(item.estoque?.custo_unitario || 0)
      const quantidade = Number(item.quantidade || 0)

      return total + custoUnitario * quantidade
    }, 0)
  }

  function horasProduto(produto) {
    return Number(produto.tempo_producao || 0) / 60
  }

  function custoMaoDeObra(produto) {
    return horasProduto(produto) * valorHora()
  }

  function custoFixoProduto(produto) {
    return horasProduto(produto) * custoFixoPorHora()
  }

  function custoTotal(produto) {
    return (
      custoInsumos(produto) +
      custoMaoDeObra(produto) +
      custoFixoProduto(produto)
    )
  }

  function precoAtual(produto) {
    return Number(produto.preco_final || produto.preco || 0)
  }

  function lucroEstimado(produto) {
    return precoAtual(produto) - custoTotal(produto)
  }

  function margemReal(produto) {
    const preco = precoAtual(produto)

    if (preco <= 0) return 0

    return (lucroEstimado(produto) / preco) * 100
  }

  function statusMargem(produto) {
  const margem = Number(margemReal(produto).toFixed(2))
  const margemDesejada = Number(
    produto.margem_lucro ||
    configuracao?.margem_padrao ||
    0
  )

  if (margem >= margemDesejada) return 'Saudável'
  if (margem >= margemDesejada * 0.75) return 'Reduzida'
  return 'Crítica'
}

  function corStatus(status) {
  if (status === 'Saudável') return 'bg-green-100 text-green-700'
  if (status === 'Reduzida') return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function totalProdutos() {
  return produtos.length
}

function lucroMedio() {
  if (produtos.length === 0) return 0

  const total = produtos.reduce(
    (soma, produto) => soma + lucroEstimado(produto),
    0
  )

  return total / produtos.length
}

function margemMedia() {
  if (produtos.length === 0) return 0

  const total = produtos.reduce(
    (soma, produto) => soma + margemReal(produto),
    0
  )

  return total / produtos.length
}

function produtosEmAtencao() {
  return produtos.filter(
    produto => statusMargem(produto) !== 'Saudável'
  ).length
}

  if (!configuracao) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />

        <main className="flex-1 p-8">
          <p className="text-gray-500">
            Carregando relatório...
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
    Relatório de Precificação
  </h1>

  <p className="text-gray-500">
    Consulte custos, preços, lucros e margens reais dos produtos.
  </p>
</div>

<div className="grid grid-cols-4 gap-6 mb-8">

  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-gray-500">
      Produtos Precificados
    </p>

    <h2 className="text-3xl font-bold text-gray-800 mt-2">
      {totalProdutos()}
    </h2>
  </div>

  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-gray-500">
      Lucro Médio
    </p>

    <h2 className="text-3xl font-bold text-green-700 mt-2">
      {formatarMoeda(lucroMedio())}
    </h2>
  </div>

  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-gray-500">
      Margem Média
    </p>

    <h2 className="text-3xl font-bold text-blue-700 mt-2">
      {formatarNumero(margemMedia())}%
    </h2>
  </div>

  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-gray-500">
      Produtos em Atenção
    </p>

    <h2 className="text-3xl font-bold text-yellow-600 mt-2">
      {produtosEmAtencao()}
    </h2>
  </div>

</div>

        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1200px]">

            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Produto</th>
                <th className="text-left p-4 text-gray-600">Insumos</th>
                <th className="text-left p-4 text-gray-600">Mão de Obra</th>
                <th className="text-left p-4 text-gray-600">Custo Fixo</th>
                <th className="text-left p-4 text-gray-600">Custo Total</th>
                <th className="text-left p-4 text-gray-600">Preço Atual</th>
                <th className="text-left p-4 text-gray-600">Lucro</th>
                <th className="text-left p-4 text-gray-600">Margem</th>
                <th className="text-left p-4 text-gray-600">Status</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map(produto => {
                const status = statusMargem(produto)

                return (
                  <tr
                    key={produto.id}
                    className="border-t"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {produto.nome}
                        </p>

                        <p className="text-xs text-gray-500">
                          Tempo: {produto.tempo_producao || 0} min
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      {formatarMoeda(custoInsumos(produto))}
                    </td>

                    <td className="p-4">
                      {formatarMoeda(custoMaoDeObra(produto))}
                    </td>

                    <td className="p-4">
                      {formatarMoeda(custoFixoProduto(produto))}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatarMoeda(custoTotal(produto))}
                    </td>

                    <td className="p-4 font-semibold text-green-700">
                      {formatarMoeda(precoAtual(produto))}
                    </td>

                    <td className="p-4">
                      {formatarMoeda(lucroEstimado(produto))}
                    </td>

                    <td className="p-4">
                      {formatarNumero(margemReal(produto))}%
                    </td>

                    <td className="p-4">
                      <span className={`${corStatus(status)} px-3 py-1 rounded-full text-sm`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {produtos.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
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