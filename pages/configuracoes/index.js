import { useEffect, useState } from 'react'



import Sidebar from '../../components/Sidebar'



import { supabase } from '../../lib/supabase'
import { obterTotalCustosOperacionais } from '../../lib/custosOperacionais'
import { calcularCustoMensalSacolas } from '../../lib/sacolasV2'







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
  const [totalCustosOperacionais, setTotalCustosOperacionais] = useState(0)

const [proLabore, setProLabore] = useState('')



  const [horasPorDia, setHorasPorDia] = useState('8')



  const [diasPorSemana, setDiasPorSemana] = useState('5')



  const [percentualCrescimento, setPercentualCrescimento] = useState('')



  const [margemPadrao, setMargemPadrao] = useState('60')







  const [taxaCartao, setTaxaCartao] = useState('5.04')







const [descontoPixAutomatico, setDescontoPixAutomatico] = useState(true)







const [mostrarDescontoPix, setMostrarDescontoPix] = useState(true)







const [formaPagamentoPadrao, setFormaPagamentoPadrao] = useState('Cartão')







const [validadeOrcamentoDias, setValidadeOrcamentoDias] = useState('7')



const [configSistemaId, setConfigSistemaId] = useState(null)







const [embalagemPadrao, setEmbalagemPadrao] = useState('3')







const [sacolasPorPedido, setSacolasPorPedido] = useState('1')
const [estimativaPedidosMes, setEstimativaPedidosMes] = useState('0')
const [sacolaEstoqueId, setSacolaEstoqueId] = useState('')
const [sacolasDisponiveis, setSacolasDisponiveis] = useState([])







  useEffect(() => {



  carregarConfiguracoes()



  carregarConfiguracoesPrecificacao()



  carregarConfiguracoesSistema()
  carregarSacolasDisponiveis()

    carregarCustosOperacionais()



}, [])

  async function carregarSacolasDisponiveis() {
    const { data, error } = await supabase.from('estoque')
      .select('id,nome,custo_unitario')
      .eq('ativo', true)
      .eq('categoria_item', 'embalagem')
      .order('nome')
    if (error) {
      console.error('Erro ao carregar itens de embalagem do Estoque:', error)
      return
    }
    setSacolasDisponiveis(data || [])
  }







  async function carregarCustosOperacionais() {

    try {

      const total = await obterTotalCustosOperacionais()

      setTotalCustosOperacionais(Number(total || 0))

    } catch (error) {

      console.log('Erro ao carregar custos operacionais:', error)

      setTotalCustosOperacionais(0)

    }

  }



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
    setDescontoPixAutomatico(config.desconto_pix_automatico ?? true)
    setMostrarDescontoPix(config.mostrar_desconto_pix_orcamento ?? true)
    setProLabore(config.pro_labore_desejado || '')



    setHorasPorDia(config.horas_por_dia ?? 8)



    setDiasPorSemana(config.dias_por_semana ?? 5)



    setPercentualCrescimento(config.percentual_crescimento || '')



    setMargemPadrao(config.margem_padrao || 60)



    setFormaPagamentoPadrao(



  config.forma_pagamento_padrao || 'Cartão'



)







