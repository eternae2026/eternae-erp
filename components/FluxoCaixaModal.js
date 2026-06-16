export default function FluxoCaixaModal({
  open,
  onClose,
  movimentos
}) {
  if (!open) return null

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

  const entradas = movimentos
    .filter(item => item.tipo === 'Entrada' && item.status === 'Recebido')
    .reduce((total, item) => total + Number(item.valor || 0), 0)

  const saidas = movimentos
    .filter(item => item.tipo === 'Saída')
    .reduce((total, item) => total + Number(item.valor || 0), 0)

  const saldo = entradas - saidas

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Fluxo de Caixa
            </h2>

            <p className="text-gray-500">
              Entradas, saídas e saldo do período filtrado.
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
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-gray-500">Entradas</p>
            <h3 className="text-xl font-bold text-green-700">
              {formatarMoeda(entradas)}
            </h3>
          </div>

          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-gray-500">Saídas</p>
            <h3 className="text-xl font-bold text-red-600">
              {formatarMoeda(saidas)}
            </h3>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-500">Saldo</p>
            <h3 className={`text-xl font-bold ${
              saldo >= 0 ? 'text-green-700' : 'text-red-600'
            }`}>
              {formatarMoeda(saldo)}
            </h3>
          </div>
        </div>

        <div className="border rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Data</th>
                <th className="text-left p-4 text-gray-600">Tipo</th>
                <th className="text-left p-4 text-gray-600">Descrição</th>
                <th className="text-left p-4 text-gray-600">Detalhe</th>
                <th className="text-left p-4 text-gray-600">Valor</th>
                <th className="text-left p-4 text-gray-600">Status</th>
              </tr>
            </thead>

            <tbody>
              {movimentos.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-4">
                    {formatarData(item.data)}
                  </td>

                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      item.tipo === 'Entrada'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.tipo}
                    </span>
                  </td>

                  <td className="p-4">
                    {item.descricao}
                  </td>

                  <td className="p-4">
                    {item.detalhe}
                  </td>

                  <td className={`p-4 font-semibold ${
                    item.tipo === 'Entrada'
                      ? 'text-green-700'
                      : 'text-red-600'
                  }`}>
                    {item.tipo === 'Entrada' ? '+' : '-'} {formatarMoeda(item.valor)}
                  </td>

                  <td className="p-4">
                    {item.status}
                  </td>
                </tr>
              ))}

              {movimentos.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhuma movimentação encontrada para este filtro.
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