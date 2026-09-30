# Relatório Técnico M04

> Atualização M04.1: as limitações relativas à idempotência e à concorrência descritas na entrega inicial foram corrigidas diretamente na migration 005. Consulte `RELATORIO_TECNICO_M04_1.md` para a revisão técnica e os testes desta versão.

## 1. Identificação da origem

- Origem declarada na Ordem Técnica: branch `desenvolvimento-v2`.
- Commit declarado: `7cc656d` — `feat: implementa infraestrutura de embalagens V2`.
- O pacote foi recebido como `git archive`, sem `.git`; portanto branch e HEAD não puderam ser confirmados localmente e não foram inferidos a partir dos arquivos.
- Escopo executado: M04 — Precificação de Produtos e Histórico Econômico. Nenhum módulo posterior foi implementado.

## 2. Auditoria inicial

O pacote contém as migrations 001 a 004, com M02 em `003_cria_custos_operacionais_v2.sql` e M03 em `004_embalagens_composicoes_fisicas_m03.sql`. A tela de Precificação ainda calculava pela estrutura legada, incluindo `configuracoes_sistema.embalagem_padrao`, custos operacionais rateados por hora e atualização direta de `produtos`. Não havia histórico V2 próprio por produto.

O M03 já fornece `produto_embalagens`, `embalagem_componentes`, `embalagens_fisicas` e a associação explícita `configuracoes_sistema.sacola_estoque_id`. Essas estruturas foram consumidas sem reconstrução.

O Documento de Regras foi lido integralmente. As regras posteriores e explicitamente congeladas foram priorizadas sobre trechos intermediários da conversa: custo atual separado do snapshot, preço oficial livre, taxa de cartão somente na sugestão oficial, Pix fora do M04, sacola econômica nos custos operacionais, ausência de histórico retroativo e preservação dos campos legados.

## 3. Arquivos criados

- `migrations/005_precificacao_produtos_historico_m04.sql`
- `lib/precificacaoV2.js`
- `RELATORIO_TECNICO_M04.md`

## 4. Arquivos alterados

- `components/PrecificacaoDrawer.js`
  - Consome o custo atual V2.
  - Exibe comparação entre custo atual e última Precificação V2.
  - Troca a gravação direta por confirmação transacional via RPC.
  - Exibe e persiste a distinção de produto deliberadamente sem embalagem avulsa.
  - Atualiza nomenclaturas de preço para Preço-base Sugerido e Preço Oficial Sugerido.
- `pages/configuracoes/index.js`
  - Expõe Estimativa de pedidos por mês.
  - Mantém o valor monetário legado da embalagem apenas para compatibilidade e deixa de apresentá-lo como fonte da Precificação V2.
- `pages/relatorios/precificacao.js`
  - Usa a mesma RPC/fonte de custo atual da Precificação.
  - Inclui embalagem M03 e parcela econômica de sacolas através do cálculo central.

## 5. Migration M04

### Parâmetros e compatibilidade

- `configuracoes_sistema.estimativa_pedidos_mes`: parâmetro numérico não negativo, editável e não derivado de histórico.
- `produtos.sem_embalagem_avulsa`: representação explícita para produto deliberadamente sem embalagem. Ausência de associação M03 com esse campo falso continua significando embalagem ainda não configurada.
- `configuracoes_sistema.embalagem_padrao` não foi removido nem usado pela nova fonte econômica.
- Campos legados `preco`, `preco_final`, `margem_lucro` e `tempo_producao` foram preservados e sincronizados na confirmação.

### Snapshot econômico

As tabelas `precificacoes_v2` e `precificacoes_v2_componentes` guardam cada confirmação em novo registro. O snapshot inclui produto, data, ficha técnica, mão de obra, custos operacionais, parcela estimada de sacolas, parâmetros de mão de obra, embalagem avulsa, custo de produção, custo para venda avulsa, margem, taxa de cartão, preços sugeridos, preço oficial confirmado e margem real. Os componentes guardam nome, categoria, quantidade e custo unitário congelados.

Não há backfill. Produtos legados continuam sem snapshot até a primeira confirmação V2 deliberada.

### Fonte única do cálculo

`calcular_custo_atual_produto(uuid)` reconstrói dinamicamente:

