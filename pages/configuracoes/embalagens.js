import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

const TIPOS = [
  { id: 'produto', label: 'Embalagem de produto' },
  { id: 'kit', label: 'Embalagem de kit' },
  { id: 'premium', label: 'Embalagem Premium' },
]

export default function ConfiguracaoEmbalagens() {
  const [embalagens, setEmbalagens] = useState([])
  const [estoque, setEstoque] = useState([])
  const [produtos, setProdutos] = useState([])
  const [kits, setKits] = useState([])
  const [configuracaoId, setConfiguracaoId] = useState(null)
  const [sacolaEstoqueId, setSacolaEstoqueId] = useState('')
  const [selecionadaId, setSelecionadaId] = useState('')
  const [componentes, setComponentes] = useState([])
  const [nova, setNova] = useState({ nome: '', tipo: 'produto' })
  const [novoComponente, setNovoComponente] = useState({ estoque_id: '', quantidade: '1' })
  const [vinculosProdutos, setVinculosProdutos] = useState({})
  const [vinculosKits, setVinculosKits] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(false)

  useEffect(() => { carregar() }, [])
  useEffect(() => {
    if (selecionadaId) carregarComponentes(selecionadaId)
    else setComponentes([])
  }, [selecionadaId])

  async function carregar() {
    setCarregando(true)
    setMensagem('')
    try {
      const [e, s, p, k, c, pe, ke] = await Promise.all([
        supabase.from('embalagens_fisicas').select('*').order('nome'),
        supabase.from('estoque').select('id,nome,unidade,custo_unitario').eq('ativo', true).eq('categoria_item', 'embalagem').order('nome'),
        supabase.from('produtos').select('id,nome').order('nome'),
        supabase.from('kits').select('id,nome').order('nome'),
        supabase.from('configuracoes_sistema').select('id,sacola_estoque_id').order('created_at').limit(1).maybeSingle(),
        supabase.from('produto_embalagens').select('produto_id,embalagem_id'),
        supabase.from('kit_embalagens').select('kit_id,embalagem_id'),
      ])
      for (const result of [e, s, p, k, c, pe, ke]) if (result.error) throw result.error
      setEmbalagens(e.data || [])
      setEstoque(s.data || [])
      setProdutos(p.data || [])
      setKits(k.data || [])
      setConfiguracaoId(c.data?.id || null)
      setSacolaEstoqueId(c.data?.sacola_estoque_id || '')
      setVinculosProdutos(Object.fromEntries((pe.data || []).map(x => [x.produto_id, x.embalagem_id])))
      setVinculosKits(Object.fromEntries((ke.data || []).map(x => [x.kit_id, x.embalagem_id])))
    } catch (e) {
      setErro(true)
      setMensagem(`Não foi possível carregar as embalagens: ${e.message || 'erro desconhecido'}`)
    } finally { setCarregando(false) }
  }

  async function carregarComponentes(id) {
    const { data, error: requestError } = await supabase
      .from('embalagem_componentes')
      .select('id,embalagem_id,estoque_id,quantidade,estoque(id,nome,unidade,custo_unitario)')
      .eq('embalagem_id', id)
      .order('created_at')
    if (requestError) { setErro(true); setMensagem(requestError.message); return }
    setComponentes(data || [])
  }

  const custoAtual = useMemo(() => componentes.reduce((total, item) =>
    total + Number(item.quantidade || 0) * Number(item.estoque?.custo_unitario || 0), 0), [componentes])

  async function criarEmbalagem(event) {
    event.preventDefault()
    setSalvando(true); setMensagem(''); setErro(false)
    const { data, error: requestError } = await supabase.from('embalagens_fisicas')
      .insert({ nome: nova.nome.trim(), tipo: nova.tipo }).select().single()
    if (requestError) { setErro(true); setMensagem(requestError.message) }
    else {
      setEmbalagens(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNova({ nome: '', tipo: nova.tipo }); setSelecionadaId(data.id)
      setMensagem('Embalagem criada. Adicione os itens do Estoque.')
    }
    setSalvando(false)
  }

  async function adicionarComponente(event) {
    event.preventDefault()
    const quantidade = Number(String(novoComponente.quantidade).replace(',', '.'))
    if (!selecionadaId || !novoComponente.estoque_id || !Number.isFinite(quantidade) || quantidade <= 0) {
      setErro(true); setMensagem('Selecione um item do Estoque e informe uma quantidade maior que zero.'); return
    }
    setSalvando(true); setMensagem(''); setErro(false)
    const { error: requestError } = await supabase.from('embalagem_componentes').upsert({
      embalagem_id: selecionadaId, estoque_id: novoComponente.estoque_id, quantidade,
    }, { onConflict: 'embalagem_id,estoque_id' })
    if (requestError) { setErro(true); setMensagem(requestError.message) }
    else { await carregarComponentes(selecionadaId); setMensagem('Componente salvo.') }
    setSalvando(false)
  }

  async function removerComponente(id) {
    const { error: requestError } = await supabase.from('embalagem_componentes').delete().eq('id', id)
    if (requestError) { setErro(true); setMensagem(requestError.message) }
    else { await carregarComponentes(selecionadaId); setMensagem('Componente removido da composição.') }
  }

  async function salvarVinculo(tipo, donoId, embalagemId) {
    setMensagem(''); setErro(false); setSalvando(true)
    const tabela = tipo === 'produto' ? 'produto_embalagens' : 'kit_embalagens'
    const chave = tipo === 'produto' ? 'produto_id' : 'kit_id'
    const setters = tipo === 'produto' ? setVinculosProdutos : setVinculosKits
    const atual = tipo === 'produto' ? vinculosProdutos : vinculosKits
    let requestError = null
    if (!embalagemId) {
      const response = await supabase.from(tabela).delete().eq(chave, donoId)
      requestError = response.error
    } else {
      const response = await supabase.from(tabela).upsert({ [chave]: donoId, embalagem_id: embalagemId }, { onConflict: chave })
      requestError = response.error
    }
    if (requestError) { setErro(true); setMensagem(requestError.message) }
    else { setters({ ...atual, [donoId]: embalagemId }); setMensagem('Vínculo atualizado.') }
    setSalvando(false)
  }

  async function salvarSacola(event) {
    event.preventDefault()
    if (!configuracaoId) { setErro(true); setMensagem('Registro de configuração do sistema não encontrado.'); return }
    setSalvando(true); setMensagem(''); setErro(false)
    const { error: requestError } = await supabase.from('configuracoes_sistema')
      .update({ sacola_estoque_id: sacolaEstoqueId || null, updated_at: new Date().toISOString() })
      .eq('id', configuracaoId)
    if (requestError) { setErro(true); setMensagem(requestError.message) }
    else setMensagem('Sacola padrão salva. A quantidade efetiva será definida no Pedido.')
    setSalvando(false)
  }

  const embalagensPorTipo = tipo => embalagens.filter(x => x.tipo === tipo && x.ativo)
  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return <div className="flex min-h-screen bg-gray-100"><Sidebar /><main className="flex-1 p-6 md:p-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><div className="mb-2 text-sm text-gray-500"><Link href="/configuracoes">Configurações</Link> / Embalagens</div>
        <h1 className="text-2xl font-bold text-gray-900">Embalagens</h1>
        <p className="mt-1 text-sm text-gray-600">Monte embalagens com itens do Estoque. O custo acompanha os valores atuais desses itens.</p></div>
      <Link href="/configuracoes" className="rounded-lg border bg-white px-4 py-2 text-sm">Voltar às configurações</Link>
    </div>
    {mensagem && <div role="status" className={`mb-4 rounded-lg p-3 text-sm ${erro ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{mensagem}</div>}
    {carregando ? <div className="rounded-xl bg-white p-6">Carregando...</div> : <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Nova embalagem</h2>
        <form onSubmit={criarEmbalagem} className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
          <input required maxLength={120} className="rounded-lg border p-2" placeholder="Nome da embalagem" value={nova.nome} onChange={e => setNova({ ...nova, nome: e.target.value })} />
          <select className="rounded-lg border p-2" value={nova.tipo} onChange={e => setNova({ ...nova, tipo: e.target.value })}>{TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
          <button disabled={salvando} className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50">Criar embalagem</button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Itens da embalagem</h2>
        <div className="mb-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <select className="rounded-lg border p-2" value={selecionadaId} onChange={e => setSelecionadaId(e.target.value)}>
            <option value="">Selecione uma embalagem</option>{embalagens.map(x => <option key={x.id} value={x.id}>{x.nome} — {TIPOS.find(t => t.id === x.tipo)?.label || x.tipo}</option>)}
          </select>
          <div className="rounded-lg bg-gray-50 p-2 text-sm">Custo atual da embalagem: <strong>{moeda(custoAtual)}</strong></div>
          <span className="self-center text-xs text-gray-500">Atualizado pelos custos do Estoque</span>
        </div>
        {selecionadaId && <>
          <form onSubmit={adicionarComponente} className="mb-4 grid gap-3 md:grid-cols-[2fr_1fr_auto]">
            <select required className="rounded-lg border p-2" value={novoComponente.estoque_id} onChange={e => setNovoComponente({ ...novoComponente, estoque_id: e.target.value })}>
              <option value="">Selecione um item de embalagem</option>{estoque.map(x => <option key={x.id} value={x.id}>{x.nome} ({x.unidade}) — {moeda(x.custo_unitario)}</option>)}
            </select>
            <input required type="number" min="0.001" step="0.001" className="rounded-lg border p-2" aria-label="Quantidade do componente" value={novoComponente.quantidade} onChange={e => setNovoComponente({ ...novoComponente, quantidade: e.target.value })} />
            <button disabled={salvando} className="rounded-lg border px-4 py-2 disabled:opacity-50">Adicionar / atualizar</button>
          </form>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-2">Componente</th><th className="p-2">Quantidade</th><th className="p-2">Custo unitário atual</th><th className="p-2">Subtotal</th><th /></tr></thead><tbody>
            {componentes.map(x => <tr key={x.id} className="border-b"><td className="p-2">{x.estoque?.nome || 'Item removido'}</td><td className="p-2">{x.quantidade} {x.estoque?.unidade}</td><td className="p-2">{moeda(x.estoque?.custo_unitario)}</td><td className="p-2">{moeda(Number(x.quantidade) * Number(x.estoque?.custo_unitario || 0))}</td><td className="p-2 text-right"><button type="button" onClick={() => removerComponente(x.id)} className="text-red-700">Remover</button></td></tr>)}
            {!componentes.length && <tr><td colSpan="5" className="p-4 text-center text-gray-500">Nenhum componente cadastrado.</td></tr>}
          </tbody></table></div>
        </>}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Embalagens de Produtos e Kits</h2><p className="mb-4 text-sm text-gray-600">Cada Produto ou Kit pode ter sua embalagem vinculada. A embalagem do Kit é independente das embalagens dos Produtos incluídos nele.</p>
        <div className="grid gap-5 lg:grid-cols-2">{[[produtos, vinculosProdutos, 'produto', 'Produto', 'produto'], [kits, vinculosKits, 'kit', 'Kit', 'kit']].map(([items, links, tipo, singular, kind]) => <div key={tipo}>
          <h3 className="mb-2 font-medium">{singular}</h3>{items.map(item => <label key={item.id} className="mb-2 grid grid-cols-[1fr_1.2fr] items-center gap-3 text-sm"><span className="truncate">{item.nome}</span><select className="rounded-lg border p-2" value={links[item.id] || ''} onChange={e => salvarVinculo(tipo, item.id, e.target.value)}>
            <option value="">Sem embalagem vinculada</option>{embalagensPorTipo(kind).map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select></label>)}{items.length === 0 && <p className="text-sm text-gray-500">Nenhum {singular.toLowerCase()} cadastrado.</p>}</div>)}</div>
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Embalagens Premium podem ser cadastradas com itens do Estoque. A escolha para uma venda ainda não está disponível.</div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Sacola padrão</h2><p className="mb-4 text-sm text-gray-600">Selecione o item do Estoque usado como sacola. A quantidade efetiva será definida no Pedido.</p>
        <form onSubmit={salvarSacola} className="flex flex-wrap gap-3"><select className="min-w-[260px] rounded-lg border p-2" value={sacolaEstoqueId} onChange={e => setSacolaEstoqueId(e.target.value)}><option value="">Sem vínculo</option>{estoque.map(x => <option key={x.id} value={x.id}>{x.nome} ({x.unidade})</option>)}</select><button disabled={salvando} className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50">Salvar vínculo</button></form>
      </section>
    </div>}
  </main></div>
}
