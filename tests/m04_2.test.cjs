const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const helper = read('lib/sacolasV2.js')
const trecho = helper.match(/export function calcularCustoMensalSacolas\([^]*?\n}/)?.[0]
assert.ok(trecho, 'helper econômico da sacola presente')
const calcular = vm.runInNewContext(
  trecho.replace('export function ', 'function ') + '\ncalcularCustoMensalSacolas'
)

assert.equal(calcular(0, 1, 1), 0)
assert.equal(calcular(30, 1, 1), 30)
assert.equal(calcular(30, 2, 1), 60)
assert.equal(calcular(30, 1, 1.5), 45)
assert.equal(calcular(-1, 1, 1), null)
assert.equal(900 + calcular(30, 1, 1), 930)

const previaFonte = read('lib/previaPrecificacaoV2.js')
const previaTrecho = previaFonte.match(/export function calcularPreviaPrecificacaoV2\([^]*?\n}/)?.[0]
assert.ok(previaTrecho)
const calcularPrevia = vm.runInNewContext(
  previaTrecho.replace('export function ', 'function ') + '\ncalcularPreviaPrecificacaoV2'
)
const parametros = {
  valor_hora: 17.32,
  custo_operacional_por_hora: 5.37,
  custo_embalagem_avulsa: 1.2
}
const itens = [{ estoque_id: 'insumo', quantidade: 1 }]
const estoque = [{ id: 'insumo', custo_unitario: 11 }]
const comEmbalagem = calcularPrevia(parametros, itens, estoque, 60, false)
const semEmbalagem = calcularPrevia(parametros, itens, estoque, 60, true)
assert.equal(comEmbalagem.producao, semEmbalagem.producao)
assert.equal(comEmbalagem.operacional, semEmbalagem.operacional)
assert.equal(semEmbalagem.embalagem, 0)
assert.ok(Math.abs(comEmbalagem.venda - semEmbalagem.venda - 1.2) < 1e-10)
assert.ok(Math.abs(comEmbalagem.ficha + comEmbalagem.maoObra +
  comEmbalagem.operacional - comEmbalagem.producao) < 1e-10)
estoque[0].custo_unitario = 12
assert.equal(calcularPrevia(parametros, itens, estoque, 60, false).venda,
  comEmbalagem.venda + 1)

const migration = read('migrations/006_correcao_precificacao_m04_2.sql')
assert.ok(migration.includes("COALESCE(v_categoria, ''::text)"))
assert.ok(!migration.includes('pg_catalog.coalesce'))
assert.ok(migration.includes('pg_advisory_xact_lock'))
assert.ok(migration.includes('FOR UPDATE'))
assert.ok(migration.includes('calcular_custo_atual_produto(p_produto_id)'))
assert.ok(migration.includes('produto_embalagens'))
assert.ok(migration.includes('Remova a associação explicitamente'))
assert.ok(migration.includes('requisicao_confirmacao IS DISTINCT FROM v_solicitacao'))
assert.ok(migration.includes('REVOKE ALL ON FUNCTION public.confirmar_precificacao_v2'))

const calc = read('migrations/005_precificacao_produtos_historico_m04.sql')
assert.ok(calc.includes('WHERE ativo = true'))
assert.ok(calc.includes('o.total + (c.pedidos_mes * c.sacolas_pedido * s.custo_unitario)'))
assert.ok(calc.includes('WHEN sem_embalagem THEN 0 ELSE embalagem END'))

const drawer = read('components/PrecificacaoDrawer.js')
const report = read('pages/relatorios/precificacao.js')
const generalReport = read('pages/relatorios/index.js')
assert.ok(drawer.includes('calcularPreviaPrecificacaoV2('))
assert.ok(previaFonte.includes('Number(calculo.custo_operacional_por_hora)'))
assert.ok(previaFonte.includes('const embalagem = semEmbalagem ? 0'))
assert.ok(report.includes('obterCustoAtualProduto(produto.id)'))
assert.ok(generalReport.includes('obterCustoAtualProduto(produto.id)'))
for (const content of [drawer, report, generalReport]) {
  assert.ok(!/Saudável|Reduzida|Crítica|statusMargemProduto/.test(content))
}
console.log('M04.2: testes locais de regra da sacola e verificações estáticas passaram.')
