import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white p-6 min-h-screen">

      <h1 className="text-2xl font-bold mb-10">
        Eternae ERP
      </h1>

      <nav className="flex flex-col gap-4 text-gray-300">

        <Link
          href="/"
          className="hover:text-white transition"
        >
          🏠 Dashboard
        </Link>

        <Link
          href="/clientes"
          className="hover:text-white transition"
        >
          👥 Clientes
        </Link>

        <Link
          href="/produtos"
          className="hover:text-white transition"
        >
          🛍️ Produtos
        </Link>

        <Link
          href="/orcamentos"
          className="hover:text-white transition"
        >
          📄 Orçamentos
        </Link>

        <Link
          href="/pedidos"
          className="hover:text-white transition"
        >
          📦 Pedidos
        </Link>

        <Link
          href="/producoes"
          className="hover:text-white transition"
        >
          🏭 Produção
        </Link>

        <Link
          href="/estoque"
          className="hover:text-white transition"
        >
          📦 Estoque
        </Link>

        <Link
          href="/precificacao"
          className="hover:text-white transition"
       >
          💰 Precificação
        </Link>
       
        <Link
          href="/financeiro"
          className="hover:text-white transition"
        >
          💳 Financeiro
        </Link>

        <Link
          href="/relatorios/precificacao"
          className="hover:text-white transition"
        >
          📊 Relatórios
        </Link>

        <Link
          href="/configuracoes"
          className="hover:text-white transition"
        >
          ⚙️ Configurações
        </Link>

      </nav>

    </aside>
  )
}