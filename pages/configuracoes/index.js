import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Configuracoes() {
  const [configId, setConfigId] = useState(null)
  const [precificacaoId, setPrecificacaoId] = useState(null)

  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [telefone, setTelefone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [email, setEmail] = useState('')
  const [site, setSite] = useState('')
  const [pix, setPix] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [prazoPadrao, setPrazoPadrao] = useState('')
  const [mensagemOrcamento, setMensagemOrcamento] = useState('')

  const [energia, setEnergia] = useState('')
  const [internet, setInternet] = useState('')
  const [canva, setCanva] = useState('')
  const [dominio, setDominio] = useState('')
  const [outrosCustos, setOutrosCustos] = useState('')
  const [proLabore, setProLabore] = useState('')
  const [percentualCrescimento, setPercentualCrescimento] = useState('')
  const [margemPadrao, setMargemPadrao] = useState('60')
  
  const [taxaCartao, setTaxaCartao] = useState('5.04')

const [descontoPixAutomatico, setDescontoPixAutomatico] = useState(true)

const [mostrarDescontoPix, setMostrarDescontoPix] = useState(true)

const [formaPagamentoPadrao, setFormaPagamentoPadrao] = useState('Cartão')

const [validadeOrcamentoDias, setValidadeOrcamentoDias] = useState('7')

  useEffect(() => {
    carregarConfiguracoes()
    carregarConfiguracoesPrecificacao()
  }, [])

  async function carregarConfiguracoes() {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .limit(1)

    if (error) {
      console.log('Erro ao carregar configurações:', error)
      return
    }

    const config = data?.[0]

    if (!config) return

    setConfigId(config.id)

    setNomeEmpresa(config.nome_empresa || '')
    setWhatsapp(config.whatsapp || '')
    setTelefone(config.telefone || '')
    setInstagram(config.instagram || '')
    setEmail(config.email || '')
    setSite(config.site || '')
    setPix(config.pix || '')
    setEndereco(config.endereco || '')
    setCidade(config.cidade || '')
    setEstado(config.estado || '')
    setPrazoPadrao(config.prazo_padrao || '')
    setMensagemOrcamento(config.mensagem_orcamento || '')
    setMargemPadrao(config.margem_padrao ?? 60)
    setTaxaCartao(config.taxa_cartao ?? 5.04)

setDescontoPixAutomatico(
  config.desconto_pix_automatico ?? true
)

setMostrarDescontoPix(
  config.mostrar_desconto_pix_orcamento ?? true
)
  }

  async function carregarConfiguracoesPrecificacao() {
    const { data, error } = await supabase
      .from('configuracoes_precificacao')
      .select('*')
      .limit(1)

    if (error) {
      console.log('Erro ao carregar parâmetros financeiros:', error)
      return
    }

    const config = data?.[0]

    if (!config) return

    setPrecificacaoId(config.id)

    setEnergia(config.energia || '')
    setInternet(config.internet || '')
    setCanva(config.canva || '')
    setDominio(config.dominio || '')
    setOutrosCustos(config.outros_custos || '')
    setProLabore(config.pro_labore_desejado || '')
    setPercentualCrescimento(config.percentual_crescimento || '')
    setMargemPadrao(config.margem_padrao || 60)
    setFormaPagamentoPadrao(
  config.forma_pagamento_padrao || 'Cartão'
)

setValidadeOrcamentoDias(
  config.validade_orcamento_dias ?? 7
)
  }

  async function salvarConfiguracoes() {
    const dadosEmpresa = {
      nome_empresa: nomeEmpresa,
      whatsapp,
      telefone,
      instagram,
      email,
      site,
      pix,
      endereco,
      cidade,
      estado,
      prazo_padrao: prazoPadrao,
      mensagem_orcamento: mensagemOrcamento,
      margem_padrao: Number(margemPadrao || 0)
    }

    let erroEmpresa = null

    if (configId) {
      const { error } = await supabase
        .from('configuracoes')
        .update(dadosEmpresa)
        .eq('id', configId)

      erroEmpresa = error
    } else {
      const { data, error } = await supabase
        .from('configuracoes')
        .insert([dadosEmpresa])
        .select()

      erroEmpresa = error

      if (data?.[0]) {
        setConfigId(data[0].id)
      }
    }

    if (erroEmpresa) {
      console.log('Erro ao salvar configurações:', erroEmpresa)
      alert('Erro ao salvar dados da empresa.')
      return
    }

    const dadosFinanceiros = {
      energia: Number(energia || 0),
      internet: Number(internet || 0),
      canva: Number(canva || 0),
      dominio: Number(dominio || 0),
      outros_custos: Number(outrosCustos || 0),
      pro_labore_desejado: Number(proLabore || 0),
      percentual_crescimento: Number(percentualCrescimento || 0),
      margem_padrao: Number(margemPadrao || 0),
      taxa_cartao: Number(taxaCartao || 0),

      desconto_pix_automatico: descontoPixAutomatico,

      mostrar_desconto_pix_orcamento: mostrarDescontoPix,

      forma_pagamento_padrao: formaPagamentoPadrao,

  validade_orcamento_dias: Number(validadeOrcamentoDias || 0)
    }

    let erroFinanceiro = null

    if (precificacaoId) {
      const { error } = await supabase
        .from('configuracoes_precificacao')
        .update(dadosFinanceiros)
        .eq('id', precificacaoId)

      erroFinanceiro = error
    } else {
      const { data, error } = await supabase
        .from('configuracoes_precificacao')
        .insert([dadosFinanceiros])
        .select()

      erroFinanceiro = error

      if (data?.[0]) {
        setPrecificacaoId(data[0].id)
      }
    }

    if (erroFinanceiro) {
      console.log('Erro ao salvar parâmetros financeiros:', erroFinanceiro)
      alert('Erro ao salvar parâmetros financeiros.')
      return
    }

    alert('Configurações salvas com sucesso!')
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function custosFixosTotais() {
    return (
      Number(energia || 0) +
      Number(internet || 0) +
      Number(canva || 0) +
      Number(dominio || 0) +
      Number(outrosCustos || 0)
    )
  }

  function metaMinima() {
    return custosFixosTotais() + Number(proLabore || 0)
  }

  function reservaCrescimento() {
    return metaMinima() * (Number(percentualCrescimento || 0) / 100)
  }

  function metaCrescimento() {
    return metaMinima() + reservaCrescimento()
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Configurações
          </h1>

          <p className="text-gray-500">
            Central de dados da empresa, parâmetros financeiros, metas e precificação.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Custos fixos
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {formatarMoeda(custosFixosTotais())}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Pró-labore
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {formatarMoeda(proLabore)}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Meta mínima
            </p>

            <h2 className="text-2xl font-bold text-yellow-700 mt-2">
              {formatarMoeda(metaMinima())}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-500">
              Meta crescimento
            </p>

            <h2 className="text-2xl font-bold text-blue-700 mt-2">
              {formatarMoeda(metaCrescimento())}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">

          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Dados da empresa
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="Nome da empresa"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="Instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="Site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="PIX"
              value={pix}
              onChange={(e) => setPix(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="Prazo padrão"
              value={prazoPadrao}
              onChange={(e) => setPrazoPadrao(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">

            <input
              type="text"
              placeholder="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

            <input
              type="text"
              placeholder="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="border rounded-xl px-4 py-3"
            />

          </div>

          <div className="mt-4">
            <textarea
              rows="4"
              placeholder="Mensagem padrão do orçamento"
              value={mensagemOrcamento}
              onChange={(e) => setMensagemOrcamento(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">

          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Parâmetros financeiros e metas
          </h2>

          <div className="grid grid-cols-4 gap-4">

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Energia
    </label>

    <input
      type="number"
      value={energia}
      onChange={(e) => setEnergia(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Forma de pagamento padrão
  </label>

  <select
    value={formaPagamentoPadrao}
    onChange={(e) => setFormaPagamentoPadrao(e.target.value)}
    className="w-full border rounded-xl px-4 py-3"
  >
    <option value="Cartão">Cartão</option>
    <option value="PIX">PIX</option>
  </select>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Validade padrão do orçamento (dias)
  </label>

  <input
    type="number"
    value={validadeOrcamentoDias}
    onChange={(e) => setValidadeOrcamentoDias(e.target.value)}
    className="w-full border rounded-xl px-4 py-3"
  />
</div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Internet
    </label>

    <input
      type="number"
      value={internet}
      onChange={(e) => setInternet(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Canva
    </label>

    <input
      type="number"
      value={canva}
      onChange={(e) => setCanva(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Domínio / Hospedagem
    </label>

    <input
      type="number"
      value={dominio}
      onChange={(e) => setDominio(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Outros custos
    </label>

    <input
      type="number"
      value={outrosCustos}
      onChange={(e) => setOutrosCustos(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Pró-labore desejado
    </label>

    <input
      type="number"
      value={proLabore}
      onChange={(e) => setProLabore(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Crescimento desejado (%)
    </label>

    <input
      type="number"
      value={percentualCrescimento}
      onChange={(e) => setPercentualCrescimento(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Margem padrão (%)
    </label>

    <input
      type="number"
      value={margemPadrao}
      onChange={(e) => setMargemPadrao(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>

</div>

          <div className="border-t mt-8 pt-8">
  <h3 className="text-lg font-bold text-gray-800 mb-4">
    Política comercial
  </h3>

  <div className="grid grid-cols-3 gap-4">

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Taxa do cartão (%)
      </label>

      <input
        type="number"
        step="0.01"
        value={taxaCartao}
        onChange={(e) => setTaxaCartao(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Forma de pagamento padrão
      </label>

      <select
        value={formaPagamentoPadrao}
        onChange={(e) => setFormaPagamentoPadrao(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      >
        <option value="Cartão">Cartão</option>
        <option value="PIX">PIX</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Validade padrão do orçamento (dias)
      </label>

      <input
        type="number"
        value={validadeOrcamentoDias}
        onChange={(e) => setValidadeOrcamentoDias(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>

    <label className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <input
        type="checkbox"
        checked={descontoPixAutomatico}
        onChange={(e) => setDescontoPixAutomatico(e.target.checked)}
      />

      <span className="text-sm text-gray-700">
        Calcular desconto PIX automaticamente
      </span>
    </label>

    <label className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <input
        type="checkbox"
        checked={mostrarDescontoPix}
        onChange={(e) => setMostrarDescontoPix(e.target.checked)}
      />

      <span className="text-sm text-gray-700">
        Mostrar observação de desconto PIX no orçamento
      </span>
    </label>

  </div>

  <p className="text-sm text-gray-500 mt-4">
    A taxa do cartão será usada para calcular o valor de referência e o desconto PIX equivalente.
  </p>
</div>

        </div>

        <div className="flex justify-end">
          <button
            onClick={salvarConfiguracoes}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Salvar Configurações
          </button>
        </div>

      </main>
    </div>
  )
}