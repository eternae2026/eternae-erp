import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

export default function GraficoFinanceiro({
  entradas,
  saidas
}) {
  const dados = [
    {
      nome: 'Receitas',
      valor: entradas
    },
    {
      nome: 'Despesas',
      valor: saidas
    }
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">

      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          📊 Receitas x Despesas
        </h2>

        <p className="text-gray-500 text-sm">
          Comparativo financeiro do período.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="nome" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="valor"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}