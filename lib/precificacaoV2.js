import { supabase } from './supabase'

function numero(valor) {
  const resultado = Number(valor)
  return Number.isFinite(resultado) ? resultado : 0
}

export async function obterCustoAtualProduto(produtoId) {
  const { data, error } = await supabase.rpc(
    'calcular_custo_atual_produto',
    { p_produto_id: produtoId }
  )

  if (error) throw error
  return Array.isArray(data) ? data[0] || null : data
}

export async function obterUltimaPrecificacaoV2(produtoId) {
  const { data, error } = await supabase
    .from('precificacoes_v2')
    .select('*, precificacoes_v2_componentes(*)')
    .eq('produto_id', produtoId)
    .order('confirmada_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function confirmarPrecificacaoV2({
  operacaoId,
  produtoId,
  precoFinal,
  margemDesejada,
  tempoProducao,
  componentes,
  semEmbalagemAvulsa
}) {
  const { data, error } = await supabase.rpc(
    'confirmar_precificacao_v2',
    {
      p_operacao_id: operacaoId,
      p_produto_id: produtoId,
      p_preco_final: numero(precoFinal),
      p_margem_desejada: numero(margemDesejada),
      p_tempo_producao: numero(tempoProducao),
      p_componentes: componentes.map(item => ({
        estoque_id: item.estoque_id || item.insumo_id || item.estoque?.id,
        quantidade: numero(item.quantidade)
      })),
      p_sem_embalagem: semEmbalagemAvulsa
    }
  )

  if (error) throw error
  return data
}

export function custoAtualParaInterface(calculo) {
  if (!calculo) return null

  return {
    ficha: numero(calculo.custo_ficha_tecnica),
    maoObra: numero(calculo.custo_mao_obra),
    operacional: numero(calculo.custo_operacional),
    sacolas: numero(calculo.custo_sacolas_estimado),
    producao: numero(calculo.custo_producao),
    embalagem: numero(calculo.custo_embalagem_avulsa),
    vendaAvulsa: numero(calculo.custo_venda_avulsa),
    precoBaseSugerido: numero(calculo.preco_base_sugerido),
    precoOficialSugerido: numero(calculo.preco_oficial_sugerido),
    precoOficialAtual: numero(calculo.preco_oficial_atual),
    margemAtual: numero(calculo.margem_atual),
    embalagemConfigurada: Boolean(calculo.embalagem_configurada),
    semEmbalagem: Boolean(calculo.sem_embalagem_avulsa)
  }
}
