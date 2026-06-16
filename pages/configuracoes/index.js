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
    setMargemPadrao(config.margem_padrao || 60)
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
      margem_padrao: Number(margemPadrao || 0)
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

          <p className="text-sm text-gray-500 mt-4">
            Esses dados alimentam automaticamente Precificação, Metas e Dashboard.
          </p>

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