export default function ProducaoDetalhesModal({
  open,
  onClose,
  producao
}) {
  if (!open || !producao) return null

  const pedido = producao.pedidos
  const itens = pedido?.orcamentos?.orcamento_itens || []

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '-'

    return new Date(data).toLocaleDateString('pt-BR')
  }

  function calcularTotalItens() {
    return itens.reduce((total, item) => {
      return total + Number(item.subtotal || 0)
    }, 0)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Detalhes da Produção
            </h2>

            <p className="text-gray-500 text-sm">
              Pedido #{producao.pedido_id?.slice(0, 8)}
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
              {pedido?.clientes?.nome || '-'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Valor do pedido
            </p>

            <p className="font-semibold text-gray-800">
              {formatarMoeda(calcularTotalItens() || pedido?.valor)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Status da produção
            </p>

            <p className="font-semibold text-gray-800">
              {producao.status}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Status do pedido
            </p>

            <p className="font-semibold text-gray-800">
              {pedido?.status || '-'}
            </p>
          </div>

        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Início
            </p>

            <p className="font-semibold text-gray-800">
              {formatarData(producao.data_inicio)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Finalização
            </p>

            <p className="font-semibold text-gray-800">
              {formatarData(producao.data_finalizacao)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">
              Entrega
            </p>

            <p className="font-semibold text-gray-800">
              {formatarData(producao.data_entrega)}
            </p>
          </div>

        </div>

        <div className="border rounded-2xl p-5">
          <h3 className="font-bold text-gray-800 mb-4">
            Itens para produção
          </h3>

          {itens.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Nenhum item encontrado para esta produção.
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
                      {item.produtos?.nome || 'Produto'}
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
        </div>

        {producao.observacoes && (
          <div className="border rounded-2xl p-5 mt-6">
            <h3 className="font-bold text-gray-800 mb-3">
              Observações
            </h3>

            <p className="text-gray-600">
              {producao.observacoes}
            </p>
          </div>
        )}

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