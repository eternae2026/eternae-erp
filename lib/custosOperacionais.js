import { supabase } from './supabase'

export async function obterTotalCustosOperacionais() {
  const { data, error } = await supabase
    .from('custos_operacionais')
    .select('valor_mensal')
    .eq('ativo', true)

  if (error) {
    throw error
  }

  return (data || []).reduce(
    (total, custo) =>
      total + Number(custo.valor_mensal || 0),
    0
  )
}
