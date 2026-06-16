export default function SimuladorMetaModal({
  open,
  onClose,
  produtos
}) {
  if (!open) return null

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Simulador de Meta
            </h2>

            <p className="text-gray-500">
              Veja quais produtos exigem menor esforço para atingir a meta.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {produtos.length === 0 ? (
          <p className="text-gray-500">
            Nenhum produto disponível para simulação.
          </p>
        ) : (
          <div className="space-y-3">
            {produtos.map(produto => (
              <div
                key={produto.id}
                className="border rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {produto.nome}
                  </p>

                  <p className="text-sm text-gray-500">
                    Preço: {formatarMoeda(produto.preco)}
                  </p>

                  <p className="text-sm text-green-700">
                    Lucro estimado: {formatarMoeda(produto.lucro)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Necessário vender
                  </p>

                  <p className="text-3xl font-bold text-blue-700">
                    {produto.unidades}
                  </p>

                  <p className="text-sm text-gray-500">
                    unidade(s)
                  </p>
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