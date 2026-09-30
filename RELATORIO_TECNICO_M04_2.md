# ERP Eternaê V2 — Relatório Técnico M04.2

## Base e fronteira

Correção incremental sobre o pacote M04.1 produzido anteriormente. A base oficial original continua sendo a branch declarada `desenvolvimento-v2`, commit `7cc656d`, sem metadados Git no ZIP recebido. A migration 005 do pacote M04.1 foi informada como instalada no teste integrado; ela permanece **inalterada** neste pacote. Nenhuma migration foi executada por este trabalho. Não houve acesso ao Supabase, deploy, commit, push nem alteração de arquivos de ambiente. M05 e módulos posteriores não foram implementados.

## Auditoria e causa do defeito crítico

A RPC `confirmar_precificacao_v2` da 005 validava a categoria da Ficha Técnica com `pg_catalog.coalesce(v_categoria, '')`. `COALESCE` é uma expressão SQL especial, não uma função invocável com qualificação de esquema. Por isso a primeira confirmação falhava com `function pg_catalog.coalesce(text, unknown) does not exist`, antes de criar o snapshot.

A migration incremental `006_correcao_precificacao_m04_2.sql` substitui **somente a definição dessa RPC**, usando `COALESCE(v_categoria, ''::text)`. Mantém a autenticação, a chave `p_operacao_id`, o advisory lock por operação, o lock `FOR UPDATE` do produto, a verificação do payload repetido, o recálculo em `calcular_custo_atual_produto`, a atualização de `preco`, `preco_final`, `margem_lucro`, `tempo_producao` e Ficha Técnica, a gravação do snapshot e seus componentes na mesma transação, e os privilégios restritos a `authenticated`. A 006 não recria tabelas, não faz backfill e não modifica snapshots anteriores.

Foi acrescentada à RPC uma validação: se a confirmação solicita `sem_embalagem_avulsa` e existe associação em `produto_embalagens`, a transação é rejeitada com orientação para remover explicitamente a associação M03. Não há exclusão automática. A prévia local pode mostrar o impacto sem embalagem, mas ela não persiste esse estado contraditório.

## Fonte econômica e interface

`calcular_custo_atual_produto`, instalado na 005, segue sendo a fonte de custo atual para o drawer e para os dois relatórios de Precificação. O relatório específico não usa mais fórmula legada quando a RPC falha: apresenta erro explícito. A seção de Precificação do relatório geral também passou a ler a RPC, deixou de calcular custo independente e removeu `Saudável/Reduzida/Crítica` e os limiares arbitrários. As demais seções do relatório geral não foram refatoradas.

O drawer agora apresenta, nesta ordem: A. Ficha Técnica + Mão de Obra + Custos Operacionais = Custo de Produção; B. Custo de Produção + Embalagem Avulsa = Custo para Venda Avulsa; C. Margem Desejada, sugestões, Preço Final Oficial e Margem Real; D. comparação entre último snapshot V2 e custo atual. Antes da primeira confirmação, mostra que ainda não há histórico. O preço oficial é apresentado separadamente do custo atual e não é modificado por simples mudança de custo.

A prévia **não persistida** dos campos em edição usa os valores-hora operacional e de mão de obra fornecidos pela RPC, os custos atuais do Estoque e a composição M03 que a RPC devolve. A confirmação é sempre recalculada no banco; os totais enviados ou mostrados pelo navegador não substituem esse recálculo. Na prévia, `sem embalagem` zera somente a Embalagem Avulsa; Ficha Técnica, Mão de Obra, Custos Operacionais e parcela de sacolas permanecem. A interface e a RPC bloqueiam a confirmação contraditória quando há embalagem M03 associada.

## Sacola

A fórmula permanece: estimativa de pedidos/mês × quantidade padrão de sacolas por pedido × custo unitário atual do item associado por `sacola_estoque_id`. A função econômica central da 005 incorpora essa parcela ao custo operacional mensal, rateado por hora, **sem** adicioná-la diretamente à Embalagem Avulsa ou criar linha CRUD em `custos_operacionais`. A tela M02 apresenta separadamente custos ativos cadastrados, parcela derivada de sacolas e total mensal considerado no rateio, com explicação e valor dinâmico.

