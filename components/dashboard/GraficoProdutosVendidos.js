import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
ResponsiveContainer,
LabelList
} from 'recharts'

export default function GraficoProdutosVendidos({
  dados
}) {
  if (!dados?.length) return null

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800">
        🏆 Produtos mais vendidos
      </h2>

      <p className="text-gray-500 text-sm mt-1 mb-6">
        Produtos mais vendidos do período.
      </p>

      <div className="h-80">
        <ResponsiveContainer>
          <BarChart
            data={dados}
            layout="vertical"
            margin={{
              top: 10,
              right: 30,
              left: 40,
              bottom: 10
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis type="number" />

            <YAxis
              type="category"
              dataKey="nome"
              width={180}
            />

            <Tooltip />

            <Bar
  dataKey="quantidade"
  radius={[0, 10, 10, 0]}
  fill="#7A9275"
>
  <LabelList
    dataKey="quantidade"
    position="right"
    fill="#374151"
    fontSize={13}
    fontWeight={600}
  />
</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}