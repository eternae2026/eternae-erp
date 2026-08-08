import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Sidebar() {
  const router = useRouter()

  const estaNoEstoque =
    router.pathname.startsWith('/estoque')

  const estaNoFinanceiro =
    router.pathname.startsWith('/financeiro')

  const [estoqueAberto, setEstoqueAberto] =
    useState(estaNoEstoque)

  const [financeiroAberto, setFinanceiroAberto] =
    useState(estaNoFinanceiro)

  const [saindo, setSaindo] =
    useState(false)

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

  function classeSubmenu(caminho) {
    return `
      px-3 py-2
      rounded-lg
      text-sm
      transition
      ${
        linkAtivo(caminho)
          ? 'bg-gray-800 text-white font-semibold'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }
    `
  }

  async function sair() {
    if (saindo) return

    try {
      setSaindo(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error(
          'Erro ao encerrar sessão:',
          error
        )

        alert(
          'Não foi possível encerrar a sessão. Tente novamente.'
        )

        return
      }

      router.replace('/login')
    } catch (error) {
      console.error(
        'Erro ao encerrar sessão:',
        error
      )

      alert(
        'Não foi possível encerrar a sessão. Tente novamente.'
      )
    } finally {
      setSaindo(false)
    }
  }

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 min-h-screen shrink-0">
      <h1 className="text-2xl font-bold mb-10">
        Eternae ERP
      </h1>

      <nav className="flex flex-col gap-2">
        <Link
          href="/"
          className={classeLink('/')}
        >
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

        <div className="mt-1">
          <button
            type="button"
            onClick={() =>
              setEstoqueAberto(
                !estoqueAberto
              )
            }
            className={`
              w-full
              flex items-center justify-between
              px-3 py-2
              rounded-xl
              transition
              ${
                estaNoEstoque
                  ? 'bg-gray-800 text-white font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <span>📦 Estoque</span>

            <span className="text-xs">
              {estoqueAberto ? '▲' : '▼'}
            </span>
          </button>

          {estoqueAberto && (
            <div className="mt-2 ml-4 pl-3 border-l border-gray-700 flex flex-col gap-1">
              <Link
                href="/estoque"
                className={classeSubmenu(
                  '/estoque'
                )}
              >
                📦 Controle de Estoque
              </Link>

              <Link
                href="/estoque/movimentacoes"
                className={classeSubmenu(
                  '/estoque/movimentacoes'
                )}
              >
                🔄 Histórico de Movimentações
              </Link>
            </div>
          )}
        </div>

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
              setFinanceiroAberto(
                !financeiroAberto
              )
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
                href="/financeiro/dashboard"
                className={classeSubmenu(
                  '/financeiro/dashboard'
                )}
              >
                📊 Dashboard Financeiro
              </Link>

              <Link
                href="/financeiro"
                className={classeSubmenu(
                  '/financeiro'
                )}
              >
                📋 Fluxo de Caixa
              </Link>

              <Link
                href="/financeiro/receber"
                className={classeSubmenu(
                  '/financeiro/receber'
                )}
              >
                💰 Contas a Receber
              </Link>

              <Link
                href="/financeiro/pagar"
                className={classeSubmenu(
                  '/financeiro/pagar'
                )}
              >
                🧾 Contas a Pagar
              </Link>

              <Link
                href="/financeiro/dre"
                className={classeSubmenu(
                  '/financeiro/dre'
                )}
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
          className={classeLink(
            '/configuracoes'
          )}
        >
          ⚙️ Configurações
        </Link>

        <div className="mt-6 pt-5 border-t border-gray-700">
          <button
            type="button"
            onClick={sair}
            disabled={saindo}
            className="
              w-full
              flex items-center
              px-3 py-2
              rounded-xl
              text-gray-300
              hover:bg-red-900/40
              hover:text-white
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {saindo
              ? '⏳ Saindo...'
              : '🚪 Sair'}
          </button>
        </div>
      </nav>
    </aside>
  )
}