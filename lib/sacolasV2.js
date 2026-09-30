import { supabase } from './supabase'

export function calcularCustoMensalSacolas(estimativaPedidosMes, sacolasPorPedido, custoUnitario) {
  const valores = [estimativaPedidosMes, sacolasPorPedido, custoUnitario].map(Number)
  if (valores.some(valor => !Number.isFinite(valor) || valor < 0)) return null
  return valores[0] * valores[1] * valores[2]
}

// Exibição da parcela derivada; a precificação confirmada é recalculada no banco.
export async function obterResumoSacolasV2() {
  const { data: configuracao, error: erroConfiguracao } = await supabase
    .from('configuracoes_sistema')
    .select('sacola_estoque_id,quantidade_sacolas_por_pedido,estimativa_pedidos_mes')
    .order('created_at')
    .order('id')
    .limit(1)
    .maybeSingle()
  if (erroConfiguracao) throw erroConfiguracao

  let sacola = null
  if (configuracao?.sacola_estoque_id) {
    const { data, error } = await supabase.from('estoque')
      .select('id,nome,custo_unitario,categoria_item,ativo')
      .eq('id', configuracao.sacola_estoque_id)
      .single()
    if (error) throw error
    sacola = data
  }
  const custoUnitario = sacola ? Number(sacola.custo_unitario) : 0
  return {
    configuracao, sacola, custoUnitario,
    custoMensal: calcularCustoMensalSacolas(
      configuracao?.estimativa_pedidos_mes ?? 0,
      configuracao?.quantidade_sacolas_por_pedido ?? 0,
      custoUnitario
    )
  }
}
