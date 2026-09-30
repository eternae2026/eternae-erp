// Prévia transitória para campos ainda não confirmados. As taxas vigentes
// vêm da RPC V2; o banco recalcula tudo novamente ao confirmar.
export function calcularPreviaPrecificacaoV2(calculo, componentes, estoque, tempoMinutos, semEmbalagem) {
  if (!calculo) return null
  const ficha = componentes.reduce((soma, item) => {
    const estoqueId = item.insumo_id || item.estoque_id || item.estoque?.id
    const custoUnitario = estoque.find(insumo => insumo.id === estoqueId)?.custo_unitario
      ?? item.estoque?.custo_unitario
    return soma + Number(item.quantidade || 0) * Number(custoUnitario || 0)
  }, 0)
  const horas = Number(tempoMinutos || 0) / 60
  const maoObra = horas * Number(calculo.valor_hora)
  const operacional = horas * Number(calculo.custo_operacional_por_hora)
  const producao = ficha + maoObra + operacional
  const embalagem = semEmbalagem ? 0 : Number(calculo.custo_embalagem_avulsa)
  return { ficha, maoObra, operacional, producao, embalagem, venda: producao + embalagem }
}
