export default function DREModal({
  open,
  onClose,
  receitas,
  despesas,
  periodo
}) {
  if (!open) return null

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const resultado = Number(receitas || 0) - Number(despesas || 0)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              DRE Simplificado
            </h2>

            <p className="text-gray-500">
              Resultado financeiro do período: {periodo}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">

          <div className="flex justify-between border-b pb-4">
            <span className="text-gray-600">
              Receita Bruta
            </span>

            <strong className="text-green-700">
              {formatarMoeda(receitas)}
            </strong>
          </div>

          <div className="flex justify-between border-b pb-4">
            <span className="text-gray-600">
              (-) Despesas
            </span>

            <strong className="text-red-600">
              {formatarMoeda(despesas)}
            </strong>
          </div>

          <div className="flex justify-between bg-gray-50 rounded-xl p-5">
            <span className="font-semibold text-gray-800">
              Resultado Operacional
            </span>

            <strong className={`text-xl ${
              resultado >= 0 ? 'text-green-700' : 'text-red-600'
            }`}>
              {formatarMoeda(resultado)}
            </strong>
          </div>

        </div>

        <p className="text-sm text-gray-500 mt-6">
          Este DRE simplificado considera as entradas recebidas e as saídas registradas no período selecionado.
        </p>

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