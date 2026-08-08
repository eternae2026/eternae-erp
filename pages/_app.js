import '../styles/globals.css'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  const [sessao, setSessao] = useState(null)
  const [carregandoSessao, setCarregandoSessao] = useState(true)

  const paginaPublica = router.pathname === '/login'

  useEffect(() => {
    let ativo = true

    async function carregarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!ativo) return

      setSessao(session)
      setCarregandoSessao(false)

      if (!session && router.pathname !== '/login') {
        router.replace('/login')
        return
      }

      if (session && router.pathname === '/login') {
        router.replace('/')
      }
    }

    carregarSessao()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ativo) return

      setSessao(session)
      setCarregandoSessao(false)

      if (!session && router.pathname !== '/login') {
        router.replace('/login')
      }

      if (session && router.pathname === '/login') {
        router.replace('/')
      }
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [router.pathname])

  if (carregandoSessao && !paginaPublica) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-sm px-8 py-6 text-center">
          <div className="text-lg font-semibold text-gray-900">
            Eternaê ERP
          </div>

          <div className="mt-2 text-sm text-gray-500">
            Verificando acesso...
          </div>
        </div>
      </div>
    )
  }

  if (!sessao && !paginaPublica) {
    return null
  }

  return <Component {...pageProps} />
}