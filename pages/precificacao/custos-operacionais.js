import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import CustoOperacionalModal from '../../components/CustoOperacionalModal'
import { supabase } from '../../lib/supabase'
import { obterResumoSacolasV2 } from '../../lib/sacolasV2'

export default function CustosOperacionais() {
  const [custos, setCustos] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [custoEditando, setCustoEditando] = useState(null)
  const [alterandoStatusId, setAlterandoStatusId] =
    useState(null)
  const [resumoSacolas, setResumoSacolas] = useState(null)
  const [erroSacolas, setErroSacolas] = useState('')

  async function carregarCustos() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('custos_operacionais')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.log(
        'Erro ao carregar custos operacionais:',
        error
      )

      alert('Erro ao carregar os custos operacionais.')
      setCustos([])
      setCarregando(false)
      return
    }

    setCustos(data || [])
    setCarregando(false)
  }

  useEffect(() => {
    carregarCustos()
    obterResumoSacolasV2()
      .then(setResumoSacolas)
      .catch(error => {
        console.error('Não foi possível consultar a parcela econômica das sacolas:', error)
        setErroSacolas('Parcela de sacolas indisponível. Confira a configuração da sacola padrão.')
      })
  }, [])

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  async function adicionarCusto(custo) {
    const { data, error } = await supabase
      .from('custos_operacionais')
      .insert([
        {
          ...custo,
          ativo: true
        }
      ])
      .select()

    if (error) {
      console.log(
        'Erro ao cadastrar custo operacional:',
        error
      )

      alert('Erro ao cadastrar custo operacional.')
      return false
    }

    const novoCusto = data?.[0]

    if (!novoCusto) {
      alert(
        'O custo operacional não foi retornado após o cadastro.'
      )
      return false
    }

    setCustos((listaAtual) =>
      [...listaAtual, novoCusto].sort((a, b) =>
        String(a.nome || '').localeCompare(
          String(b.nome || ''),
          'pt-BR'
        )
      )
    )

    setOpenModal(false)
    return true
  }

  async function salvarCusto(custo) {
    if (!custoEditando) {
      return adicionarCusto(custo)
    }

    const { data, error } = await supabase
      .from('custos_operacionais')
      .update({
        ...custo,
        updated_at: new Date().toISOString()
      })
      .eq('id', custoEditando.id)
      .select()

    if (error) {
      console.log(
        'Erro ao editar custo operacional:',
        error
      )

      alert('Erro ao editar custo operacional.')
      return false
    }

    const custoAtualizado = data?.[0]

    if (!custoAtualizado) {
      alert(
        'O custo operacional não foi retornado após a edição.'
      )
      return false
    }

    setCustos((listaAtual) =>
      listaAtual
        .map((item) =>
          item.id === custoEditando.id
            ? custoAtualizado
            : item
        )
        .sort((a, b) =>
          String(a.nome || '').localeCompare(
            String(b.nome || ''),
            'pt-BR'
          )
        )
    )

    setCustoEditando(null)
    setOpenModal(false)
    return true
  }

  function editarCusto(custo) {
    setCustoEditando(custo)
    setOpenModal(true)
  }

  async function alterarStatus(custo) {
    if (alterandoStatusId) return

    const novoStatus = !custo.ativo

    const acao = novoStatus
      ? 'ativar'
      : 'inativar'

    const confirmar = confirm(
      `Tem certeza que deseja ${acao} o custo "${custo.nome}"?`
    )

    if (!confirmar) return

    setAlterandoStatusId(custo.id)

    try {
      const { data, error } = await supabase
        .from('custos_operacionais')
        .update({
          ativo: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', custo.id)
        .select()

      if (error) {
        console.log(
          'Erro ao alterar status do custo operacional:',
          error
        )

        alert(
          'Não foi possível alterar o status do custo operacional.'
        )
        return
      }

      const custoAtualizado = data?.[0]

      if (!custoAtualizado) {
        alert(
          'O custo operacional não foi retornado após a alteração.'
        )
        return
      }

      setCustos((listaAtual) =>
        listaAtual.map((item) =>
          item.id === custo.id
            ? custoAtualizado
            : item
        )
      )
    } catch (error) {
      console.log(
        'Erro ao alterar status do custo operacional:',
        error
      )

      alert(
        'Não foi possível alterar o status do custo operacional.'
      )
    } finally {
      setAlterandoStatusId(null)
    }
  }

  const buscaNormalizada = busca
    .trim()
    .toLowerCase()

  const custosFiltrados = custos.filter(
    (custo) =>
      String(custo.nome || '')
        .toLowerCase()
        .includes(buscaNormalizada)
  )

  const custosAtivos = custos.filter(
    (custo) => custo.ativo
  )

  const totalMensalAtivo = custosAtivos.reduce(
    (total, custo) =>
      total + Number(custo.valor_mensal || 0),
    0
  )

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Custos Operacionais
            </h1>

            <p className="text-gray-500">
              Cadastre os custos mensais utilizados no
              rateio da precificação.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustoEditando(null)
              setOpenModal(true)
            }}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            + Novo Custo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Custos ativos
            </p>

            <p className="text-2xl font-bold text-gray-800 mt-1">
              {custosAtivos.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Custos cadastrados ativos
            </p>

            <p className="text-2xl font-bold text-gray-800 mt-1">
              {formatarMoeda(totalMensalAtivo)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Sacolas — estimativa mensal derivada</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {resumoSacolas?.custoMensal == null ? '—' : formatarMoeda(resumoSacolas.custoMensal)}
            </p>
            {resumoSacolas && (
              <p className="text-xs text-gray-500 mt-2">
                {resumoSacolas.configuracao?.estimativa_pedidos_mes ?? 0} pedidos × {resumoSacolas.configuracao?.quantidade_sacolas_por_pedido ?? 0} sacola(s) × {formatarMoeda(resumoSacolas.custoUnitario)}
              </p>
            )}
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-300">Total mensal para Precificação</p>
            <p className="text-2xl font-bold text-white mt-1">
              {resumoSacolas?.custoMensal == null ? '—' : formatarMoeda(totalMensalAtivo + resumoSacolas.custoMensal)}
            </p>
          </div>
        </div>
        {erroSacolas && <p role="alert" className="text-amber-700 mb-6">{erroSacolas}</p>}

        <div className="mb-6">
          <div className="relative w-full md:w-96">
            <span
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            >
              🔍
            </span>

            <input
              type="text"
              placeholder="Buscar custo operacional..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full border rounded-xl pl-11 pr-4 py-3"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-gray-600">
                    Custo
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Valor mensal
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Status
                  </th>

                  <th className="text-left p-4 text-gray-600">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-gray-500"
                    >
                      Carregando custos operacionais...
                    </td>
                  </tr>
                ) : custosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-gray-500"
                    >
                      {buscaNormalizada
                        ? 'Nenhum custo operacional encontrado.'
                        : 'Nenhum custo operacional cadastrado.'}
                    </td>
                  </tr>
                ) : (
                  custosFiltrados.map((custo) => (
                    <tr
                      key={custo.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium text-gray-800">
                        {custo.nome}
                      </td>

                      <td className="p-4">
                        {formatarMoeda(
                          custo.valor_mensal
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            custo.ativo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {custo.ativo
                            ? 'Ativo'
                            : 'Inativo'}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              editarCusto(custo)
                            }
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              alterarStatus(custo)
                            }
                            disabled={
                              alterandoStatusId ===
                              custo.id
                            }
                            className={`disabled:opacity-50 ${
                              custo.ativo
                                ? 'text-red-600 hover:text-red-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {alterandoStatusId ===
                            custo.id
                              ? 'Alterando...'
                              : custo.ativo
                                ? 'Inativar'
                                : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          O total considerado na Precificação inclui{' '}
          {resumoSacolas?.custoMensal == null ? 'a parcela de sacolas ainda indisponível' : formatarMoeda(resumoSacolas.custoMensal)}
          /mês referentes à estimativa de sacolas, calculada a partir da sacola padrão,
          da quantidade por pedido e da estimativa mensal de pedidos. A sacola não é
          cadastrada como linha manual. Mudanças de custo não alteram o Preço Final.
        </div>

        <CustoOperacionalModal
          open={openModal}
          onClose={() => {
            setOpenModal(false)
            setCustoEditando(null)
          }}
          onSave={salvarCusto}
          custo={custoEditando}
        />
      </main>
    </div>
  )
}
