const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const sql006 = read('migrations/006_correcao_precificacao_m04_2.sql')
const sql007 = read('migrations/007_protecao_embalagem_precificacao_m04_final.sql')
const drawer = read('components/PrecificacaoDrawer.js')
const config = read('pages/configuracoes/index.js')
const costConfig = read('pages/configuracoes/custos-operacionais.js')
const costs = read('pages/precificacao/custos-operacionais.js')
const report = read('pages/relatorios/precificacao.js')
const generalReport = read('pages/relatorios/index.js')

const functionBody = sql => sql.match(/CREATE OR REPLACE FUNCTION public\.confirmar_precificacao_v2\([\s\S]*?\n\$\$;/)?.[0]
assert.ok(functionBody(sql006))
assert.ok(functionBody(sql007))
const newGuard = `    IF NOT COALESCE(p_sem_embalagem, v_produto.sem_embalagem_avulsa)
       AND NOT EXISTS (
           SELECT 1 FROM public.produto_embalagens
           WHERE produto_id = p_produto_id
       ) THEN
        RAISE EXCEPTION 'Configure uma embalagem avulsa ou informe que este produto é deliberadamente vendido sem embalagem.';
    END IF;

`
assert.ok(functionBody(sql007).includes(newGuard))
const restored = functionBody(sql007)
  .replace(newGuard, '')
  .replace('O produto possui embalagem associada.', 'O produto possui embalagem M03 associada.')
assert.equal(restored, functionBody(sql006), 'A RPC 007 só pode acrescentar a proteção e ajustar a mensagem existente.')
assert.ok(sql007.includes('FROM PUBLIC, anon;'))
assert.ok(sql007.includes('TO authenticated;'))
assert.ok(sql007.indexOf(newGuard) < sql007.indexOf('DELETE FROM public.produto_composicao'))

// Quatro estados de embalagem; é uma verificação lógica local, não um teste integrado da RPC.
const permitido = (associada, deliberadamenteSem) => associada !== deliberadamenteSem
assert.equal(permitido(true, false), true)
assert.equal(permitido(false, true), true)
assert.equal(permitido(false, false), false)
assert.equal(permitido(true, true), false)
assert.ok(drawer.includes('if (semEmbalagemEdicao && calculoAtual.embalagem_configurada)'))
assert.ok(drawer.includes('if (!semEmbalagemEdicao && !calculoAtual.embalagem_configurada)'))
assert.ok(drawer.includes('Configure uma embalagem avulsa ou informe que este produto é deliberadamente vendido sem embalagem.'))

const blockC = drawer.slice(drawer.indexOf('C. Formação do Preço'), drawer.indexOf('D. Última Precificação'))
const blockD = drawer.slice(drawer.indexOf('D. Última Precificação'))
assert.ok(blockC.includes('Preço Final'))
assert.ok(blockD.includes('Preço Final:'))
assert.ok(!blockD.includes('Preço Oficial Atual:'))
for (const page of [report, generalReport]) {
  assert.ok(page.includes("'Preço Final'"))
  assert.ok(!page.includes("'Preço Oficial Atual'"))
  assert.ok(page.includes('obterCustoAtualProduto'))
}
assert.ok(!report.includes('preço oficial'))
assert.ok(costs.includes('A sacola não é'))
assert.ok(!costs.includes('Precificação V2'))
assert.ok(!costConfig.includes('Embalagem Avulsa M03'))
assert.ok(!config.includes('Caixa MDF personalizada'))

const policy = config.slice(config.indexOf('Política comercial'), config.indexOf('Política comercial') + 8000)
assert.ok(policy.includes('Taxa do cartão (%)'))
assert.ok(policy.includes('Forma de pagamento padrão'))
assert.ok(policy.includes('Validade padrão do orçamento'))
assert.ok(!policy.includes('Desconto PIX automático'))
assert.ok(!policy.includes('Mostrar desconto PIX'))
assert.ok(config.includes('setDescontoPixAutomatico(config.desconto_pix_automatico ?? true)'))
assert.ok(config.includes('setMostrarDescontoPix(config.mostrar_desconto_pix_orcamento ?? true)'))
assert.ok(config.includes('desconto_pix_automatico: descontoPixAutomatico'))
assert.ok(config.includes('mostrar_desconto_pix_orcamento: mostrarDescontoPix'))

console.log('M04 final: proteção de embalagem, preservação da RPC e verificações de interface passaram.')