1. Ficha Técnica e custos atuais do Estoque.
2. Mão de obra por pró-labore, horas/dia, dias/semana e tempo de produção.
3. Custos Operacionais ativos do M02.
4. Custo mensal estimado de sacolas: estimativa mensal × quantidade padrão × custo do item associado por `sacola_estoque_id`.
5. Composição física da embalagem avulsa M03, usando os custos atuais do Estoque.
6. Custo de Produção, Custo para Venda Avulsa, sugestões e margem atual.

O preço oficial atual não é recalculado nem alterado por mudanças de custo.

### Confirmação, atomicidade e imutabilidade

`confirmar_precificacao_v2(uuid, numeric, numeric, numeric, jsonb, boolean)` valida autenticação, produto, tempo, margem e preço; substitui a ficha técnica informada, atualiza os campos comerciais legados, recalcula no servidor e insere o snapshot e seus componentes na mesma transação.

Triggers bloqueiam UPDATE e DELETE no histórico. As tabelas não concedem INSERT/UPDATE/DELETE diretamente ao papel `authenticated`; a confirmação ocorre somente pela RPC com `SECURITY DEFINER`, sem EXECUTE para `anon` ou `PUBLIC`.

A versão M04.1 acrescenta chave de operação com unicidade no banco, retorno do snapshot existente em retry idêntico e bloqueio da linha do produto durante a confirmação. O bloqueio do botão permanece como proteção de interface.

## 6. Sacola e embalagem

A sacola padrão é localizada exclusivamente por `sacola_estoque_id`; não há busca por nome e não é criada uma linha manual duplicada. Sua parcela econômica integra o total operacional mensal e também é congelada separadamente no snapshot.

A embalagem avulsa usa a associação Produto → Embalagem do M03 e os componentes físicos atuais. Um produto deliberadamente sem embalagem produz custo de embalagem zero. A nova Precificação não usa o valor global legado.

Para evitar dupla contabilização silenciosa, a confirmação rejeita o caso em que exista componente da ficha técnica classificado como `embalagem` e também uma embalagem M03 configurada. O cadastro legado não é reclassificado automaticamente.

## 7. Segurança e não retroatividade

- Não foram acessados Supabase, produção, migrations instaladas ou credenciais.
- Não houve deploy, commit, push ou alteração de branch remota.
- Não há alteração de pedidos, kits, baixa de estoque, produção, orçamento ou Pix.
- Histórico anterior não é fabricado, e snapshots existentes não são atualizados.

## 8. Testes executados

- Instalação local das dependências declaradas para validação técnica.
- Build Next.js executado com valores locais fictícios de ambiente, sem conexão com Supabase.
- Lint/checagem integrada do Next.js concluída durante o build.
- Compilação das páginas existentes, incluindo Precificação, Configurações e Relatório de Precificação: concluída.
- Revisão estática de referências às tabelas M02/M03, campos legados, embalagem M03, sacola e nova RPC: concluída.

## 9. Testes pendentes após instalação da migration

Dependem de um banco de testes com a migration instalada e dados autenticados:

- cálculo real com embalagem M03;
- produto deliberadamente sem embalagem e produto ainda não configurado;
- alteração de componente refletindo apenas no custo atual;
- alteração de estimativa de pedidos, quantidade padrão e custo unitário da sacola;
- primeira e segunda Precificação V2 com preservação do primeiro snapshot;
- estabilidade do preço oficial após mudanças de custo;
- ausência de snapshot retroativo para produto legado;
- bloqueio de UPDATE/DELETE do histórico;
- atomicidade sob falha e concorrência;
- validação da regra de dupla contabilização em dados legados.

Esses testes não foram simulados como sucesso.

## 10. Limitações e desvios

- A origem Git não pôde ser confirmada porque o ZIP não contém `.git`; foram utilizados os branch e commit declarados pelo solicitante.
- A execução SQL da migration não foi realizada, conforme determinação expressa. Assim, estruturas, RPCs, RLS, grants e triggers foram revisados estaticamente, mas ainda dependem de teste integrado em banco de testes.
- Idempotência e concorrência foram revistas na M04.1. A verificação integrada dessas garantias permanece pendente até a instalação controlada da migration em banco de testes.
- Registros legados que já misturem embalagem na ficha técnica permanecem preservados; a confirmação sinaliza o conflito em vez de reclassificar ou corrigir silenciosamente.

## 11. Resultado

O pacote contém a implementação proposta do M04 e está tecnicamente preparado para auditoria posterior. O M04 não está declarado homologado.
