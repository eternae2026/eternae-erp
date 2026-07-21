import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Sidebar() {
  const router = useRouter()

  const estaNoFinanceiro = router.pathname.startsWith('/financeiro')

  const [financeiroAberto, setFinanceiroAberto] = useState(
    estaNoFinanceiro
  )

  function linkAtivo(caminho) {
    return router.pathname === caminho
  }

  function classeLink(caminho) {
    return `
      flex items-center
      px-3 py-2
      rounded-xl
      transition
      ${
        linkAtivo(caminho)
          ? 'bg-gray-800 text-white font-semibold'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }
    `
  }

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 min-h-screen">
      <h1 className="text-2xl font-bold mb-10">
        Eternae ERP
      </h1>

      <nav className="flex flex-col gap-2">
        <Link href="/" className={classeLink('/')}>
          🏠 Dashboard
        </Link>

        <Link
          href="/clientes"
          className={classeLink('/clientes')}
        >
          👥 Clientes
        </Link>

        <Link
          href="/produtos"
          className={classeLink('/produtos')}
        >
          🛍️ Produtos
        </Link>

        <Link
          href="/orcamentos"
          className={classeLink('/orcamentos')}
        >
          📄 Orçamentos
        </Link>

        <Link
          href="/pedidos"
          className={classeLink('/pedidos')}
        >
          📦 Pedidos
        </Link>

        <Link
          href="/producao"
          className={classeLink('/producao')}
        >
          🏭 Produção
        </Link>

        <Link
          href="/estoque"
          className={classeLink('/estoque')}
        >
          📦 Estoque
        </Link>

        <Link
          href="/precificacao"
          className={classeLink('/precificacao')}
        >
          💰 Precificação
        </Link>

        <Link
          href="/metas"
          className={classeLink('/metas')}
        >
          🎯 Metas
        </Link>

        <Link
          href="/kits"
          className={classeLink('/kits')}
        >
          🎁 Kits
        </Link>

        <div className="mt-1">
          <button
            type="button"
            onClick={() =>
              setFinanceiroAberto(!financeiroAberto)
            }
            className={`
              w-full
              flex items-center justify-between
              px-3 py-2
              rounded-xl
              transition
              ${
                estaNoFinanceiro
                  ? 'bg-gray-800 text-white font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <span>💳 Financeiro</span>

            <span className="text-xs">
              {financeiroAberto ? '▲' : '▼'}
            </span>
          </button>

          {financeiroAberto && (
            <div className="mt-2 ml-4 pl-3 border-l border-gray-700 flex flex-col gap-1">
              <Link
                href="/financeiro"
                className={`
                  px-3 py-2
                  rounded-lg
                  text-sm
                  transition
                  ${
                    linkAtivo('/financeiro')
                      ? 'bg-gray-800 text-white font-semibold'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                📋 Fluxo de Caixa
              </Link>

              <Link
                href="/financeiro/receber"
                className={`
                  px-3 py-2
                  rounded-lg
                  text-sm
                  transition
                  ${
                    linkAtivo('/financeiro/receber')
                      ? 'bg-gray-800 text-white font-semibold'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                💰 Contas a Receber
              </Link>

              <Link
                href="/financeiro/pagar"
                className={`
                  px-3 py-2
                  rounded-lg
                  text-sm
                  transition
                  ${
                    linkAtivo('/financeiro/pagar')
                      ? 'bg-gray-800 text-white font-semibold'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                🧾 Contas a Pagar
              </Link>

              <Link
                href="/financeiro/dre"
                className={`
                  px-3 py-2
                  rounded-lg
                  text-sm
                  transition
                  ${
                    linkAtivo('/financeiro/dre')
                      ? 'bg-gray-800 text-white font-semibold'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                📊 DRE
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/relatorios"
          className={classeLink('/relatorios')}
        >
          📊 Relatórios
        </Link>

        <Link
          href="/configuracoes"
          className={classeLink('/configuracoes')}
        >
          ⚙️ Configurações
        </Link>
      </nav>
    </aside>
  )
}