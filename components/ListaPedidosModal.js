export default function ListaPedidosModal({
  open,
  onClose,
  pedidos,
  formatarMoeda,
  calcularTotalPedido,
  etapaPedido,
  statusPagamento
}) {
  if (!open) return null

  const totalPedidos = pedidos.length

  const valorTotal = pedidos.reduce((total, pedido) => {
    return total + Number(calcularTotalPedido(pedido) || 0)
  }, 0)

  const ticketMedio = totalPedidos > 0 ? valorTotal / totalPedidos : 0

  function formatarData(data) {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Lista de Pedidos
            </h2>

            <p className="text-gray-500">
              Pedidos conforme os filtros selecionados.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-500">Total de pedidos</p>
            <h3 className="text-xl font-bold text-gray-800">
              {totalPedidos}
            </h3>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-gray-500">Valor total</p>
            <h3 className="text-xl font-bold text-green-700">
              {formatarMoeda(valorTotal)}
            </h3>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-gray-500">Ticket médio</p>
            <h3 className="text-xl font-bold text-blue-700">
              {formatarMoeda(ticketMedio)}
            </h3>
          </div>
        </div>

        <div className="border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Cliente</th>
                <th className="text-left p-4 text-gray-600">Data</th>
                <th className="text-left p-4 text-gray-600">Valor</th>
                <th className="text-left p-4 text-gray-600">Etapa</th>
                <th className="text-left p-4 text-gray-600">Pagamento</th>
              </tr>
            </thead>

            <tbody>
              {pedidos.map(pedido => (
                <tr key={pedido.id} className="border-t">
                  <td className="p-4">
                    {pedido.clientes?.nome || '-'}
                  </td>

                  <td className="p-4">
                    {formatarData(pedido.created_at)}
                  </td>

                  <td className="p-4 font-semibold">
                    {formatarMoeda(calcularTotalPedido(pedido))}
                  </td>

                  <td className="p-4">
                    {etapaPedido(pedido)}
                  </td>

                  <td className="p-4">
                    {statusPagamento(pedido) || 'Pendente'}
                  </td>
                </tr>
              ))}

              {pedidos.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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