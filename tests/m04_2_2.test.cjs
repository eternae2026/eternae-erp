const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const page = read('pages/precificacao/index.js')
const drawer = read('components/PrecificacaoDrawer.js')
const report = read('pages/relatorios/precificacao.js')
const generalReport = read('pages/relatorios/index.js')

// O resultado vazio só é considerado uma ficha vazia depois da consulta concluída.
assert.ok(page.includes("setComposicaoCarregadaPara(String(produtoSelecionadoId))"))
assert.ok(page.includes('if (!ativo) return'))
assert.ok(page.includes("setComposicaoCarregadaPara('')"))
assert.ok(page.includes('composicaoPronta={Boolean(produtoSelecionado?.id)'))
assert.ok(drawer.includes('Carregando Ficha Técnica...'))
assert.ok(drawer.includes('(!modoNovoCadastro && composicaoPronta)'))

// O primeiro clique clona a ficha carregada; não a cópia vazia da abertura.
const abrir = drawer.slice(0, drawer.indexOf('function iniciarEdicao()'))
assert.ok(!abrir.includes('setInsumosEdicao(composicao.map('))
const iniciar = drawer.slice(drawer.indexOf('function iniciarEdicao()'),
  drawer.indexOf('async function selecionarProdutoParaNovaPrecificacao'))
assert.ok(iniciar.includes('if (!consultaProntaParaEdicao) return'))
assert.ok(iniciar.includes('setInsumosEdicao(composicao.map('))
assert.ok(iniciar.indexOf('setInsumosEdicao(') < iniciar.indexOf('setModoEdicao(true)'))
assert.ok(drawer.includes('disabled={!consultaProntaParaEdicao}'))

// Seleção no fluxo de nova precificação aguarda ficha e custo do mesmo produto.
const nova = drawer.slice(drawer.indexOf('async function selecionarProdutoParaNovaPrecificacao'),
  drawer.indexOf('async function salvarAlteracoes'))
assert.ok(nova.includes('await Promise.all(['))
assert.ok(nova.includes('obterCustoAtualProduto(id)'))
assert.ok(nova.includes('fichaConfereComCalculo(data || [], calculo, id)'))
assert.ok(nova.lastIndexOf('setInsumosEdicao(') < nova.lastIndexOf('setModoEdicao(true)'))
assert.ok(drawer.includes('edicaoInicializadaPara !== String(produtoId)'))
assert.ok(drawer.includes('!calculoProntoParaProduto'))

const blocoC = drawer.slice(drawer.indexOf('C. Formação do Preço'),
  drawer.indexOf('D. Última Precificação'))
for (const rotulo of ['Margem Desejada', 'Preço Sugerido', 'Preço Final', 'Margem Real']) {
  assert.ok(blocoC.includes(rotulo))
}
assert.ok(!blocoC.includes('Preço-base Sugerido'))
assert.ok(!blocoC.includes('Preço Oficial Sugerido'))
assert.ok(!blocoC.includes('Preço Final Oficial'))
assert.ok(blocoC.includes("['Preço Sugerido', formatarMoeda(precoCartao())]"))
assert.ok(blocoC.includes('value={precoFinal}'))
assert.ok(blocoC.includes('margemReal(precoFinal)'))
assert.ok(blocoC.includes('calculoAtual?.taxa_cartao'))
assert.ok(drawer.includes('return divisor > 0 ? custoTotalProduto() / divisor : null'))
assert.ok(drawer.includes('return divisor > 0 ? precoSugerido() / divisor : null'))
assert.ok(drawer.includes('Ainda não há histórico para comparação.'))

for (const antigo of [
  'A Embalagem Avulsa M03 aparece separadamente',
  'Custo de Produção + Embalagem Avulsa M03',
  'Embalagem Avulsa ainda não configurada no M03',
  'Precificação V2 confirmada',
  'Primeira precificação V2',
  'Na última Precificação V2'
]) assert.ok(!drawer.includes(antigo))
assert.ok(!report.includes('Custo atual V2'))
assert.ok(!report.includes('custo econômico V2'))
assert.ok(!generalReport.includes('Custo econômico V2 indisponível'))
console.log('M04.2.2: verificações locais de carregamento, proteção e linguagem passaram.')
