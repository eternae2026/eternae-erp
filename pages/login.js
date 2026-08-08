import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function entrar(event) {
    event.preventDefault()

    if (!email.trim() || !senha) {
      setErro('Informe seu e-mail e sua senha.')
      return
    }

    try {
      setCarregando(true)
      setErro('')

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      })

      if (error) {
        setErro('E-mail ou senha inválidos.')
        return
      }

      router.replace('/')
    } catch (error) {
      console.error(error)
      setErro('Não foi possível realizar o acesso. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="text-sm font-medium text-gray-500">
              Eternaê
            </div>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              ERP
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          <form
            onSubmit={entrar}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="seu@email.com"
                className="
                  w-full
                  rounded-xl
                  border border-gray-300
                  px-4 py-3
                  text-gray-900
                  outline-none
                  transition
                  focus:border-gray-900
                  focus:ring-1
                  focus:ring-gray-900
                "
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Senha
              </label>

              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                placeholder="Sua senha"
                className="
                  w-full
                  rounded-xl
                  border border-gray-300
                  px-4 py-3
                  text-gray-900
                  outline-none
                  transition
                  focus:border-gray-900
                  focus:ring-1
                  focus:ring-gray-900
                "
              />
            </div>

            {erro && (
              <div
                className="
                  rounded-xl
                  border border-red-200
                  bg-red-50
                  px-4 py-3
                  text-sm
                  text-red-700
                "
              >
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="
                w-full
                rounded-xl
                bg-gray-900
                px-4 py-3
                font-semibold
                text-white
                transition
                hover:bg-gray-800
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {carregando
                ? 'Entrando...'
                : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-100 pt-5 text-center">
            <p className="text-xs text-gray-400">
              Acesso restrito ao ERP Eternaê.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}