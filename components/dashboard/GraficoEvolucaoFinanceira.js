import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts'

export default function GraficoEvolucaoFinanceira({
  dados
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          📈 Evolução financeira
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Receitas e despesas dos últimos meses.
        </p>
      </div>

      {dados.length === 0 ? (
        <p className="text-gray-500">
          Ainda não há dados financeiros para exibir.
        </p>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="mes" />

              <YAxis
  tickFormatter={(value) =>
    `R$ ${value}`
  }
/>

              <Tooltip
                formatter={(valor) =>
                  Number(valor).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })
                }
              />

              <Legend />

              <Line
  type="monotone"
  dataKey="receitas"
  name="Receitas"
  stroke="#6B8E7A"
  strokeWidth={4}
  dot={{ r: 5 }}
activeDot={{ r: 7 }}
/>

<Line
  type="monotone"
  dataKey="despesas"
  name="Despesas"
  stroke="#C97C5D"
  strokeWidth={4}
  dot={{ r: 6 }}
  activeDot={{ r: 8 }}
/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}