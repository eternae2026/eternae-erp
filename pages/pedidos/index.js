import Sidebar from '../../components/Sidebar'

export default function Pedidos() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Pedidos
            </h1>

            <p className="text-gray-500">
              Acompanhe a produção e entrega dos pedidos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">
              Novo Pedido
            </h3>

            <p className="text-gray-500 text-sm">
              Nenhum pedido nesta etapa.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">
              Aguardando Pagamento
            </h3>

            <p className="text-gray-500 text-sm">
              Nenhum pedido nesta etapa.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">
              Arte / Aprovação
            </h3>

            <p className="text-gray-500 text-sm">
              Nenhum pedido nesta etapa.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">
              Produção
            </h3>

            <p className="text-gray-500 text-sm">
              Nenhum pedido nesta etapa.
            </p>
          </div>

        </div>

      </main>
    </div>
  )
}