import { useEffect, useState } from 'react'
import RelatorioDetalheModal from '../../components/RelatorioDetalheModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Relatorios() {
  const [financeiro, setFinanceiro] = useState([])
  const [saidas, setSaidas] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [composicoes, setComposicoes] = useState([])
  const [estoque, setEstoque] = useState([])

  const [tipoConsulta, setTipoConsulta] = useState('MesEspecifico')
  const [mesSelecionado, setMesSelecionado] = useState(String(new Date().getMonth() + 1))
  const [anoSelecionado, setAnoSelecionado] = useState(String(new Date().getFullYear()))
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  const [modalAberto, setModalAberto] = useState(null)

  useEffect(() => {
    carregarRelatorios()
  }, [])

  async function carregarRelatorios() {
    await carregarFinanceiro()
    await carregarSaidas()
    await carregarPedidos()
    await carregarComposicoes()
    await carregarEstoque()
  }

  async function carregarFinanceiro() {
    const { data, error } = await supabase
      .from('financeiro')
      .select(`
        *,
        clientes (
          nome
        )
      `)

    if (error) {
      console.log('Erro ao carregar financeiro:', error)
      return
    }

    setFinanceiro(data || [])
  }

  async function carregarSaidas() {
    const { data, error } = await supabase
      .from('financeiro_saidas')
      .select('*')

    if (error) {
      console.log('Erro ao carregar saídas:', error)
      return
    }

    setSaidas(data || [])
  }

  async function carregarPedidos() {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (
          nome
        ),
        orcamentos (
          orcamento_itens (
            id,
            produto_id,
            nome_item,
            tipo_item,
            quantidade,
            valor_unitario,
            subtotal,
            produtos (
              *
            )
          )
        )
      `)

    if (error) {
      console.log('Erro ao carregar pedidos:', error)
      return
    }

    setPedidos(data || [])
  }

  async function carregarComposicoes() {
    const { data, error } = await supabase
      .from('produto_composicao')
      .select('*')

    if (error) {
      console.log('Erro ao carregar composição dos produtos:', error)
      return
    }

    setComposicoes(data || [])
  }

  async function carregarEstoque() {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')

    if (error) {
      console.log('Erro ao carregar estoque:', error)
      return
    }

    setEstoque(data || [])
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      maximumFractionDigits: 2
    })
  }

  function formatarPercentual(valor) {
    return `${formatarNumero(valor)}%`
  }

  function dataDentroDoPeriodo(data) {
    if (!data) return false

    const dataBase = new Date(data)

    if (tipoConsulta === 'Todos') return true

    if (tipoConsulta === 'MesEspecifico') {
      return (
        dataBase.getMonth() + 1 === Number(mesSelecionado) &&
        dataBase.getFullYear() === Number(anoSelecionado)
      )
    }

    if (tipoConsulta === 'PeriodoPersonalizado') {
      if (!dataInicial || !dataFinal) return true

      const inicio = new Date(dataInicial)
      const fim = new Date(dataFinal)

      return dataBase >= inicio && dataBase <= fim
    }

    return true
  }

  const financeiroFiltrado = financeiro.filter(item =>
    dataDentroDoPeriodo(item.data_pagamento || item.created_at)
  )

  const saidasFiltradas = saidas.filter(item =>
    dataDentroDoPeriodo(item.data_saida || item.created_at)
  )

  const pedidosFiltrados = pedidos.filter(item =>
    dataDentroDoPeriodo(item.created_at) &&
    item.status !== 'Cancelado' &&
    item.etapa_producao !== 'Cancelado'
  )

  function faturamentoRecebido() {
    return financeiroFiltrado
      .filter(item => item.status === 'Recebido')
      .reduce((total, item) => total + Number(item.valor || 0), 0)
  }

  function totalSaidas() {
    return saidasFiltradas.reduce((total, item) => total + Number(item.valor || 0), 0)
  }

  function resultado() {
    return faturamentoRecebido() - totalSaidas()
  }

  function pedidosTotal() {
    return pedidosFiltrados.length
  }

  function ticketMedio() {
    if (pedidosTotal() === 0) return 0
    return faturamentoRecebido() / pedidosTotal()
  }

  function clientesMaisCompraram() {
    const clientes = {}

    financeiroFiltrado
      .filter(item => item.status === 'Recebido')
      .forEach(item => {
        const nome = item.clientes?.nome || 'Cliente'
        clientes[nome] = Number(clientes[nome] || 0) + Number(item.valor || 0)
      })

    return Object.entries(clientes)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
  }

  function produtosMaisVendidos() {
    const produtos = {}

    pedidosFiltrados.forEach(pedido => {
      const itens = pedido.orcamentos?.orcamento_itens || []

      itens.forEach(item => {
        const nome =
          item.nome_item ||
          item.produtos?.nome ||
          'Item'

        produtos[nome] =
          Number(produtos[nome] || 0) +
          Number(item.quantidade || 1)
      })
    })

    return Object.entries(produtos)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
  }

  function custoUnitarioProduto(produtoId) {
    if (!produtoId) return 0

    const composicaoProduto = composicoes.filter(
      item => item.produto_id === produtoId
    )

    if (composicaoProduto.length === 0) return 0

    return composicaoProduto.reduce((total, composicao) => {
      const insumo = estoque.find(item => item.id === composicao.insumo_id)

      const custoInsumo = Number(insumo?.custo_unitario || 0)
      const quantidadeInsumo = Number(composicao.quantidade || 0)

      return total + (custoInsumo * quantidadeInsumo)
    }, 0)
  }

  function lucroPorProduto() {
    const produtos = {}

    pedidosFiltrados.forEach(pedido => {
      const itens = pedido.orcamentos?.orcamento_itens || []

      itens.forEach(item => {
        const nome =
          item.nome_item ||
          item.produtos?.nome ||
          'Item'

        const quantidade = Number(item.quantidade || 1)
        const faturamento = Number(item.subtotal || 0)
        const custoUnitario = custoUnitarioProduto(item.produto_id)
        const custoTotal = custoUnitario * quantidade
        const lucro = faturamento - custoTotal

        if (!produtos[nome]) {
          produtos[nome] = {
            nome,
            quantidade: 0,
            faturamento: 0,
            custo: 0,
            lucro: 0,
            margem: 0
          }
        }

        produtos[nome].quantidade += quantidade
        produtos[nome].faturamento += faturamento
        produtos[nome].custo += custoTotal
        produtos[nome].lucro += lucro
      })
    })

    return Object.values(produtos)
      .map(produto => ({
        ...produto,
        margem: produto.faturamento > 0
          ? (produto.lucro / produto.faturamento) * 100
          : 0
      }))
      .sort((a, b) => b.lucro - a.lucro)
  }

  function nomeMes(mes) {
    const nomes = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ]

    return nomes[Number(mes) - 1]
  }

  function formatarMesAno(chave) {
    const [ano, mes] = chave.split('-')
    return `${nomeMes(Number(mes))}/${String(ano).slice(2)}`
  }

  function mesesRelatorio() {
    const meses = {}

    financeiroFiltrado
      .filter(item => item.status === 'Recebido')
      .forEach(item => {
        if (!item.data_pagamento) return

        const data = new Date(item.data_pagamento)
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`

        meses[chave] = Number(meses[chave] || 0) + Number(item.valor || 0)
      })

    return Object.entries(meses)
      .map(([mes, valor]) => ({ mes, valor }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
  }

  function baixarCSV(nomeArquivo, linhas) {
    if (!linhas || linhas.length === 0) {
      alert('Não há dados para exportar.')
      return
    }

    const cabecalhos = Object.keys(linhas[0])

    const conteudo = [
      cabecalhos.join(';'),
      ...linhas.map(linha =>
        cabecalhos.map(campo => {
          const valor = linha[campo] ?? ''
          return `"${String(valor).replace(/"/g, '""')}"`
        }).join(';')
      )
    ].join('\n')

    const blob = new Blob([`\uFEFF${conteudo}`], {
      type: 'text/csv;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = nomeArquivo
    link.click()

    URL.revokeObjectURL(url)
  }

  function exportarProdutosMaisVendidos() {
    const dados = produtosMaisVendidos().map(item => ({
      Produto: item.nome,
      Quantidade: formatarNumero(item.quantidade)
    }))

    baixarCSV('produtos-mais-vendidos.csv', dados)
  }

  function exportarClientesMaisCompraram() {
    const dados = clientesMaisCompraram().map(item => ({
      Cliente: item.nome,
      Valor: formatarMoeda(item.valor)
    }))

    baixarCSV('clientes-que-mais-compraram.csv', dados)
  }

  function exportarFaturamentoPorMes() {
    const dados = mesesRelatorio().map(item => ({
      Mes: formatarMesAno(item.mes),
      Faturamento: formatarMoeda(item.valor)
    }))

    baixarCSV('faturamento-por-mes.csv', dados)
  }

  function exportarLucroPorProduto() {
    const dados = lucroPorProduto().map(item => ({
      Produto: item.nome,
      Quantidade: formatarNumero(item.quantidade),
      Faturamento: formatarMoeda(item.faturamento),
      Custo: formatarMoeda(item.custo),
      Lucro: formatarMoeda(item.lucro),
      Margem: formatarPercentual(item.margem)
    }))

    baixarCSV('lucro-por-produto.csv', dados)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Relatórios
          </h1>

          <p className="text-gray-500">
            Análise de vendas, clientes, produtos e resultado financeiro da Eternaê.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Filtros
          </h2>

          <div className="grid grid-cols-4 gap-4">

            <select
              value={tipoConsulta}
              onChange={(e) => setTipoConsulta(e.target.value)}
              className="border rounded-xl px-4 py-3"
            >
              <option value="MesEspecifico">Mês específico</option>
              <option value="PeriodoPersonalizado">Período personalizado</option>
              <option value="Todos">Todos</option>
            </select>

            {tipoConsulta === 'MesEspecifico' && (
              <>
                <select
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                >
                  <option value="1">Janeiro</option>
                  <option value="2">Fevereiro</option>
                  <option value="3">Março</option>
                  <option value="4">Abril</option>
                  <option value="5">Maio</option>
                  <option value="6">Junho</option>
                  <option value="7">Julho</option>
                  <option value="8">Agosto</option>
                  <option value="9">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>

                <input
                  type="number"
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                  placeholder="Ano"
                />
              </>
            )}

            {tipoConsulta === 'PeriodoPersonalizado' && (
              <>
                <input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                />

                <input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="border rounded-xl px-4 py-3"
                />
              </>
            )}

          </div>

        </div>

        <div className="grid grid-cols-5 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Faturamento recebido</p>
            <h2 className="text-2xl font-bold text-green-700 mt-2">
              {formatarMoeda(faturamentoRecebido())}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Saídas</p>
            <h2 className="text-2xl font-bold text-red-600 mt-2">
              {formatarMoeda(totalSaidas())}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Resultado</p>
            <h2 className={`text-2xl font-bold mt-2 ${
              resultado() >= 0 ? 'text-green-700' : 'text-red-600'
            }`}>
              {formatarMoeda(resultado())}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Pedidos</p>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {pedidosTotal()}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Ticket médio</p>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {formatarMoeda(ticketMedio())}
            </h2>
          </div>

        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">

          <button
            onClick={() => setModalAberto('produtos')}
            className="bg-white rounded-2xl p-6 shadow-sm text-left hover:bg-gray-50 transition"
          >
            <p className="text-gray-500">Relatório</p>
            <h2 className="text-xl font-bold text-gray-800 mt-2">
              Produtos mais vendidos
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Veja os itens com maior quantidade vendida no período.
            </p>
          </button>

          <button
            onClick={() => setModalAberto('clientes')}
            className="bg-white rounded-2xl p-6 shadow-sm text-left hover:bg-gray-50 transition"
          >
            <p className="text-gray-500">Relatório</p>
            <h2 className="text-xl font-bold text-gray-800 mt-2">
              Clientes que mais compraram
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Veja os clientes com maior valor recebido no período.
            </p>
          </button>

          <button
            onClick={() => setModalAberto('meses')}
            className="bg-white rounded-2xl p-6 shadow-sm text-left hover:bg-gray-50 transition"
          >
            <p className="text-gray-500">Relatório</p>
            <h2 className="text-xl font-bold text-gray-800 mt-2">
              Faturamento por mês
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Acompanhe a evolução mensal do faturamento.
            </p>
          </button>

          <button
            onClick={() => setModalAberto('lucro')}
            className="bg-white rounded-2xl p-6 shadow-sm text-left hover:bg-gray-50 transition"
          >
            <p className="text-gray-500">Relatório</p>
            <h2 className="text-xl font-bold text-gray-800 mt-2">
              Lucro por produto
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Veja faturamento, custo, lucro e margem por produto.
            </p>
          </button>

        </div>

        <RelatorioDetalheModal
          open={modalAberto === 'produtos'}
          onClose={() => setModalAberto(null)}
          titulo="Produtos mais vendidos"
          descricao="Itens com maior quantidade vendida no período selecionado."
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={exportarProdutosMaisVendidos}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          {produtosMaisVendidos().length === 0 ? (
            <p className="text-gray-500">
              Nenhum produto vendido neste período.
            </p>
          ) : (
            <div className="space-y-3">
              {produtosMaisVendidos().map((produto, index) => (
                <div
                  key={produto.nome}
                  className="flex justify-between border-b pb-3"
                >
                  <span className="text-gray-700">
                    {index + 1}. {produto.nome}
                  </span>

                  <strong>
                    {formatarNumero(produto.quantidade)} un.
                  </strong>
                </div>
              ))}
            </div>
          )}
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'clientes'}
          onClose={() => setModalAberto(null)}
          titulo="Clientes que mais compraram"
          descricao="Clientes com maior valor recebido no período selecionado."
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={exportarClientesMaisCompraram}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          {clientesMaisCompraram().length === 0 ? (
            <p className="text-gray-500">
              Nenhum cliente com compra recebida neste período.
            </p>
          ) : (
            <div className="space-y-3">
              {clientesMaisCompraram().map((cliente, index) => (
                <div
                  key={cliente.nome}
                  className="flex justify-between border-b pb-3"
                >
                  <span className="text-gray-700">
                    {index + 1}. {cliente.nome}
                  </span>

                  <strong>
                    {formatarMoeda(cliente.valor)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'meses'}
          onClose={() => setModalAberto(null)}
          titulo="Faturamento por mês"
          descricao="Evolução mensal do faturamento recebido."
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={exportarFaturamentoPorMes}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          {mesesRelatorio().length === 0 ? (
            <p className="text-gray-500">
              Nenhum faturamento recebido neste período.
            </p>
          ) : (
            <div className="space-y-3">
              {mesesRelatorio().map(item => (
                <div
                  key={item.mes}
                  className="flex justify-between border-b pb-3"
                >
                  <span className="text-gray-700">
                    {formatarMesAno(item.mes)}
                  </span>

                  <strong className="text-green-700">
                    {formatarMoeda(item.valor)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </RelatorioDetalheModal>

        <RelatorioDetalheModal
          open={modalAberto === 'lucro'}
          onClose={() => setModalAberto(null)}
          titulo="Lucro por produto"
          descricao="Faturamento, custo real dos insumos, lucro e margem por produto no período selecionado."
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={exportarLucroPorProduto}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
            >
              Exportar CSV
            </button>
          </div>

          {lucroPorProduto().length === 0 ? (
            <p className="text-gray-500">
              Nenhum produto vendido neste período.
            </p>
          ) : (
            <div className="overflow-x-auto border rounded-2xl">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 text-gray-600">Produto</th>
                    <th className="text-left p-4 text-gray-600">Qtd</th>
                    <th className="text-left p-4 text-gray-600">Faturamento</th>
                    <th className="text-left p-4 text-gray-600">Custo</th>
                    <th className="text-left p-4 text-gray-600">Lucro</th>
                    <th className="text-left p-4 text-gray-600">Margem</th>
                  </tr>
                </thead>

                <tbody>
                  {lucroPorProduto().map(item => (
                    <tr key={item.nome} className="border-t">
                      <td className="p-4">
                        {item.nome}
                      </td>

                      <td className="p-4">
                        {formatarNumero(item.quantidade)}
                      </td>

                      <td className="p-4">
                        {formatarMoeda(item.faturamento)}
                      </td>

                      <td className="p-4">
                        {formatarMoeda(item.custo)}
                      </td>

                      <td className={`p-4 font-semibold ${
                        item.lucro >= 0 ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {formatarMoeda(item.lucro)}
                      </td>

                      <td className="p-4">
                        {formatarPercentual(item.margem)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </RelatorioDetalheModal>

      </main>
    </div>
  )
}