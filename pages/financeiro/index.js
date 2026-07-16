import { useEffect, useState } from 'react'
import DREModal from '../../components/DREModal'
import FluxoCaixaModal from '../../components/FluxoCaixaModal'
import ReceberPagamentoModal from '../../components/ReceberPagamentoModal'
import RecebimentosPendentesModal from '../../components/RecebimentosPendentesModal'
import SaidaFinanceiraModal from '../../components/SaidaFinanceiraModal'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState([])
const [movimentacoes, setMovimentacoes] = useState([])

  const [openModal, setOpenModal] = useState(false)
  const [openSaidaModal, setOpenSaidaModal] = useState(false)
  const [openDREModal, setOpenDREModal] = useState(false)
  const [openFluxoModal, setOpenFluxoModal] = useState(false)
  const [openRecebimentosModal, setOpenRecebimentosModal] = useState(false)

  const [lancamentoSelecionado, setLancamentoSelecionado] = useState(null)

  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState('MesAtual')

  async function carregarFinanceiro() {
    const { data, error } = await supabase
      .from('financeiro')
      .select(`
        *,
        clientes (
          nome
        ),
        pedidos (
          id
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar financeiro:', error)
      return
    }

    setLancamentos(data || [])
  }

  async function carregarMovimentacoes() {
  const { data, error } = await supabase
    .from('movimentacoes_financeiras')
    .select('*')
    .order('data_movimento', { ascending: false })

  if (error) {
    console.log(
      'Erro ao carregar movimentações:',
      error
    )
    return
  }

  setMovimentacoes(data || [])
}

  useEffect(() => {
  carregarFinanceiro()
  carregarMovimentacoes()
}, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function ehMesAtual(data) {
    if (!data) return false

    const hoje = new Date()
    const dataBase = new Date(data)

    return (
      dataBase.getMonth() === hoje.getMonth() &&
      dataBase.getFullYear() === hoje.getFullYear()
    )
  }

  function ehMesAnterior(data) {
    if (!data) return false

    const hoje = new Date()
    const mesAnterior = new Date(
      hoje.getFullYear(),
      hoje.getMonth() - 1,
      1
    )

    const dataBase = new Date(data)

    return (
      dataBase.getMonth() === mesAnterior.getMonth() &&
      dataBase.getFullYear() === mesAnterior.getFullYear()
    )
  }

  function ultimos30Dias(data) {
    if (!data) return false

    const hoje = new Date()
    const dataBase = new Date(data)

    const diferenca = (hoje - dataBase) / (1000 * 60 * 60 * 24)

    return diferenca <= 30
  }

  async function confirmarRecebimento(dados) {
  if (!lancamentoSelecionado) return

  const pedidoId = lancamentoSelecionado.pedido_id

  const { data, error } = await supabase
    .from('financeiro')
    .update(dados)
    .eq('id', lancamentoSelecionado.id)
    .select(`
      *,
      clientes (
        nome
      ),
      pedidos (
        id
      )
    `)

  if (error) {
    console.log('Erro ao receber pagamento:', error)
    alert('Erro ao receber pagamento.')
    return
  }

  const lancamentoAtualizado = data?.[0]

  if (pedidoId) {
    const { error: erroPedido } = await supabase
      .from('pedidos')
      .update({
        etapa_producao: 'Arte'
      })
      .eq('id', pedidoId)

    if (erroPedido) {
      console.log(
        'Erro ao avançar pedido para Arte:',
        erroPedido
      )

      alert(
        'Pagamento recebido, mas houve erro ao encaminhar o pedido para Arte.'
      )

      return
    }

    const { error: erroTimeline } = await supabase
      .from('pedido_timeline')
      .insert([
        {
          pedido_id: pedidoId,
          titulo: 'Pagamento confirmado',
          descricao:
            'Recebimento confirmado. O pedido foi encaminhado automaticamente para a etapa de Arte.',
          tipo: 'sucesso'
        }
      ])

    if (erroTimeline) {
      console.log(
        'Erro ao registrar pagamento na timeline:',
        erroTimeline
      )

      alert(
        'Pagamento recebido e pedido encaminhado para Arte, mas houve erro ao registrar o evento na timeline.'
      )

      return
    }

    const { error: erroMovimentacao } = await supabase
      .from('movimentacoes_financeiras')
      .insert([
        {
          tipo: 'Entrada',
          categoria: 'Venda',
          descricao: `Venda para ${
            lancamentoAtualizado?.clientes?.nome ||
            lancamentoSelecionado.clientes?.nome ||
            'Cliente'
          }`,
          valor: Number(
            lancamentoSelecionado.valor || 0
          ),
          forma_pagamento:
            dados.forma_pagamento ||
            lancamentoSelecionado.forma_pagamento ||
            null,
          data_movimento:
            dados.data_pagamento ||
            new Date().toISOString().slice(0, 10),
          pedido_id: pedidoId,
          observacoes: dados.observacoes || null
        }
      ])

    if (erroMovimentacao) {
      console.log(
        'Erro ao registrar movimentação financeira:',
        erroMovimentacao
      )

      alert(
        'O pagamento foi confirmado, mas houve erro ao registrar a entrada no fluxo de caixa.'
      )

      return
    }
  }

  setLancamentos(
    lancamentos.map(item =>
      item.id === lancamentoSelecionado.id
        ? lancamentoAtualizado
        : item
    )
  )

  setOpenModal(false)
  setLancamentoSelecionado(null)

  alert(
    'Pagamento confirmado, pedido encaminhado para Arte e entrada registrada no fluxo de caixa!'
  )
}

  async function salvarSaida(dados) {
  const { error } = await supabase
    .from('movimentacoes_financeiras')
    .insert([
      {
        tipo: 'Saída',
        categoria: dados.categoria || 'Outros',
        descricao: dados.descricao,
        valor: Number(dados.valor || 0),
        forma_pagamento:
          dados.forma_pagamento || null,
        data_movimento:
          dados.data_saida ||
          new Date().toISOString().slice(0, 10),
        observacoes: dados.observacoes || null
      }
    ])

  if (error) {
    console.log(
      'Erro ao salvar saída financeira:',
      error
    )

    alert('Erro ao salvar saída financeira.')
    return false
  }

  await carregarMovimentacoes()
  setOpenSaidaModal(false)

  return true
}

  const movimentos = movimentacoes
  .map(item => ({
    id: item.id,
    tipo: item.tipo,
    data: item.data_movimento || item.created_at,
    descricao: item.descricao || '-',
    detalhe: item.categoria || '-',
    valor: Number(item.valor || 0),
    status:
      item.tipo === 'Entrada'
        ? 'Recebido'
        : 'Pago',
    forma: item.forma_pagamento || '-',
    origem: item
  }))
  .sort((a, b) => new Date(b.data) - new Date(a.data))

  const movimentosFiltrados = movimentos.filter(item => {
    let periodoValido = true

    if (filtroPeriodo === 'MesAtual') {
      periodoValido = ehMesAtual(item.data)
    }

    if (filtroPeriodo === 'MesAnterior') {
      periodoValido = ehMesAnterior(item.data)
    }

    if (filtroPeriodo === 'Ultimos30') {
      periodoValido = ultimos30Dias(item.data)
    }

    if (filtroPeriodo === 'Todos') {
      periodoValido = true
    }

    let statusValido = true

    if (filtroStatus !== 'Todos') {
      statusValido = item.status === filtroStatus
    }

    return periodoValido && statusValido
  })

  const entradasFiltradas = movimentosFiltrados
    .filter(item => item.tipo === 'Entrada' && item.status === 'Recebido')
    .reduce((total, item) => total + Number(item.valor || 0), 0)

  const saidasFiltradas = movimentosFiltrados
    .filter(item => item.tipo === 'Saída')
    .reduce((total, item) => total + Number(item.valor || 0), 0)

  const saldoFiltrado = entradasFiltradas - saidasFiltradas

  const pendentes = lancamentos.filter(item => item.status === 'Pendente')

  const aReceberTotal = pendentes.reduce((total, item) => {
    return total + Number(item.valor || 0)
  }, 0)

  const recebidoTotal = movimentacoes
  .filter(item => item.tipo === 'Entrada')
  .reduce(
    (total, item) =>
      total + Number(item.valor || 0),
    0
  )

const saidasTotal = movimentacoes
  .filter(item => item.tipo === 'Saída')
  .reduce(
    (total, item) =>
      total + Number(item.valor || 0),
    0
  )

  const saldoAcumulado =
  recebidoTotal - saidasTotal

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Financeiro
            </h1>

            <p className="text-gray-500">
              Controle de entradas, saídas e saldo financeiro da Eternaê.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setOpenSaidaModal(true)}
              className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition"
            >
              + Nova Saída
            </button>

            <button
              onClick={() => setOpenRecebimentosModal(true)}
              className="bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition"
            >
              💵 Recebimentos
            </button>

            <button
              onClick={() => setOpenFluxoModal(true)}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition"
            >
              📋 Fluxo de Caixa
            </button>

            <button
              onClick={() => setOpenDREModal(true)}
              className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
            >
              📊 DRE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">A receber</p>

            <h2 className="text-2xl font-bold text-yellow-600 mt-2">
              {formatarMoeda(aReceberTotal)}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {pendentes.length} cobrança(s) pendente(s)
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Receitas do período</p>

            <h2 className="text-2xl font-bold text-green-600 mt-2">
              {formatarMoeda(entradasFiltradas)}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
  Entradas recebidas no período filtrado
</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">Despesas do período</p>

            <h2 className="text-2xl font-bold text-red-600 mt-2">
              {formatarMoeda(saidasFiltradas)}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
  Saídas registradas no período filtrado
</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
  <p className="text-gray-500">
    Resultado do período
  </p>

  <h2 className={`text-2xl font-bold mt-2 ${
    saldoFiltrado >= 0
      ? 'text-green-700'
      : 'text-red-600'
  }`}>
    {formatarMoeda(saldoFiltrado)}
  </h2>

  <p className="text-sm text-gray-500 mt-2">
    Receitas - despesas do período
  </p>
</div>

        </div>

        <div className="grid grid-cols-1 mb-8">
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <p className="text-gray-500">
      Saldo acumulado
    </p>

    <h2 className={`text-2xl font-bold mt-2 ${
      saldoAcumulado >= 0
        ? 'text-green-700'
        : 'text-red-600'
    }`}>
      {formatarMoeda(saldoAcumulado)}
    </h2>

    <p className="text-sm text-gray-500 mt-2">
      Total de entradas menos o total de saídas
    </p>
  </div>
</div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex gap-4">
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="border rounded-xl px-4 py-2"
          >
            <option value="MesAtual">Mês atual</option>
            <option value="MesAnterior">Mês anterior</option>
            <option value="Ultimos30">Últimos 30 dias</option>
            <option value="Todos">Todos</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border rounded-xl px-4 py-2"
          >
            <option value="Todos">Todos</option>
            <option value="Recebido">Recebido</option>
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
          </select>
        </div>

        <ReceberPagamentoModal
          open={openModal}
          onClose={() => {
            setOpenModal(false)
            setLancamentoSelecionado(null)
          }}
          onConfirmar={confirmarRecebimento}
          lancamento={lancamentoSelecionado}
        />

        <RecebimentosPendentesModal
          open={openRecebimentosModal}
          onClose={() => setOpenRecebimentosModal(false)}
          lancamentos={lancamentos}
          onReceber={(lancamento) => {
            setLancamentoSelecionado(lancamento)
            setOpenRecebimentosModal(false)
            setOpenModal(true)
          }}
        />

        <SaidaFinanceiraModal
          open={openSaidaModal}
          onClose={() => setOpenSaidaModal(false)}
          onSalvar={salvarSaida}
        />

        <FluxoCaixaModal
          open={openFluxoModal}
          onClose={() => setOpenFluxoModal(false)}
          movimentos={movimentosFiltrados}
        />

        <DREModal
          open={openDREModal}
          onClose={() => setOpenDREModal(false)}
          receitas={entradasFiltradas}
          despesas={saidasFiltradas}
          periodo={
            filtroPeriodo === 'MesAtual'
              ? 'Mês atual'
              : filtroPeriodo === 'MesAnterior'
                ? 'Mês anterior'
                : filtroPeriodo === 'Ultimos30'
                  ? 'Últimos 30 dias'
                  : 'Todos'
          }
        />

      </main>
    </div>
  )
}