import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CustosOperacionais() {
  const [configuracaoId, setConfiguracaoId] = useState(null)

  const [embalagemPadrao, setEmbalagemPadrao] = useState('')
  const [quantidadeSacolas, setQuantidadeSacolas] = useState('1')

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState('sucesso')

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  async function carregarConfiguracoes() {
    try {
      setCarregando(true)
      setMensagem('')

      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select(`
          id,
          embalagem_padrao,
          quantidade_sacolas_por_pedido
        `)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data) {
        setTipoMensagem('erro')
        setMensagem(
          'Nenhuma configuração foi encontrada. Verifique se o registro inicial foi criado no Supabase.'
        )
        return
      }

      setConfiguracaoId(data.id)
      setEmbalagemPadrao(
        Number(data.embalagem_padrao || 0).toFixed(2).replace('.', ',')
      )
      setQuantidadeSacolas(
        String(data.quantidade_sacolas_por_pedido ?? 1)
      )
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)

      setTipoMensagem('erro')
      setMensagem(
        `Não foi possível carregar as configurações: ${
          error.message || 'erro desconhecido'
        }`
      )
    } finally {
      setCarregando(false)
    }
  }

  function converterMoedaParaNumero(valor) {
    if (typeof valor !== 'string') {
      return Number(valor) || 0
    }

    const valorLimpo = valor
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')

    return Number(valorLimpo) || 0
  }

  function formatarCampoMoeda(valor) {
    const numero = converterMoedaParaNumero(valor)

    return numero.toFixed(2).replace('.', ',')
  }

  async function salvarConfiguracoes(event) {
    event.preventDefault()

    try {
      setMensagem('')

      if (!configuracaoId) {
        setTipoMensagem('erro')
        setMensagem('A configuração do sistema não foi localizada.')
        return
      }

      const custoEmbalagem = converterMoedaParaNumero(embalagemPadrao)
      const numeroSacolas = Number(quantidadeSacolas)

      if (custoEmbalagem < 0) {
        setTipoMensagem('erro')
        setMensagem('O custo da embalagem padrão não pode ser negativo.')
        return
      }

      if (
        !Number.isInteger(numeroSacolas) ||
        numeroSacolas < 0
      ) {
        setTipoMensagem('erro')
        setMensagem(
          'A quantidade de sacolas deve ser um número inteiro igual ou maior que zero.'
        )
        return
      }

      setSalvando(true)

      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({
          embalagem_padrao: custoEmbalagem,
          quantidade_sacolas_por_pedido: numeroSacolas,
          updated_at: new Date().toISOString(),
        })
        .eq('id', configuracaoId)

      if (error) {
        throw error
      }

      setEmbalagemPadrao(
        custoEmbalagem.toFixed(2).replace('.', ',')
      )

      setTipoMensagem('sucesso')
      setMensagem('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)

      setTipoMensagem('erro')
      setMensagem(
        `Não foi possível salvar as configurações: ${
          error.message || 'erro desconhecido'
        }`
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={styles.pagina}>
      <div style={styles.cabecalho}>
        <div>
          <h1 style={styles.titulo}>Custos Operacionais</h1>

          <p style={styles.subtitulo}>
            Configure os custos internos de embalagem utilizados pela Eternaê.
          </p>
        </div>
      </div>

      {carregando ? (
        <div style={styles.card}>
          <p style={styles.textoCarregamento}>
            Carregando configurações...
          </p>
        </div>
      ) : (
        <form onSubmit={salvarConfiguracoes}>
          <div style={styles.card}>
            <div style={styles.tituloCardArea}>
              <div style={styles.iconeCard}>📦</div>

              <div>
                <h2 style={styles.tituloCard}>
                  Embalagens incluídas
                </h2>

                <p style={styles.descricaoCard}>
                  Esses custos entram internamente na formação do preço e não
                  aparecem no orçamento do cliente.
                </p>
              </div>
            </div>

            <div style={styles.divisor} />

            <div style={styles.gradeCampos}>
              <div style={styles.campo}>
                <label
                  htmlFor="embalagemPadrao"
                  style={styles.label}
                >
                  Custo da embalagem padrão
                </label>

                <div style={styles.campoMoeda}>
                  <span style={styles.prefixoMoeda}>R$</span>

                  <input
                    id="embalagemPadrao"
                    type="text"
                    inputMode="decimal"
                    value={embalagemPadrao}
                    onChange={(event) =>
                      setEmbalagemPadrao(event.target.value)
                    }
                    onBlur={() =>
                      setEmbalagemPadrao(
                        formatarCampoMoeda(embalagemPadrao)
                      )
                    }
                    placeholder="0,00"
                    style={styles.inputMoeda}
                  />
                </div>

                <p style={styles.ajuda}>
                  Use como referência o custo da caixa padrão de maior valor.
                  Esse custo será considerado na precificação dos produtos e
                  kits.
                </p>
              </div>

              <div style={styles.campo}>
                <label
                  htmlFor="quantidadeSacolas"
                  style={styles.label}
                >
                  Sacolas automáticas por pedido
                </label>

                <input
                  id="quantidadeSacolas"
                  type="number"
                  min="0"
                  step="1"
                  value={quantidadeSacolas}
                  onChange={(event) =>
                    setQuantidadeSacolas(event.target.value)
                  }
                  style={styles.input}
                />

                <p style={styles.ajuda}>
                  Quantidade padrão baixada do estoque quando o pedido entrar
                  em produção, independentemente do número de produtos.
                </p>
              </div>
            </div>

            <div style={styles.regraResumo}>
              <strong style={styles.regraTitulo}>
                Regra atual do sistema
              </strong>

              <div style={styles.listaRegras}>
                <span>
                  📦 Embalagem padrão: custo interno, sem exibição para o
                  cliente.
                </span>

                <span>
                  🛍 Sacola kraft: baixa automática por pedido, sem exibição
                  para o cliente.
                </span>

                <span>
                  🎁 Embalagem premium: item opcional vendido no orçamento.
                </span>
              </div>
            </div>

            {mensagem && (
              <div
                style={{
                  ...styles.mensagem,
                  ...(tipoMensagem === 'erro'
                    ? styles.mensagemErro
                    : styles.mensagemSucesso),
                }}
              >
                {mensagem}
              </div>
            )}

            <div style={styles.rodape}>
              <button
                type="button"
                onClick={carregarConfiguracoes}
                disabled={salvando}
                style={styles.botaoSecundario}
              >
                Recarregar
              </button>

              <button
                type="submit"
                disabled={salvando}
                style={{
                  ...styles.botaoPrincipal,
                  opacity: salvando ? 0.65 : 1,
                  cursor: salvando ? 'not-allowed' : 'pointer',
                }}
              >
                {salvando
                  ? 'Salvando...'
                  : 'Salvar configurações'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

const styles = {
  pagina: {
    minHeight: '100vh',
    background: '#f4f5f7',
    padding: '24px',
    color: '#101828',
  },

  cabecalho: {
    marginBottom: '24px',
  },

  titulo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#101828',
  },

  subtitulo: {
    margin: '5px 0 0',
    fontSize: '13px',
    color: '#667085',
  },

  card: {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #eaecf0',
    borderRadius: '14px',
    padding: '24px',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
  },

  tituloCardArea: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },

  iconeCard: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#f4f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },

  tituloCard: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#101828',
  },

  descricaoCard: {
    margin: '5px 0 0',
    fontSize: '13px',
    lineHeight: 1.5,
    color: '#667085',
  },

  divisor: {
    height: '1px',
    background: '#eaecf0',
    margin: '22px 0',
  },

  gradeCampos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },

  campo: {
    display: 'flex',
    flexDirection: 'column',
  },

  label: {
    marginBottom: '7px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#344054',
  },

  input: {
    width: '100%',
    height: '42px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    padding: '0 12px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '14px',
    color: '#101828',
    background: '#ffffff',
  },

  campoMoeda: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '42px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#ffffff',
  },

  prefixoMoeda: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    borderRight: '1px solid #d0d5dd',
    background: '#f9fafb',
    fontSize: '14px',
    fontWeight: 600,
    color: '#475467',
  },

  inputMoeda: {
    flex: 1,
    height: '100%',
    border: 'none',
    outline: 'none',
    padding: '0 12px',
    fontSize: '14px',
    color: '#101828',
    boxSizing: 'border-box',
  },

  ajuda: {
    margin: '7px 0 0',
    fontSize: '12px',
    lineHeight: 1.45,
    color: '#667085',
  },

  regraResumo: {
    marginTop: '24px',
    padding: '16px',
    border: '1px solid #d9d6fe',
    borderRadius: '10px',
    background: '#f4f3ff',
  },

  regraTitulo: {
    display: 'block',
    marginBottom: '9px',
    fontSize: '13px',
    color: '#363f72',
  },

  listaRegras: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    fontSize: '12px',
    lineHeight: 1.5,
    color: '#475467',
  },

  mensagem: {
    marginTop: '20px',
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
  },

  mensagemSucesso: {
    color: '#067647',
    background: '#ecfdf3',
    border: '1px solid #abefc6',
  },

  mensagemErro: {
    color: '#b42318',
    background: '#fef3f2',
    border: '1px solid #fecdca',
  },

  rodape: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #eaecf0',
  },

  botaoSecundario: {
    height: '40px',
    padding: '0 16px',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#344054',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  botaoPrincipal: {
    height: '40px',
    padding: '0 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#101828',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
  },

  textoCarregamento: {
    margin: 0,
    fontSize: '14px',
    color: '#667085',
  },
}