Em Configurações gerais, o bloco reúne seletor do item de Estoque da sacola padrão (mesmo campo M03), quantidade padrão, estimativa manual de pedidos, custo unitário atual e custo mensal estimado. O seletor usa itens ativos da categoria embalagem, como o M03. Os textos que prometiam baixa automática foram removidos das telas de Configurações diretamente ligadas ao escopo. A baixa física não foi implementada. O valor monetário global legado de embalagem permanece salvo e identificado como **não utilizado pela Precificação V2**.

## Estruturas de banco, segurança e compatibilidade

Nenhuma tabela ou coluna nova foi necessária no M04.2. A única mudança de banco proposta é `CREATE OR REPLACE FUNCTION public.confirmar_precificacao_v2(...)` na 006, com assinatura e privilégios existentes. A fonte de custo atual, as tabelas `precificacoes_v2` e `precificacoes_v2_componentes`, RLS, triggers de imutabilidade, `UNIQUE(operacao_id)` e campos legados são preservados. A 006 não deve ser confundida com um comando já executado; é um artefato para instalação controlada posterior.

## Arquivos criados

- `migrations/006_correcao_precificacao_m04_2.sql`
- `lib/sacolasV2.js`
- `lib/previaPrecificacaoV2.js`
- `tests/m04_2.test.cjs`
- `RELATORIO_TECNICO_M04_2.md`

## Arquivos alterados

- `components/PrecificacaoDrawer.js`
- `pages/configuracoes/index.js`
- `pages/configuracoes/custos-operacionais.js`
- `pages/precificacao/custos-operacionais.js`
- `pages/relatorios/index.js`
- `pages/relatorios/precificacao.js`

A comparação de conteúdo com o ZIP M04.1 confirmou a 005 inalterada. Arquivos locais gerados pela instalação/build (`node_modules`, `.next`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`) não fazem parte da entrega.

## Testes locais executados

- `next build`: sucesso; compilação, lint/checagem integrada do Next e geração das **26/26 páginas**. O webpack emitiu apenas aviso de cache (`Unable to snapshot resolve dependencies`), sem falha de build. Não existe script de lint independente no `package.json`; nenhuma configuração nova foi criada.
- `node tests/m04_2.test.cjs`: passou. Testou 0 pedido; 30 × 1 × R$ 1,00 = R$ 30,00; 900 + 30 = R$ 930,00; alteração de quantidade e custo unitário; valor negativo inválido; prévia com embalagem e sem embalagem mantendo idêntico Custo de Produção e custo operacional; mudança de custo de componente alterando o custo da prévia.
- Verificações estáticas no mesmo teste: somente custos operacionais ativos na SQL central, parcela de sacola incorporada uma vez, `COALESCE` corrigido na 006, manutenção de locks/idempotência/recálculo e ausência de classificações arbitrárias nos arquivos de Precificação V2.
- O build confirmou a compilação das páginas M02, M03, Configurações, Precificação e Relatórios. Não houve teste visual automatizado nem manipulação de dados reais.

## Pendências de teste integrado após instalação da 006

Não há banco local representativo autorizado. Permanecem **pendentes de teste integrado após instalação controlada**, sem alegação de sucesso:

1. Primeira confirmação V2 em banco com a 005 já instalada; criação de preço e snapshot na mesma transação.
2. Segunda confirmação; preservação e imutabilidade do primeiro snapshot.
3. Repetição da mesma `p_operacao_id`; retorno idempotente sem duplicação; payload diferente rejeitado.
4. Falha induzida na gravação do snapshot; rollback do preço e da Ficha Técnica.
5. Rejeição server-side de `sem embalagem` quando houver associação M03, e confirmação após resolução explícita.
6. Consulta com custos reais de sacola/estoque/configuração e confronto entre drawer, Custos Operacionais e relatórios.
7. RLS/privilégios de leitura e imutabilidade de histórico sob os papéis reais do ambiente.

Não houve desvio funcional deliberado da Ordem M04.2. O pacote está entregue para auditoria e nova rodada de testes; **o M04 não está homologado**.
