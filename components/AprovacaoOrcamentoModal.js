export default function AprovacaoOrcamentoModal({
  open,
  onClose,
  orcamento,
  politicaComercial,
  onConfirmar
}) {
  if (!open || !orcamento) return null

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const valorOrcamento = Number(orcamento.valor || 0)
  const percentualDesconto = Number(politicaComercial?.taxa_cartao || 0)
  const descontoPix = valorOrcamento * (percentualDesconto / 100)
  const valorPix = valorOrcamento - descontoPix

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Aprovar orçamento
            </h2>

            <p className="text-gray-500">
              Escolha a forma de pagamento para gerar o pedido.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => onConfirmar('Cartão')}
            className="border rounded-2xl p-5 hover:bg-blue-50 transition text-left"
          >
            <p className="text-sm text-gray-500">Cartão</p>

            <p className="text-2xl font-bold text-gray-800">
              {formatarMoeda(valorOrcamento)}
            </p>
          </button>

          <button
            onClick={() => onConfirmar('PIX')}
            className="border rounded-2xl p-5 hover:bg-green-50 transition text-left"
          >
            <p className="text-sm text-gray-500">
              PIX com desconto ({percentualDesconto.toFixed(2)}%)
            </p>

            <p className="text-2xl font-bold text-green-700">
              {formatarMoeda(valorPix)}
            </p>

            {descontoPix > 0 && (
              <p className="text-xs text-green-700 mt-1">
                Desconto de {formatarMoeda(descontoPix)}
              </p>
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}