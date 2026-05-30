import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [aniversariantes, setAniversariantes] = useState([])

  async function carregarAniversariantes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')

    if (error) {
      console.log('Erro ao carregar aniversariantes:', error)
      return
    }

    const mesAtual = new Date().getMonth() + 1

    const filtrados = (data || []).filter(cliente => {
      if (!cliente.aniversario) return false

      const mesAniversario = Number(cliente.aniversario.split('-')[1])

      return mesAniversario === mesAtual
    })

    setAniversariantes(filtrados)
  }

  useEffect(() => {
    carregarAniversariantes()
  }, [])

  function formatarData(data) {
    if (!data) return '-'

    const [ano, mes, dia] = data.split('-')

    return `${dia}/${mes}`
  }

  function gerarLinkWhatsApp(cliente) {
    if (!cliente.whatsapp) return '#'

    const telefone = cliente.whatsapp.replace(/\D/g, '')

    return `https://wa.me/55${telefone}`
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <main className="flex-1 p-8">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h2>

          <p className="text-gray-500">
            Bem-vinda ao seu sistema de gestão.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Faturamento"
            value="R$ 0,00"
          />

          <StatCard
            title="Lucro"
            value="R$ 0,00"
          />

          <StatCard
            title="Pedidos"
            value="0"
          />

          <StatCard
            title="Meta mensal"
            value="0%"
          />

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl p-8 shadow-sm">

            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Seu negócio está ganhando vida 🚀
            </h3>

            <p className="text-gray-600 leading-relaxed">
              Em breve você terá controle completo de:
              pedidos, clientes, estoque, precificação,
              financeiro e relatórios em um único lugar.
            </p>

          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  🎂 Aniversariantes do mês
                </h3>

                <p className="text-gray-500">
                  Clientes para ações especiais.
                </p>
              </div>

              <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                {aniversariantes.length}
              </span>

            </div>

            {aniversariantes.length === 0 ? (

              <p className="text-gray-500">
                Nenhum aniversariante neste mês.
              </p>

            ) : (

              <div className="space-y-4">

                {aniversariantes.map(cliente => (

                  <div
                    key={cliente.id}
                    className="flex items-center justify-between border rounded-xl p-4"
                  >

                    <div>
                      <p className="font-semibold text-gray-800">
                        {cliente.nome}
                      </p>

                      <p className="text-sm text-gray-500">
                        Aniversário: {formatarData(cliente.aniversario)}
                      </p>
                    </div>

                    {cliente.whatsapp && (
                      <a
                        href={gerarLinkWhatsApp(cliente)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition"
                      >
                        WhatsApp
                      </a>
                    )}

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </main>

    </div>
  )
}