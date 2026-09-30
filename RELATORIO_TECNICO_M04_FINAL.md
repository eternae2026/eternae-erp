# ERP Eternaê V2 — Relatório Técnico M04 Final

## Base, diagnóstico e limite

Base: pacote completo `eternae-erp-m04-2-2-atualizado.zip`, anteriormente entregue e testado no ambiente integrado. A lacuna era que a confirmação V2 já impedia a contradição **“deliberadamente sem embalagem” com associação existente**, mas ainda aceitava **sem associação e sem a declaração explícita**. Assim, a embalagem pendente podia gerar um snapshot. A proteção nova vale somente para confirmações futuras: nenhum snapshot ou dado histórico foi apagado, refeito ou atualizado. Não foi encontrado conflito com a regra econômica congelada.

Este trabalho não acessou Supabase ou produção, não executou migrations ou SQL, não fez deploy, commit ou push e não alterou arquivos de ambiente. O M05 não foi iniciado.

## Implementação da proteção de embalagem

- `components/PrecificacaoDrawer.js`: imediatamente antes da confirmação, a tela recusa produto sem embalagem associada quando a opção “deliberadamente sem embalagem” não estiver marcada e explica como resolver. O bloqueio inverso já existente foi preservado.
- `migrations/007_protecao_embalagem_precificacao_m04_final.sql`: migration incremental que substitui somente a definição da RPC transacional `public.confirmar_precificacao_v2` para acrescentar a mesma verificação diretamente em `public.produto_embalagens`, antes de alterar Ficha Técnica, produto ou histórico. Preserva os dois estados válidos: associação com `sem_embalagem_avulsa=false`; ausência de associação com `sem_embalagem_avulsa=true`. Preserva o bloqueio da associação contraditória. A mensagem inversa foi apenas simplificada para remover o termo técnico M03. Como PostgreSQL exige a republicação da função para alterar seu corpo, a 007 contém a definição completa, mas a comparação com a 006 confirma que o corpo só difere nesses dois pontos. Não cria tabelas, não faz backfill, não modifica registros ou snapshots existentes. Mantém autenticação, `SECURITY DEFINER`, `search_path`, bloqueio transacional, chave de idempotência, revalidação econômica, atualização atômica, `REVOKE` de PUBLIC/anon e `GRANT` somente para authenticated.

As migrations **005 e 006 estão byte a byte inalteradas** em relação ao ZIP M04.2.2 (comparação SHA-256). A migration 007 foi **criada, mas não executada**.

## Interface e compatibilidade

- Bloco D do Drawer: “Preço Oficial”/“Preço Oficial Atual” passou a “Preço Final”, inclusive a observação sobre custos; o comparativo e o Bloco C aprovado não mudaram.
- `pages/relatorios/index.js` e `pages/relatorios/precificacao.js`: a coluna da Análise de Precificação agora se chama “Preço Final”; o texto introdutório do relatório específico acompanha a nomenclatura. Valores, fonte `obterCustoAtualProduto`, “Inclui sacolas estimadas” e demais conteúdos econômicos foram preservados. A Tabela de preços não foi alterada.
- `pages/precificacao/custos-operacionais.js`: “Precificação V2” foi simplificado para “Precificação” no total e na observação, sem mudar o cálculo ou a explicação da parcela das sacolas.
- `pages/configuracoes/index.js` e `pages/configuracoes/custos-operacionais.js`: textos auxiliares da seção Embalagens perderam referências operacionais a V2/M03/M04; a linha “Caixa MDF → item opcional vendido” foi retirada. Campos, valor legado, sacola padrão, quantidade, estimativa, custos e salvamento permanecem.
- Em “Política comercial” restam visíveis somente taxa do cartão, forma de pagamento padrão e validade do orçamento. Foram retirados apenas os dois controles de desconto PIX automático e a nota explicativa antiga. Nenhuma lógica de PIX, orçamento ou pedido foi criada ou alterada.

Auditoria dos campos PIX antigos: `desconto_pix_automatico` e `mostrar_desconto_pix_orcamento` aparecem no código de aplicação apenas em `pages/configuracoes/index.js`, no estado, carregamento e salvamento de `configuracoes_precificacao`. Eles não são consultados diretamente nos demais módulos. Permanecem no contrato de persistência e agora são carregados da própria `configuracoes_precificacao`, de modo que salvar outros parâmetros de configuração não substitua valores existentes por defaults de uma tabela diferente. Os módulos legados de orçamento continuam intocados. A seleção “PIX” como forma de pagamento padrão também permanece; ela não é um controle de desconto.

## Arquivos

Alterados em relação ao pacote M04.2.2:

- `components/PrecificacaoDrawer.js`
- `pages/configuracoes/index.js`
- `pages/configuracoes/custos-operacionais.js`
- `pages/precificacao/custos-operacionais.js`
- `pages/relatorios/index.js`
- `pages/relatorios/precificacao.js`

Criados: `migrations/007_protecao_embalagem_precificacao_m04_final.sql`, `tests/m04_final.test.cjs` e este `RELATORIO_TECNICO_M04_FINAL.md`. Nenhum outro arquivo do pacote-base foi modificado.

## Verificações locais

- `node tests/m04_2.test.cjs`: passou; preservação das verificações de sacola, prévia e embalagem anteriores.
- `node tests/m04_2_2.test.cjs`: passou; carregamento seguro da Ficha Técnica, proteções de edição e Bloco C.
- `node tests/m04_final.test.cjs`: passou; comparação integral da função 007 com a 006 após isolar as duas mudanças, permissões da função, ordem da validação, matriz lógica dos quatro estados de embalagem, duas proteções de interface, nomenclatura, fonte dos relatórios, nota das sacolas e preservação dos campos PIX.
- `npm run build`: **concluído com sucesso**, inclusive lint/checagem de tipos integrada ao Next.js e geração das 26 páginas. Houve aviso não fatal de cache do webpack. O projeto não oferece script separado de lint.
- Comparação de hashes dos 99 arquivos existentes no ZIP M04.2.2: somente os seis arquivos de aplicação listados mudaram. A 005 e a 006 foram confirmadas byte a byte idênticas.

As verificações de matriz são de código/lógica local; **não representam execução real da RPC**. Permanecem pendentes, após revisão e instalação separada da 007 no ambiente integrado autorizado: confirmar de fato os dois estados válidos, bloquear os dois estados inválidos, verificar ausência de snapshot e de alteração de preço nos bloqueios, e regressão de atomicidade, idempotência, histórico, Tabela de preços e Análise de precificação. O build não substitui esses testes integrados.

Este é o pacote corretivo para auditoria. **O M04 não está homologado.**
