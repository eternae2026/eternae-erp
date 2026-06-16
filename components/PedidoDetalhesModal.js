export default function PedidoDetalhesModal({
  open,
  onClose,
  pedido
}) {
  if (!open || !pedido) return null

  const itens = pedido.orcamentos?.orcamento_itens || []

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function calcularTotalItens() {
    return itens.reduce((total, item) => {
      return total + Number(item.subtotal || 0)
    }, 0)
  }

  function statusPagamento() {
    if (!pedido.financeiro) return 'Sem cobrança'

    if (Array.isArray(pedido.financeiro)) {
      if (pedido.financeiro.length === 0) return 'Sem cobrança'
      return pedido.financeiro[0].status
    }

    return pedido.financeiro.status
  }

  function nomeItem(item) {
    return item.nome_item || item.produtos?.nome || 'Item'
  }

  function tipoItem(item) {
    if (item.tipo_item === 'kit') return '🎁 Kit'
    return '🛍️ Produto'
  }

  const totalItens = calcularTotalItens()

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Detalhes do Pedido
            </h2>

            <p className="text-gray-500 text-sm">
              Pedido #{pedido.id.slice(0, 8)}
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

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Cliente
            </p>

            <p className="font-semibold text-gray-800">
              {pedido.clientes?.nome || '-'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Valor total
            </p>

            <p className="font-semibold text-gray-800">
              {formatarMoeda(totalItens)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Status do pedido
            </p>

            <p className="font-semibold text-gray-800">
              {pedido.status}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Pagamento
            </p>

            <p className={`font-semibold ${
              statusPagamento() === 'Recebido'
                ? 'text-green-700'
                : statusPagamento() === 'Pendente'
                  ? 'text-yellow-700'
                  : 'text-gray-800'
            }`}>
              {statusPagamento()}
            </p>
          </div>

        </div>

        <div className="border rounded-2xl p-5">
          <h3 className="font-bold text-gray-800 mb-4">
            Itens do pedido
          </h3>

          {itens.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Nenhum item encontrado para este pedido.
            </p>
          ) : (
            <div className="space-y-3">
              {itens.map(item => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {nomeItem(item)}
                    </p>

                    <p className="text-xs text-gray-400 mb-1">
                      {tipoItem(item)}
                    </p>

                    <p className="text-sm text-gray-500">
                      Valor unitário: {formatarMoeda(item.valor_unitario)}
                    </p>

                    <p className="text-sm text-gray-500">
                      Quantidade: {item.quantidade}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Subtotal
                    </p>

                    <p className="font-semibold text-gray-800">
                      {formatarMoeda(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-5">
            <div className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold">
              Total: {formatarMoeda(totalItens)}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  )
}