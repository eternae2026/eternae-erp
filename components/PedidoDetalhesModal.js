export default function PedidoDetalhesModal({
  open,
  onClose,
  pedido,
  onAvancar,
  onCancelar
}) {
  if (!open || !pedido) return null

  const etapasCancelaveis = [
  'Aguardando Pagamento',
  'Arte',
  'Aguardando Aprovação'
]

const podeCancelarPedido =
  etapasCancelaveis.includes(
    pedido.etapa_producao || 'Aguardando Pagamento'
  )

  const itens = pedido.orcamentos?.orcamento_itens || []

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '-'

    return new Date(data).toLocaleDateString('pt-BR')
  }

  function statusPagamento() {
    if (!pedido.financeiro) return 'Sem cobrança'

    if (Array.isArray(pedido.financeiro)) {
      if (pedido.financeiro.length === 0) return 'Sem cobrança'

      return pedido.financeiro[0].status
    }

    return pedido.financeiro.status
  }

  function formaPagamento() {
    if (!pedido.financeiro) {
      return pedido.forma_pagamento || '-'
    }

    if (Array.isArray(pedido.financeiro)) {
      if (pedido.financeiro.length === 0) {
        return pedido.forma_pagamento || '-'
      }

      return (
        pedido.financeiro[0].forma_pagamento ||
        pedido.forma_pagamento ||
        '-'
      )
    }

    return (
      pedido.financeiro.forma_pagamento ||
      pedido.forma_pagamento ||
      '-'
    )
  }

  function nomeItem(item) {
  return (
    item.nome_item ||
    item.produtos?.nome ||
    item.kits?.nome ||
    item.estoque?.nome ||
    'Item'
  )
}

  function tipoItem(item) {
  if (item.tipo_item === 'kit') {
    return '🎁 Kit'
  }

  if (item.tipo_item === 'acessorio') {
    return '🎀 Acessório'
  }

  if (item.tipo_item === 'embalagem') {
    return '📦 Embalagem'
  }

  return '☕ Produto'
}

  const valorPedido = Number(pedido.valor || 0)
const valorReferencia = Number(
  pedido.valor_referencia || valorPedido
)
const descontoPixValor = Number(
  pedido.desconto_pix_valor || 0
)
const descontoPixPercentual = Number(
  pedido.desconto_pix_percentual || 0
)

const pagamento = formaPagamento()
const statusFinanceiro = statusPagamento()