setValidadeOrcamentoDias(



  config.validade_orcamento_dias ?? 7



)



  }







  async function carregarConfiguracoesSistema() {



  const { data, error } = await supabase



    .from('configuracoes_sistema')



    .select('*')



    .order('created_at', { ascending: true })
    .order('id', { ascending: true })



    .limit(1)







  if (error) {



    console.log('Erro ao carregar configurações do sistema:', error)



    return



  }







  const config = data?.[0]







  if (!config) return







  setConfigSistemaId(config.id)







  setEmbalagemPadrao(



    config.embalagem_padrao ?? 3



  )







  setSacolasPorPedido(



    config.quantidade_sacolas_por_pedido ?? 1



  )

  setEstimativaPedidosMes(
    config.estimativa_pedidos_mes ?? 0
  )
  setSacolaEstoqueId(config.sacola_estoque_id || '')



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







    const horasPorDiaNumero = Number(horasPorDia)

    const diasPorSemanaNumero = Number(diasPorSemana)



    if (

      !Number.isFinite(horasPorDiaNumero) ||

      horasPorDiaNumero <= 0

    ) {

      alert('Informe uma quantidade válida de horas trabalhadas por dia.')

      return

    }



    if (

      !Number.isFinite(diasPorSemanaNumero) ||

      diasPorSemanaNumero <= 0 ||

      diasPorSemanaNumero > 7

    ) {

      alert('Informe uma quantidade válida de dias trabalhados por semana, entre 1 e 7.')

      return

    }



    const dadosFinanceiros = {
pro_labore_desejado: Number(proLabore || 0),



      horas_por_dia: horasPorDiaNumero,



      dias_por_semana: diasPorSemanaNumero,



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







    const dadosSistema = {



  embalagem_padrao: Number(



    embalagemPadrao || 0



  ),







  quantidade_sacolas_por_pedido: Number(sacolasPorPedido || 0),
  estimativa_pedidos_mes: Number(estimativaPedidosMes || 0),
  sacola_estoque_id: sacolaEstoqueId || null



}







if (!Number.isInteger(Number(sacolasPorPedido)) || Number(sacolasPorPedido) < 0 ||
    !Number.isInteger(Number(estimativaPedidosMes)) || Number(estimativaPedidosMes) < 0) {
  alert('Informe quantidades inteiras e não negativas para sacolas e pedidos mensais.')
  return
}

if (configSistemaId) {



  const { error: erroSistema } = await supabase



    .from('configuracoes_sistema')



    .update(dadosSistema)



    .eq('id', configSistemaId)

  if (erroSistema) {
    console.error('Erro ao salvar planejamento de sacolas:', erroSistema)
    alert('Não foi possível salvar o planejamento de sacolas.')
    return
  }



}







    alert('Configurações salvas com sucesso!')



  }







  function formatarMoeda(valor) {



    return Number(valor || 0).toLocaleString('pt-BR', {



      style: 'currency',



      currency: 'BRL'



    })



  }







  function custosOperacionaisTotais() {

    return Number(totalCustosOperacionais || 0)

  }



  function metaMinima() {



    return custosOperacionaisTotais() + Number(proLabore || 0)



  }







  function reservaCrescimento() {



    return metaMinima() * (Number(percentualCrescimento || 0) / 100)



  }







  function metaCrescimento() {



    return metaMinima() + reservaCrescimento()



  }







  const sacolaSelecionada = sacolasDisponiveis.find(item => item.id === sacolaEstoqueId)
  const custoMensalSacolas = calcularCustoMensalSacolas(
    estimativaPedidosMes, sacolasPorPedido, sacolaSelecionada?.custo_unitario ?? 0
  )

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



              Custos operacionais



            </p>







            <h2 className="text-2xl font-bold text-gray-800 mt-2">



              {formatarMoeda(custosOperacionaisTotais())}



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

      Horas trabalhadas por dia

    </label>



    <input

      type="number"

      min="0.01"

      step="0.01"

      value={horasPorDia}

      onChange={(e) => setHorasPorDia(e.target.value)}

      className="w-full border rounded-xl px-4 py-3"

    />



    <p className="text-xs text-gray-500 mt-2">

      Utilizadas no cálculo da capacidade mensal e do valor por hora.

    </p>

  </div>



  <div>

    <label className="block text-sm font-medium text-gray-700 mb-2">

      Dias trabalhados por semana

    </label>



    <input

      type="number"

      min="1"

      max="7"

      step="1"

      value={diasPorSemana}

      onChange={(e) => setDiasPorSemana(e.target.value)}

      className="w-full border rounded-xl px-4 py-3"

    />



    <p className="text-xs text-gray-500 mt-2">

      Informe somente a quantidade de dias trabalhados na semana.

    </p>

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














  </div>










</div>







        </div>







        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">







  <h2 className="text-xl font-bold text-gray-800 mb-6">



    Embalagens



  </h2>







  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

  

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Sacola padrão do Estoque
      </label>
      <select
        value={sacolaEstoqueId}
        onChange={event => setSacolaEstoqueId(event.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      >
        <option value="">Nenhuma sacola padrão selecionada</option>
        {sacolasDisponiveis.map(item => (
          <option key={item.id} value={item.id}>{item.nome}</option>
        ))}
      </select>
      {sacolaEstoqueId && !sacolaSelecionada && (
        <p className="text-xs text-amber-700 mt-2">A sacola selecionada não está entre os itens ativos de embalagem. Confira o item de Estoque.</p>
      )}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Quantidade padrão de sacolas por pedido
      </label>
      <input
        type="number"
        min="0"
        step="1"
        value={sacolasPorPedido}
        onChange={event => setSacolasPorPedido(event.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />
      <p className="text-xs text-gray-500 mt-2">
        Quantidade usada para estimar o custo mensal das sacolas. Não representa o consumo efetivo de cada pedido.
      </p>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Estimativa de pedidos por mês
      </label>
      <input
        type="number"
        min="0"
        step="1"
        value={estimativaPedidosMes}
        onChange={event => setEstimativaPedidosMes(event.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />
      <p className="text-xs text-gray-500 mt-2">
        Estimativa editável usada no custo econômico das sacolas.
      </p>
    </div>
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-600">Custo unitário atual da sacola</p>
      <p className="font-semibold text-gray-800 mt-1">
        {sacolaSelecionada ? formatarMoeda(sacolaSelecionada.custo_unitario) : '—'}
      </p>
      <p className="text-sm text-gray-600 mt-3">Custo mensal estimado das sacolas</p>
      <p className="font-semibold text-gray-800 mt-1">
        {sacolaSelecionada && custoMensalSacolas !== null ? formatarMoeda(custoMensalSacolas) : '—'}
      </p>
      <p className="text-xs text-gray-500 mt-2">
        Estimativa de pedidos × sacolas por pedido × custo unitário atual do Estoque.
      </p>
    </div>

  </div>







  <div className="mt-6 p-5 rounded-2xl bg-purple-50 border border-purple-100">







    <h3 className="font-semibold text-gray-800 mb-3">



      Regras atuais



    </h3>







    <ul className="text-sm text-gray-600 space-y-2">







      <li>



        📦 Embalagem Avulsa → custo calculado pelos componentes associados.



      </li>







      <li>



        🛍 Sacola → custo mensal estimado incluído nos Custos Operacionais.



      </li>














    </ul>







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
