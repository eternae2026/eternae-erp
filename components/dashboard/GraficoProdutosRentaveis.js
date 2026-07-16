import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList
} from 'recharts'

export default function GraficoProdutosRentaveis({
  dados
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">

      <h2 className="text-2xl font-bold text-gray-800">
        💎 Produtos mais rentáveis
      </h2>

      <p className="text-gray-500 mt-1 mb-6">
        Produtos com maior faturamento.
      </p>

      {dados.length === 0 ? (
        <p className="text-gray-400">
          Nenhum dado disponível.
        </p>
      ) : (
        <div className="h-72">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={dados}
              layout="vertical"
              margin={{
  top: 10,
  right: 90,
  left: 50,
  bottom: 10
}}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
                tickFormatter={v =>
                  `R$ ${v}`
                }
              />

              <YAxis
                type="category"
                dataKey="nome"
                width={140}
              />

              <Tooltip
                formatter={valor =>
                  `R$ ${Number(
                    valor
                  ).toLocaleString(
                    'pt-BR'
                  )}`
                }
              />

              <Bar
  dataKey="total"
  radius={[0, 8, 8, 0]}
  fill="#D6A76A"
>
  <LabelList
    dataKey="total"
    position="right"
    formatter={(valor) =>
      Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    }
    fill="#374151"
    fontSize={13}
    fontWeight={600}
  />
</Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>
      )}
    </div>
  )
}