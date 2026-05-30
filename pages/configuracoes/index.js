import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabase'

export default function Configuracoes() {
  const [configId, setConfigId] = useState(null)
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

  async function carregarConfiguracoes() {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.log('Erro ao carregar configurações:', error)
      return
    }

    setConfigId(data.id)
    setNomeEmpresa(data.nome_empresa || '')
    setWhatsapp(data.whatsapp || '')
    setTelefone(data.telefone || '')
    setInstagram(data.instagram || '')
    setEmail(data.email || '')
    setSite(data.site || '')
    setPix(data.pix || '')
    setEndereco(data.endereco || '')
    setCidade(data.cidade || '')
    setEstado(data.estado || '')
    setPrazoPadrao(data.prazo_padrao || '')
    setMensagemOrcamento(data.mensagem_orcamento || '')
  }

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  async function salvarConfiguracoes() {
    const dados = {
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
      mensagem_orcamento: mensagemOrcamento
    }

    const { error } = await supabase
      .from('configuracoes')
      .update(dados)
      .eq('id', configId)

    if (error) {
      console.log('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações.')
      return
    }

    alert('Configurações salvas com sucesso!')
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
            Dados da Eternaê usados em PDFs, mensagens e documentos.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-5xl">

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

          <div className="flex justify-end mt-6">
            <button
              onClick={salvarConfiguracoes}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition"
            >
              Salvar Configurações
            </button>
          </div>

        </div>

      </main>
    </div>
  )
}