# Relatório Técnico M04.1

## Escopo e origem

Correção cirúrgica do pacote M04 entregue anteriormente, sobre a origem declarada `desenvolvimento-v2` / `7cc656d`. O ZIP de origem é um `git archive` sem `.git`; branch e HEAD não foram inferidos localmente. A migration 005 permanece única e foi corrigida no próprio arquivo, pois ainda não foi instalada.

O pacote mantém a separação entre custo atual, snapshot e preço oficial, sem backfill histórico. M02 e M03 seguem como dependências; não houve implementação de M05 ou de módulos posteriores.

## Erros da auditoria e correções

| Erro | Causa confirmada | Correção M04.1 |
|---|---|---|
| 1. Custos operacionais inativos | `ops.total` somava toda a tabela enquanto o JSON filtrava ativos. | A CTE `ops` filtra `ativo = true` antes da soma e da agregação JSON. A parcela mensal estimada de sacolas continua adicionada uma única vez em `ops_total`. |
| 2. Idempotência insuficiente | O bloqueio de múltiplos cliques não identificava retries no banco. | Cada intenção recebe UUID no navegador; `precificacoes_v2.operacao_id` é único e a requisição normalizada é preservada em `requisicao_confirmacao`. A RPC retorna o mesmo snapshot para a mesma chave, usuário e conteúdo; rejeita reuso incompatível. |
| 3. Concorrência | A confirmação transacional não bloqueava o produto. | A RPC serializa chaves iguais por advisory lock transacional e bloqueia `produtos.id` com `FOR UPDATE` antes de substituir a ficha, atualizar preço e criar snapshot. Produtos distintos não compartilham bloqueio de linha. |
| 4. Componentes enviados | A RPC anterior filtrava silenciosamente entradas incompletas e não verificava duplicatas nem existência do Estoque. | A RPC valida que a composição é um array não vazio de objetos com UUID e quantidade numérica positiva; verifica existência do item, custo atual válido, duplicatas, categoria embalagem, sobreposição com componentes M03 e sacola padrão. Só depois substitui a ficha. Custos monetários vêm do Estoque e da função central, nunca do JSON do cliente. |
| 5. Limite arbitrário de margem | `pages/relatorios/precificacao.js` classificava margens com limite fixo de 75% da margem desejada. | Foram removidos o limite, os rótulos de saúde/criticidade e o contador de produtos em atenção. O relatório conserva os valores objetivos de custo, preço, lucro e margem. |

## Arquivos alterados

- `migrations/005_precificacao_produtos_historico_m04.sql`
- `lib/precificacaoV2.js`
- `components/PrecificacaoDrawer.js`
- `pages/relatorios/precificacao.js`
- `RELATORIO_TECNICO_M04.md` — nota de atualização das limitações corrigidas.

Arquivo criado: `RELATORIO_TECNICO_M04_1.md`.

## Migration 005 consolidada

Foi acrescentada à tabela de snapshots uma chave `operacao_id uuid NOT NULL UNIQUE` e o JSONB `requisicao_confirmacao` para comparar o conteúdo e o usuário no retry. Não há migration 006. O total e o detalhamento dos custos operacionais agora usam apenas linhas ativas. A fórmula e o rateio econômico de sacolas não foram alterados.

A função `confirmar_precificacao_v2` foi ajustada para receber a chave. Primeiro valida autenticação e parâmetros básicos; em seguida adquire lock transacional da chave e verifica operação já concluída. Se for retry idêntico, retorna o ID existente sem editar a ficha nem criar novo snapshot. Se a chave pertence a outro usuário ou conteúdo, falha. Para uma nova operação, bloqueia o produto com `FOR UPDATE`, valida toda a ficha, substitui os componentes, sincroniza `preco`, `preco_final`, `margem_lucro` e `tempo_producao`, recalcula pela fonte central e insere snapshot e componentes na mesma transação.

Uma nova confirmação deliberada recebe outra chave, inclusive quando os valores são iguais aos de uma confirmação anterior. A identidade é a operação, não o conteúdo econômico.

O navegador conserva a chave após falha ou resposta incerta e a reutiliza quando os dados enviados continuam iguais. Alterações no formulário geram uma nova chave. Após confirmação bem-sucedida, a chave é liberada; eventual falha ao atualizar a tela não informa falsamente que a confirmação foi desfeita.

## Segurança revisada

- A RPC crítica continua sem `EXECUTE` para `anon` e `PUBLIC`; somente `authenticated` recebe `EXECUTE`.
- `SECURITY DEFINER` usa `search_path = ''`, com referências qualificadas às tabelas e à função de cálculo.
- `auth.uid()` é obrigatório, e a mesma chave não pode ser reutilizada por outro usuário nem com conteúdo incompatível.
- `authenticated` possui apenas `SELECT` nas tabelas históricas. Inserts passam pela RPC; triggers bloqueiam UPDATE e DELETE de snapshots e componentes.
- A unicidade no banco oferece proteção adicional se duas operações tentarem persistir a mesma chave.

## Checagens executadas

- Build Next.js completo com variáveis fictícias locais, sem conexão com Supabase: **aprovado**; 26 páginas compiladas/geradas, inclusive Precificação e Relatório.
- Lint e checagens de tipos disponíveis pelo próprio build: **aprovados**. O projeto não define comando de lint separado.
- Revisão estática da migration 005: conferidos assinatura e grant da RPC, chave única, comparação do payload, ordem dos bloqueios, validações antes de `DELETE`, uso de custos oficiais, filtro `ativo = true`, preservação da sacola, triggers e RLS.
- Revisão de referências: o único fluxo de confirmação do drawer chama a RPC; o salvamento direto antigo e inacessível foi removido.
- Busca no fluxo de Precificação V2: não restam o fator `0.75` nem os rótulos `Saudável`, `Reduzida`, `Crítica` e `Produtos em Atenção`.
- M02/M03: migrations 003/004 e telas homologadas não foram alteradas. A 005 continua consumindo `custos_operacionais`, `produto_embalagens`, `embalagem_componentes` e `sacola_estoque_id`.
- Não há arquivos novos de M05+.

## Pendentes de teste integrado após instalação controlada

A migration não foi executada, conforme a ordem. Portanto continuam pendentes, em banco de testes autenticado: aplicação da 005, execução da função SQL com custos ativos/inativos e sacola, retries concorrentes com mesma chave, chave reutilizada com conteúdo incompatível, segunda intenção com valores iguais, confirmações concorrentes do mesmo produto, falhas de validação da ficha, rollback sob falha intermediária, grants/RLS e bloqueio efetivo de UPDATE/DELETE histórico. Nenhum desses cenários foi declarado aprovado por simulação.

## Desvios e conclusão

Não foi criada migration 006, nem houve acesso ao Supabase, deploy, commit, push, edição de ambiente ou alteração de dados externos. Não houve desvio funcional da Ordem Técnica M04.1. O pacote está preparado para nova auditoria técnica; o M04 não está homologado.
