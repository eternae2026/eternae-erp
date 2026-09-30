import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'
import { obterCustoAtualProduto } from '../../lib/precificacaoV2'

const moeda = valor => Number(valor).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL'
})
const percentual = valor => `${Number(valor).toLocaleString('pt-BR', {
  maximumFractionDigits: 2
})}%`

export default function RelatorioPrecificacao() {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const { data, error } = await supabase.from('produtos')
          .select('id,nome,tempo_producao')
          .order('nome', { ascending: true })
        if (error) throw error
        const custos = await Promise.all((data || []).map(async produto => {
          const calculo = await obterCustoAtualProduto(produto.id)
          if (!calculo) throw new Error(`Custo V2 indisponível para ${produto.nome}.`)
          return { ...produto, calculo }
        }))
        if (ativo) setProdutos(custos)
      } catch (falha) {
        console.error('Relatório de Precificação V2 indisponível:', falha)
        if (ativo) setErro('Não foi possível carregar o custo atual. Atualize a página ou verifique o cálculo da Precificação.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    carregar()
    return () => { ativo = false }
  }, [])

  const lucro = produto => Number(produto.calculo.preco_oficial_atual) -
    Number(produto.calculo.custo_venda_avulsa)
  const validos = produtos.filter(produto =>
    Number(produto.calculo.preco_oficial_atual) > 0)
  const lucroMedio = validos.length
    ? validos.reduce((total, produto) => total + lucro(produto), 0) / validos.length : 0
  const margemMedia = validos.length
    ? validos.reduce((total, produto) => total + Number(produto.calculo.margem_atual), 0) / validos.length : 0

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800">Relatório de Precificação</h1>
        <p className="text-gray-500 mt-2 mb-8">
          Custo atual, Preço Final e margem atual. O preço não muda automaticamente.
        </p>
        {carregando && <p className="text-gray-500">Carregando custos atuais...</p>}
        {erro && <p role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl mb-6">{erro}</p>}
        {!carregando && !erro && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                ['Produtos', produtos.length],
                ['Lucro médio estimado', moeda(lucroMedio)],
                ['Margem atual média', percentual(margemMedia)]
              ].map(([rotulo, valor]) => (
                <div key={rotulo} className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="text-gray-500">{rotulo}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{valor}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full min-w-[1450px]">
                <thead className="bg-gray-50">
                  <tr>
                    {['Produto', 'Ficha Técnica', 'Mão de Obra', 'Custos Operacionais', 'Custo de Produção', 'Embalagem Avulsa', 'Custo para Venda Avulsa', 'Preço Final', 'Lucro estimado', 'Margem Atual'].map(titulo => (
                      <th key={titulo} className="text-left p-4 text-gray-600">{titulo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {produtos.map(produto => {
                    const c = produto.calculo
                    return (
                      <tr key={produto.id} className="border-t">
                        <td className="p-4">
                          <p className="font-semibold">{produto.nome}</p>
                          <p className="text-xs text-gray-500">{produto.tempo_producao || 0} min</p>
                        </td>
                        <td className="p-4">{moeda(c.custo_ficha_tecnica)}</td>
                        <td className="p-4">{moeda(c.custo_mao_obra)}</td>
                        <td className="p-4">
                          {moeda(c.custo_operacional)}
                          <p className="text-xs text-gray-500">Inclui parcela estimada das sacolas</p>
                        </td>
                        <td className="p-4 font-semibold">{moeda(c.custo_producao)}</td>
                        <td className="p-4">
                          {moeda(c.custo_embalagem_avulsa)}
                          {c.sem_embalagem_avulsa && <p className="text-xs">Sem embalagem, deliberado</p>}
                          {!c.embalagem_configurada && !c.sem_embalagem_avulsa &&
                            <p className="text-xs text-amber-700">Ainda não configurada</p>}
                        </td>
                        <td className="p-4 font-semibold">{moeda(c.custo_venda_avulsa)}</td>
                        <td className="p-4 text-green-700 font-semibold">{moeda(c.preco_oficial_atual)}</td>
                        <td className="p-4">{moeda(lucro(produto))}</td>
                        <td className="p-4">{percentual(c.margem_atual)}</td>
                      </tr>
                    )
                  })}
                  {produtos.length === 0 && (
                    <tr><td colSpan={10} className="p-6 text-center text-gray-500">Nenhum produto cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
