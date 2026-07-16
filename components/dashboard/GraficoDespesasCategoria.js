import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'

const CORES = [
  '#A8B5A2', // verde sálvia
  '#C9A27E', // areia
  '#D8C3A5', // bege
  '#B7A59A', // taupe
  '#C97C5D', // terracota
  '#9BA7B0', // azul acinzentado
  '#E3D5CA'  // linho
]

export default function GraficoDespesasCategoria({
  dados
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          💸 Despesas por categoria
        </h2>

        <p className="text-sm text-gray-500 mt-1">
  Veja para onde o dinheiro está indo.

  {dados.length === 1 && (
    <span className="block mt-1 text-xs text-gray-400">
      Adicione mais despesas para visualizar melhor a distribuição.
    </span>
  )}
</p>
      </div>

      {dados.length === 0 ? (
        <p className="text-gray-500">
          Ainda não há despesas para exibir.
        </p>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dados}
                dataKey="valor"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ percent }) =>
  `${(percent * 100).toFixed(0)}%`
}
              >
                {dados.map((item, index) => (
                  <Cell
                    key={`${item.categoria}-${index}`}
                    fill={CORES[index % CORES.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(valor) =>
                  Number(valor).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })
                }
              />

              <Legend
  verticalAlign="bottom"
  height={40}
/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}