function analisarPrazoProducao() {
  if (!pedido.data_prevista_entrega) {
    return {
      tipo: 'sem-prazo',
      texto: 'Prazo não informado',
      classe: 'bg-gray-100 text-gray-700'
    }
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const dataPrevista = new Date(
    `${pedido.data_prevista_entrega}T00:00:00`
  )

  let inicio
  let fim
  let atrasado = false

  if (hoje > dataPrevista) {
    inicio = new Date(dataPrevista)
    fim = new Date(hoje)
    atrasado = true
  } else {
    inicio = new Date(hoje)
    fim = new Date(dataPrevista)
  }

  let diasUteis = 0
  const cursor = new Date(inicio)

  while (cursor < fim) {
    cursor.setDate(cursor.getDate() + 1)

    const diaSemana = cursor.getDay()

    if (diaSemana !== 0 && diaSemana !== 6) {
      diasUteis++
    }
  }

  if (atrasado) {
    return {
      tipo: 'atrasado',
      texto: `🔴 Atrasado há ${diasUteis} dias úteis`,
      classe: 'bg-red-100 text-red-700'
    }
  }

  if (diasUteis === 0) {
    return {
      tipo: 'vence-hoje',
      texto: '🟠 Prazo termina hoje',
      classe: 'bg-orange-100 text-orange-700'
    }
  }

  if (diasUteis <= 2) {
    return {
      tipo: 'atencao',
      texto: `🟡 Faltam ${diasUteis} dias úteis`,
      classe: 'bg-yellow-100 text-yellow-700'
    }
  }

  return {
    tipo: 'no-prazo',
    texto: `🟢 Faltam ${diasUteis} dias úteis`,
    classe: 'bg-green-100 text-green-700'
  }
}

const situacaoPrazoProducao = analisarPrazoProducao()

const timeline = [...(pedido.pedido_timeline || [])].sort(
  (a, b) => new Date(a.created_at) - new Date(b.created_at)
)

const etapasStepper = [
  'Aguardando Pagamento',
  'Arte',
  'Aguardando Aprovação',
  'Produção',
  'Pronto',
  'Entregue'
]

const etapaAtual = pedido.etapa_producao || 'Aguardando Pagamento'

const indiceEtapaAtual =
  etapaAtual === 'Cancelado'
    ? -1
    : etapasStepper.indexOf(etapaAtual)

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Detalhes do Pedido
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Pedido #{pedido.id.slice(0, 8)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
{pedido.etapa_producao !== 'Cancelado' && (
  
  <div className="border rounded-2xl p-5 mb-6">
    <h3 className="font-bold text-gray-800 mb-5">
      Progresso do pedido
    </h3>

    <div className="grid grid-cols-6 gap-2">
      {etapasStepper.map((etapa, index) => {
        const concluida = index < indiceEtapaAtual
        const atual = index === indiceEtapaAtual

        return (
          <div
            key={etapa}
            className="flex flex-col items-center text-center"
          >
            <div className="flex items-center w-full">

              {index > 0 && (
                <div
                  className={`h-1 flex-1 ${
                    index <= indiceEtapaAtual
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  concluida
                    ? 'bg-green-500 text-white'
                    : atual
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {concluida ? '✓' : index + 1}
              </div>

              {index < etapasStepper.length - 1 && (
                <div
                  className={`h-1 flex-1 ${
                    index < indiceEtapaAtual
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}

            </div>

            <p
              className={`text-xs mt-2 leading-tight ${
                atual
                  ? 'font-bold text-gray-900'
                  : concluida
                    ? 'text-green-700'
                    : 'text-gray-400'
              }`}
            >
              {etapa === 'Aguardando Pagamento'
                ? 'Pagamento'
                : etapa === 'Aguardando Aprovação'
                  ? 'Aprovação'
                  : etapa}
            </p>
          </div>
        )
      })}
    </div>
  </div>
  )}

  <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Cliente
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {pedido.clientes?.nome || '-'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Data do pedido
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {formatarData(pedido.created_at)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
  <p className="text-sm text-gray-500">
    Valor final do pedido
  </p>

  <p className="font-semibold text-gray-800 mt-1">
    {formatarMoeda(valorPedido)}
  </p>

  {pagamento === 'PIX' && descontoPixValor > 0 && (
    <p className="text-xs text-green-700 mt-2">
      Desconto PIX de {descontoPixPercentual.toFixed(2)}%:
      {' '}
      {formatarMoeda(descontoPixValor)}
    </p>
  )}
</div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Forma de pagamento
              </p>

              <p
                className={`font-semibold mt-1 ${
                  pagamento === 'PIX'
                    ? 'text-green-700'
                    : pagamento === 'Cartão'
                      ? 'text-blue-700'
                      : 'text-gray-800'
                }`}
              >
                {pagamento === 'PIX'
                  ? '🟢 PIX'
                  : pagamento === 'Cartão'
                    ? '💳 Cartão'
                    : pagamento}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Etapa atual
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {pedido.etapa_producao || 'Aguardando Pagamento'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
  <p className="text-sm text-gray-500">
    Situação financeira
  </p>

  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
      statusFinanceiro === 'Recebido'
        ? 'bg-green-100 text-green-700'
        : statusFinanceiro === 'Pendente'
          ? 'bg-yellow-100 text-yellow-700'
          : statusFinanceiro === 'Cancelado'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
    }`}
  >
    {statusFinanceiro === 'Recebido'
      ? '🟢 Recebido'
      : statusFinanceiro === 'Pendente'
        ? '🟡 Pendente'
        : statusFinanceiro === 'Cancelado'
          ? '🔴 Cancelado'
          : statusFinanceiro}
  </span>
</div>
          </div>

{pedido.etapa_producao === 'Cancelado' && (
  <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
    <h3 className="font-bold text-red-800 text-lg mb-4">
      ❌ Pedido cancelado
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl p-4">
        <p className="text-sm text-gray-500">
          Motivo do cancelamento
        </p>

        <p className="font-semibold text-gray-800 mt-2">
          {pedido.motivo_cancelamento || '-'}
        </p>
      </div>

      <div className="bg-white rounded-xl p-4">
        <p className="text-sm text-gray-500">
          Data do cancelamento
        </p>

        <p className="font-semibold text-gray-800 mt-2">
          {pedido.data_cancelamento
            ? new Date(
                pedido.data_cancelamento
              ).toLocaleString('pt-BR')
            : '-'}
        </p>
      </div>
    </div>
  </div>
)}

{pedido.etapa_producao === 'Produção' && (
  <div className="border rounded-2xl p-5 mb-6 bg-purple-50">
    <h3 className="font-bold text-gray-800 mb-4">
      📦 Controle da Produção
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <div className="bg-white rounded-xl p-4">
        <p className="text-sm text-gray-500">
          Início da produção
        </p>

        <p className="font-semibold text-gray-800 mt-2">
          {pedido.data_inicio_producao
            ? new Date(
                pedido.data_inicio_producao
              ).toLocaleDateString('pt-BR')
            : '-'}
        </p>
      </div>

      <div className="bg-white rounded-xl p-4">
        <p className="text-sm text-gray-500">
          Prazo informado
        </p>

        <p className="font-semibold text-gray-800 mt-2">
          {pedido.prazo_producao_dias
            ? `${pedido.prazo_producao_dias} dias úteis`
            : '-'}
        </p>
      </div>

      <div className="bg-white rounded-xl p-4">
        <p className="text-sm text-gray-500">
          Data prevista
        </p>

        <p className="font-semibold text-gray-800 mt-2">
          {pedido.data_prevista_entrega
  ? new Date(
      `${pedido.data_prevista_entrega}T00:00:00`
    ).toLocaleDateString('pt-BR')
  : '-'}
        </p>
        {pedido.data_prevista_entrega && (
  <span
    className={`inline-flex mt-3 px-3 py-1 rounded-full text-xs font-medium ${situacaoPrazoProducao.classe}`}
  >
    {situacaoPrazoProducao.texto}
  </span>
)}
      </div>

    </div>
  </div>
)}

          <div className="border rounded-2xl p-5">
            <h3 className="font-bold text-gray-800 mb-4">
              Itens do pedido
            </h3>

            {itens.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Nenhum item encontrado para este pedido.
              </p>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {nomeItem(item)}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {tipoItem(item)}
                      </p>

                      <p className="text-sm text-gray-500 mt-2">
                        {item.quantidade} x{' '}
                        {formatarMoeda(item.valor_unitario)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Subtotal
                      </p>

                      <p className="font-semibold text-gray-800 mt-1">
                        {formatarMoeda(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-5">
              <div className="bg-gray-900 text-white px-5 py-3 rounded-xl">
                <p className="text-xs text-gray-300">
                  Valor final do pedido
                </p>

                <p className="font-bold text-lg">
                  {formatarMoeda(valorPedido)}
                </p>
              </div>
            </div>
          </div>

<div className="border rounded-2xl p-5 mt-5">
  <h3 className="font-bold text-gray-800 mb-4">
    Timeline do pedido
  </h3>

  {timeline.length === 0 ? (
    <p className="text-sm text-gray-500">
      Nenhum evento registrado ainda.
    </p>
  ) : (
    <div className="space-y-4">
      {timeline.map((evento, index) => (
        <div
          key={evento.id || index}
          className="flex gap-3"
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full mt-1 ${
                evento.tipo === 'sucesso'
                  ? 'bg-green-500'
                  : evento.tipo === 'alerta'
                    ? 'bg-yellow-500'
                    : evento.tipo === 'erro'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
              }`}
            />

            {index < timeline.length - 1 && (
              <div className="w-px flex-1 bg-gray-200 mt-1" />
            )}
          </div>

          <div className="pb-2">
            <p className="font-semibold text-gray-800">
              {evento.titulo}
            </p>

            {evento.descricao && (
              <p className="text-sm text-gray-500 mt-1">
                {evento.descricao}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-1">
              {new Date(evento.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

{pedido.etapa_producao === 'Entregue' && (
  <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-5">
    <h3 className="font-bold text-green-800 mb-2">
      🎉 Pedido finalizado
    </h3>

    <p className="text-green-700 text-sm">
      Este pedido foi entregue ao cliente com sucesso.
    </p>
  </div>
)}

          {pedido.orcamentos?.observacoes && (
            <div className="border rounded-2xl p-5 mt-5">
              <h3 className="font-bold text-gray-800 mb-2">
                Observações
              </h3>

              <p className="text-sm text-gray-600 whitespace-pre-line">
                {pedido.orcamentos.observacoes}
              </p>
            </div>
          )}
        </div>

        {pedido.etapa_producao !== 'Entregue' &&
          pedido.etapa_producao !== 'Cancelado' && (

          <div className="mt-6 border rounded-2xl p-5">
  <h3 className="font-bold text-gray-800 mb-2">
    Próxima ação
  </h3>

  <p className="text-sm text-gray-500 mb-4">
    Informe ao sistema qual foi a última ação realizada.
  </p>

  {pedido.etapa_producao === 'Aguardando Pagamento' && (
  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
    <p className="font-semibold text-yellow-800">
      ⏳ Aguardando pagamento
    </p>

    <p className="text-sm text-yellow-700 mt-1">
      Confirme o recebimento no Financeiro. Depois disso, o pedido será
      encaminhado automaticamente para a etapa de Arte.
    </p>
  </div>
)}

  {pedido.etapa_producao === 'Arte' && (
    <button
  type="button"
  onClick={onAvancar}
  className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
>
  🎨 Marcar arte como enviada
</button>
  )}

  {pedido.etapa_producao === 'Aguardando Aprovação' && (
    <button
  type="button"
  onClick={onAvancar}
  className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition"
>
  ✅ Confirmar aprovação da arte
</button>
  )}

  {pedido.etapa_producao === 'Produção' && (
    <button
  type="button"
  onClick={onAvancar}
  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition"
>
  📦 Concluir produção
</button>
  )}

  {pedido.etapa_producao === 'Pronto' && (
    <button
  type="button"
  onClick={onAvancar}
  className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition"
>
  🚚 Confirmar entrega
</button>
  )}
      </div>

    )}

        <div className="border-t px-6 py-4 flex items-center justify-between gap-3">
  <div>
    {podeCancelarPedido && (
      <button
        type="button"
        onClick={onCancelar}
        className="bg-red-50 text-red-700 border border-red-100 px-5 py-3 rounded-xl hover:bg-red-100 transition"
      >
        Cancelar pedido
      </button>
    )}
  </div>

  <button
    type="button"
    onClick={onClose}
    className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition"
  >
    Fechar
  </button>
</div>
      </aside>
    </div>
  )
}