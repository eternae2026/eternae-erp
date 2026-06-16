export default function RecebimentosPendentesModal({
  open,
  onClose,
  lancamentos,
  onReceber
}) {
  if (!open) return null

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const pendentes = lancamentos.filter(item => item.status === 'Pendente')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Recebimentos Pendentes
            </h2>

            <p className="text-gray-500">
              Confirme os pagamentos recebidos dos clientes.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {pendentes.length === 0 ? (
          <p className="text-gray-500">
            Nenhum recebimento pendente.
          </p>
        ) : (
          <div className="space-y-3">
            {pendentes.map(item => (
              <div
                key={item.id}
                className="border rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {item.clientes?.nome || 'Cliente'}
                  </p>

                  <p className="text-sm text-gray-500">
                    Pedido #{item.pedido_id?.slice(0, 8) || '-'}
                  </p>

                  <p className="text-sm text-yellow-700 mt-1">
                    Pendente
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-800 mb-3">
                    {formatarMoeda(item.valor)}
                  </p>

                  <button
                    onClick={() => onReceber(item)}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition"
                  >
                    Confirmar recebimento
                  </button>
                </div>
              </div>
            ))}
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