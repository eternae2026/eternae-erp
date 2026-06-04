import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Kits() {
  const [kits, setKits] = useState([])
  const [produtos, setProdutos] = useState([])
  const [kitSelecionado, setKitSelecionado] = useState(null)
  const [kitEditando, setKitEditando] = useState(null)
  const [itensKit, setItensKit] = useState([])

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [descontoPercentual, setDescontoPercentual] = useState('0')

  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')

  async function carregarKits() {
    const { data, error } = await supabase
      .from('kits')
      .select(`
        *,
        kit_itens (
          id,
          quantidade,
          produtos (
            id,
            nome,
            preco,
            preco_final,
            margem_lucro
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Erro ao carregar kits:', error)
      return
    }

    setKits(data || [])
  }

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .gt('preco', 0)
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar produtos:', error)
      return
    }

    setProdutos(data || [])
  }

  async function carregarItensKit(kitId) {
    const { data, error } = await supabase
      .from('kit_itens')
      .select(`
        *,
        produtos (
          id,
          nome,
          preco,
          preco_final,
          margem_lucro
        )
      `)
      .eq('kit_id', kitId)

    if (error) {
      console.log('Erro ao carregar itens do kit:', error)
      return []
    }

    setItensKit(data || [])
    return data || []
  }

  useEffect(() => {
    carregarKits()
    carregarProdutos()
  }, [])

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

  function precoProduto(produto) {
    return Number(produto?.preco_final || produto?.preco || 0)
  }

  function margemProduto(produto) {
    return Number(produto?.margem_lucro || 0) / 100
  }

  function custoEstimadoProduto(produto) {
    const preco = precoProduto(produto)
    const margem = margemProduto(produto)

    return preco * (1 - margem)
  }

  function calcularSubtotal(itens) {
    return itens.reduce((total, item) => {
      return total + precoProduto(item.produtos) * Number(item.quantidade || 0)
    }, 0)
  }

  function calcularCusto(itens) {
    return itens.reduce((total, item) => {
      return total + custoEstimadoProduto(item.produtos) * Number(item.quantidade || 0)
    }, 0)
  }

  function calcularMetricas(kit, itens) {
    const valorIndividual = calcularSubtotal(itens)
    const descontoPercentual = Number(kit?.desconto_percentual || 0)
    const valorDesconto = valorIndividual * (descontoPercentual / 100)
    const precoFinal = valorIndividual - valorDesconto
    const custoEstimado = calcularCusto(itens)
    const lucroEstimado = precoFinal - custoEstimado
    const margemEstimada = precoFinal > 0 ? (lucroEstimado / precoFinal) * 100 : 0

    let statusMargem = 'Crítica'

    if (margemEstimada >= 50) {
      statusMargem = 'Saudável'
    } else if (margemEstimada >= 35) {
      statusMargem = 'Reduzida'
    }

    return {
      valor_individual: valorIndividual,
      valor_desconto: valorDesconto,
      preco_final: precoFinal,
      lucro_estimado: lucroEstimado,
      margem_estimada: margemEstimada,
      status_margem: statusMargem
    }
  }

  async function atualizarMetricasKit(kit, itens) {
    const metricas = calcularMetricas(kit, itens)

    const { data, error } = await supabase
      .from('kits')
      .update(metricas)
      .eq('id', kit.id)
      .select()
      .single()

    if (error) {
      console.log('Erro ao atualizar métricas do kit:', error)
      return null
    }

    return data
  }

  async function salvarKit() {
    if (!nome) {
      alert('Informe o nome do kit.')
      return
    }

    if (kitEditando) {
      const { data, error } = await supabase
        .from('kits')
        .update({
          nome,
          descricao,
          desconto_percentual: Number(descontoPercentual || 0)
        })
        .eq('id', kitEditando.id)
        .select()
        .single()

      if (error) {
        console.log('Erro ao editar kit:', error)
        alert('Erro ao editar kit.')
        return
      }

      const itens = await carregarItensKit(data.id)
      await atualizarMetricasKit(data, itens)

      await carregarKits()

      if (kitSelecionado?.id === data.id) {
        setKitSelecionado(data)
      }

      setKitEditando(null)
      setNome('')
      setDescricao('')
      setDescontoPercentual('0')

      alert('Kit atualizado!')
      return
    }

    const { data, error } = await supabase
      .from('kits')
      .insert([
        {
          nome,
          descricao,
          desconto_percentual: Number(descontoPercentual || 0),
          ativo: true
        }
      ])
      .select()

    if (error) {
      console.log('Erro ao salvar kit:', error)
      alert('Erro ao salvar kit.')
      return
    }

    setKits([data[0], ...kits])
    setNome('')
    setDescricao('')
    setDescontoPercentual('0')
  }

  function editarKit(kit) {
  setKitEditando(kit)
  setNome(kit.nome || '')
  setDescricao(kit.descricao || '')
  setDescontoPercentual(kit.desconto_percentual || '0')
 }

  function cancelarEdicao() {
    setKitEditando(null)
    setNome('')
    setDescricao('')
    setDescontoPercentual('0')
  }

  async function excluirKit(id) {
    const confirmar = confirm('Tem certeza que deseja excluir este kit?')
    if (!confirmar) return

    const { error } = await supabase
      .from('kits')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao excluir kit:', error)
      alert('Erro ao excluir kit.')
      return
    }

    setKits(kits.filter(kit => kit.id !== id))

    if (kitSelecionado?.id === id) {
      setKitSelecionado(null)
      setItensKit([])
    }
  }

 async function duplicarKit(kit) {
  const { data: novoKit, error: erroKit } = await supabase
    .from('kits')
    .insert([
      {
        nome: `${kit.nome} (Cópia)`,
        descricao: kit.descricao,
        desconto_percentual: kit.desconto_percentual,
        ativo: true,
        valor_individual: kit.valor_individual,
        valor_desconto: kit.valor_desconto,
        preco_final: kit.preco_final,
        lucro_estimado: kit.lucro_estimado,
        margem_estimada: kit.margem_estimada,
        status_margem: kit.status_margem
      }
    ])
    .select()
    .single()

  if (erroKit) {
    console.log('Erro ao duplicar kit:', erroKit)
    alert('Erro ao duplicar kit.')
    return
  }

  const itens = kit.kit_itens || []

  if (itens.length > 0) {
    const itensDuplicados = itens.map(item => ({
      kit_id: novoKit.id,
      produto_id: item.produtos.id,
      quantidade: item.quantidade
    }))

    const { error: erroItens } = await supabase
      .from('kit_itens')
      .insert(itensDuplicados)

    if (erroItens) {
      console.log('Erro ao copiar itens:', erroItens)
    }
  }

  await carregarKits()

  alert('Kit duplicado com sucesso!')
}
  
  async function selecionarKit(kit) {
    setKitSelecionado(kit)
    setProdutoId('')
    setQuantidade('1')
    await carregarItensKit(kit.id)
  }

  async function adicionarProdutoAoKit() {
    if (!kitSelecionado) {
      alert('Selecione um kit.')
      return
    }

    if (!produtoId) {
      alert('Selecione um produto.')
      return
    }

    const { error } = await supabase
      .from('kit_itens')
      .insert([
        {
          kit_id: kitSelecionado.id,
          produto_id: produtoId,
          quantidade: Number(quantidade || 1)
        }
      ])

    if (error) {
      console.log('Erro ao adicionar produto ao kit:', error)
      alert('Erro ao adicionar produto ao kit.')
      return
    }

    setProdutoId('')
    setQuantidade('1')

    const itens = await carregarItensKit(kitSelecionado.id)
    const kitAtualizado = await atualizarMetricasKit(kitSelecionado, itens)

    if (kitAtualizado) {
      setKitSelecionado(kitAtualizado)
    }

    await carregarKits()
  }

  async function removerItemKit(id) {
    const { error } = await supabase
      .from('kit_itens')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Erro ao remover item:', error)
      alert('Erro ao remover item.')
      return
    }

    const itens = await carregarItensKit(kitSelecionado.id)
    const kitAtualizado = await atualizarMetricasKit(kitSelecionado, itens)

    if (kitAtualizado) {
      setKitSelecionado(kitAtualizado)
    }

    await carregarKits()
  }

  function nomesProdutosKit(kit) {
  const itens = kit.kit_itens || []

  if (itens.length === 0) return 'Nenhum produto'

  return itens
    .map(item => {
      const qtd = Number(item.quantidade || 0)
      const nome = item.produtos?.nome || ''

      return `${qtd}x ${nome}`
    })
    .join(', ')
}

  function subtotalProdutos() {
    return calcularSubtotal(itensKit)
  }

  function valorDesconto() {
    const desconto = Number(kitSelecionado?.desconto_percentual || 0)

    return subtotalProdutos() * (desconto / 100)
  }

  function precoFinalKit() {
    return subtotalProdutos() - valorDesconto()
  }

  function custoEstimadoKit() {
    return calcularCusto(itensKit)
  }

  function lucroEstimadoKit() {
    return precoFinalKit() - custoEstimadoKit()
  }

  function margemKit() {
    const preco = precoFinalKit()

    if (preco <= 0) return 0

    return (lucroEstimadoKit() / preco) * 100
  }

  function statusMargemKit() {
    const margem = margemKit()

    if (margem >= 50) return 'Saudável'
    if (margem >= 35) return 'Reduzida'
    return 'Crítica'
  }

  function corStatus(status) {
    if (status === 'Saudável') return 'bg-green-100 text-green-700'
    if (status === 'Reduzida') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Kits
          </h1>

          <p className="text-gray-500">
            Cadastre kits promocionais compostos por produtos já precificados.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
  <h2 className="text-xl font-bold text-gray-800 mb-4">
    Novo Kit
  </h2>

  <div className="grid grid-cols-3 gap-4 mb-4">
    <input
      type="text"
      placeholder="Nome do kit"
      value={kitEditando ? '' : nome}
      onChange={(e) => setNome(e.target.value)}
      disabled={Boolean(kitEditando)}
      className="border rounded-xl px-4 py-3"
    />

    <input
      type="number"
      placeholder="Desconto (%)"
      value={kitEditando ? '' : descontoPercentual}
      onChange={(e) => setDescontoPercentual(e.target.value)}
      disabled={Boolean(kitEditando)}
      className="border rounded-xl px-4 py-3"
    />

    <button
      onClick={salvarKit}
      disabled={Boolean(kitEditando)}
      className={`px-5 py-3 rounded-xl transition ${
        kitEditando
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-gray-900 text-white hover:bg-gray-800'
      }`}
    >
      Salvar Kit
    </button>
  </div>

  <textarea
    rows="3"
    placeholder="Descrição do kit"
    value={kitEditando ? '' : descricao}
    onChange={(e) => setDescricao(e.target.value)}
    disabled={Boolean(kitEditando)}
    className="w-full border rounded-xl px-4 py-3"
  />
</div>

{kitEditando && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-2xl rounded-2xl p-8">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Editar Kit
        </h2>

        <button
          onClick={cancelarEdicao}
          className="text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Nome do kit"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="border rounded-xl px-4 py-3"
        />

        <input
          type="number"
          placeholder="Desconto (%)"
          value={descontoPercentual}
          onChange={(e) => setDescontoPercentual(e.target.value)}
          className="border rounded-xl px-4 py-3"
        />
      </div>

      <textarea
        rows="4"
        placeholder="Descrição do kit"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={cancelarEdicao}
          className="px-5 py-3 rounded-xl border"
        >
          Cancelar
        </button>

        <button
          onClick={salvarKit}
          className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          Salvar Alterações
        </button>
      </div>

    </div>
  </div>
)}
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto mb-8">
          <table className="w-full min-w-[1200px]">

            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-600">Kit</th>
                <th className="text-left p-4 text-gray-600">Produtos</th>
                <th className="text-left p-4 text-gray-600">Valor Individual</th>
                <th className="text-left p-4 text-gray-600">Desconto</th>
                <th className="text-left p-4 text-gray-600">Preço Kit</th>
                <th className="text-left p-4 text-gray-600">Lucro</th>
                <th className="text-left p-4 text-gray-600">Margem</th>
                <th className="text-left p-4 text-gray-600">Status</th>
                <th className="text-left p-4 text-gray-600">Ações</th>
              </tr>
            </thead>

            <tbody>
              {kits.map(kit => (
                <tr key={kit.id} className="border-t">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {kit.nome}
                      </p>

                      {kit.descricao && (
                        <p className="text-sm text-gray-500">
                          {kit.descricao}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="p-4 text-sm text-gray-600 max-w-xs">
                    {nomesProdutosKit(kit)}
                  </td>

                  <td className="p-4">
                    {formatarMoeda(kit.valor_individual)}
                  </td>

                  <td className="p-4">
                    {kit.desconto_percentual || 0}% 
                    <p className="text-xs text-gray-500">
                      {formatarMoeda(kit.valor_desconto)}
                    </p>
                  </td>

                  <td className="p-4 font-semibold text-green-700">
                    {formatarMoeda(kit.preco_final)}
                  </td>

                  <td className="p-4">
                    {formatarMoeda(kit.lucro_estimado)}
                  </td>

                  <td className="p-4">
                    {formatarNumero(kit.margem_estimada)}%
                  </td>

                  <td className="p-4">
                    <span className={`${corStatus(kit.status_margem)} px-3 py-1 rounded-full text-sm`}>
                      {kit.status_margem || 'Saudável'}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-4">

                  <button
                    onClick={() => editarKit(kit)}
                    className="text-blue-600 hover:text-blue-800"
               >
                  Editar
                  </button>

                  <button
                    onClick={() => selecionarKit(kit)}
                    className="text-purple-600 hover:text-purple-800"
                >
                    Montar
                  </button>

                  <button
                    onClick={() => duplicarKit(kit)}
                    className="text-green-600 hover:text-green-800"
                >
                  Duplicar
                  </button>

                  <button
                  onClick={() => excluirKit(kit.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Excluir
                  </button>

                </div>
               </td>
                </tr>
              ))}

              {kits.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="p-6 text-center text-gray-500"
                  >
                    Nenhum kit cadastrado.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {kitSelecionado && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-6xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Montar Kit: {kitSelecionado.nome}
          </h2>

          <p className="text-gray-500">
            Adicione os produtos que fazem parte deste kit.
          </p>
        </div>

        <button
          onClick={() => {
            setKitSelecionado(null)
            setItensKit([])
          }}
          className="text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <select
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          className="border rounded-xl px-4 py-3 col-span-2"
        >
          <option value="">Selecione um produto</option>

          {produtos.map(produto => (
            <option key={produto.id} value={produto.id}>
              {produto.nome} — {formatarMoeda(precoProduto(produto))}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="border rounded-xl px-4 py-3"
        />

        <button
          onClick={adicionarProdutoAoKit}
          className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          + Adicionar
        </button>
      </div>

      <div className="border rounded-2xl overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-gray-600">Produto</th>
              <th className="text-left p-4 text-gray-600">Qtd</th>
              <th className="text-left p-4 text-gray-600">Preço Unit.</th>
              <th className="text-left p-4 text-gray-600">Subtotal</th>
              <th className="text-left p-4 text-gray-600">Ações</th>
            </tr>
          </thead>

          <tbody>
            {itensKit.map(item => (
              <tr key={item.id} className="border-t">
                <td className="p-4">
                  {item.produtos?.nome || '-'}
                </td>

                <td className="p-4">
                  {item.quantidade}
                </td>

                <td className="p-4">
                  {formatarMoeda(precoProduto(item.produtos))}
                </td>

                <td className="p-4 font-semibold">
                  {formatarMoeda(precoProduto(item.produtos) * Number(item.quantidade || 0))}
                </td>

                <td className="p-4">
                  <button
                    onClick={() => removerItemKit(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}

            {itensKit.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="p-6 text-center text-gray-500"
                >
                  Nenhum produto adicionado ao kit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Valor individual</p>
          <p className="font-semibold text-gray-800">
            {formatarMoeda(subtotalProdutos())}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Desconto</p>
          <p className="font-semibold text-gray-800">
            {formatarMoeda(valorDesconto())}
          </p>
        </div>

        <div className="bg-gray-900 text-white rounded-xl p-4">
          <p className="text-sm text-gray-300">Preço do Kit</p>
          <p className="font-bold">
            {formatarMoeda(precoFinalKit())}
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-700">Lucro estimado</p>
          <p className="font-bold text-green-700">
            {formatarMoeda(lucroEstimadoKit())}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Margem</p>
          <p className="font-semibold text-gray-800">
            {formatarNumero(margemKit())}%
          </p>

          <span className={`${corStatus(statusMargemKit())} inline-block mt-2 px-3 py-1 rounded-full text-xs`}>
            {statusMargemKit()}
          </span>
        </div>
      </div>

    </div>
  </div>
)}

</main>
    </div>
  )
}