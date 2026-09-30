# ERP Eternaê V2 — Relatório Técnico M04 Final

## Base, diagnóstico e limite

Base: pacote completo `eternae-erp-m04-2-2-atualizado.zip`, anteriormente entregue e testado no ambiente integrado. A lacuna era que a confirmação V2 já impedia a contradição **“deliberadamente sem embalagem” com associação existente**, mas ainda aceitava **sem associação e sem a declaração explícita**. Assim, a embalagem pendente podia gerar um snapshot. A proteção nova vale somente para confirmações futuras: nenhum snapshot ou dado histórico foi apagado, refeito ou atualizado. Não foi encontrado conflito com a regra econômica congelada.

Este trabalho não acessou Supabase ou produção, não executou migrations ou SQL, não fez deploy, commit ou push e não alterou arquivos de ambiente. O M05 não foi iniciado.

## Implementação da proteção de embalagem

- `components/PrecificacaoDrawer.js`: imediatamente antes da confirmação, a tela recusa produto sem embalagem associada quando a opção “deliberadamente sem embalagem” não estiver marcada e explica como resolver. O bloqueio inverso já existente foi preservado.
- `migrations/007_protecao_embalagem_precificacao_m04_final.sql`: migration incremental que substitui somente a definição da RPC transacional `public.confirmar_precificacao_v2` para acrescentar a mesma verificação diretamente em `public.produto_embalagens`, antes de alterar Ficha Técnica, produto ou histórico. Preserva os dois estados válidos: associação com `sem_embalagem_avulsa=false`; ausência de associação com `sem_embalagem_avulsa=true`. Preserva o bloqueio da associação contraditória. A mensagem inversa foi apenas simplificada para remover o termo técnico M03. Como PostgreSQL exige a republicação da função para alterar seu corpo, a 007 contém a definição completa, mas a comparação com a 006 confirma que o corpo só difere nesses dois pontos. Não cria tabelas, não faz backfill, não modifica registros ou snapshots existentes. Mantém autenticação, `SECURITY DEFINER`, `search_path`, bloqueio transacional, chave de idempotência, revalidação econômica, atualização atômica, `REVOKE` de PUBLIC/anon e `GRANT` somente para authenticated.

As migrations **005 e 006 estão byte a byte inalteradas** em relação ao ZIP M04.2.2 (comparação SHA-256). **No momento desta entrega corretiva**, a migration 007 havia sido **criada, mas ainda não executada**.

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

Este era o estado do pacote corretivo no momento da auditoria técnica, **antes da execução da migration 007 e dos testes integrados finais**. O fechamento e a homologação definitiva do M04 estão registrados na seção seguinte.
---

# Fechamento Oficial do M04 — Homologação de 30/09/2026

## 1. Estado homologado e fonte de verdade

Em **30/09/2026**, o módulo **M04 — Precificação de Produtos e Histórico** foi considerado **funcional e tecnicamente homologado**.

O pacote:

`eternae-erp-m04-homologado-2026-09-30.zip`

passa a representar o **estado local final e homologado do projeto ao encerramento do M04** e deve ser tratado como **fonte de verdade do código para a continuidade da ERP Eternaê V2**.

O M05 não faz parte deste fechamento e não foi iniciado por este documento.

## 2. Situação das migrations

A migration:

`007_protecao_embalagem_precificacao_m04_final.sql`

foi executada **uma única vez** no Supabase, com sucesso, após a revisão do pacote corretivo.

As migrations:

- `005_precificacao_v2_m04.sql`;
- `006_precificacao_v2_m04_2.sql`;

já haviam sido executadas anteriormente e **não devem ser executadas novamente**.

A migration 007 é incremental em relação às anteriores e preserva dados e snapshots históricos existentes.

## 3. Homologação integrada da proteção de embalagem

Após a instalação da migration 007, a proteção final de embalagem foi testada no ambiente integrado nas quatro combinações previstas:

1. **Com embalagem associada + não marcado como “deliberadamente sem embalagem”** → confirmação permitida.
2. **Com embalagem associada + marcado como “deliberadamente sem embalagem”** → confirmação bloqueada.
3. **Sem embalagem associada + marcado deliberadamente sem embalagem** → confirmação permitida.
4. **Sem embalagem associada + não marcado como “deliberadamente sem embalagem”** → confirmação bloqueada.

Com isso, ficaram cobertos os dois estados válidos e os dois estados inválidos, tanto pela interface quanto pela validação transacional no banco.

## 4. Escopo funcional homologado

Ao encerramento do M04, foram homologados os seguintes pontos:

- custos dinâmicos dos componentes;
- mão de obra;
- custos operacionais;
- parcela econômica das sacolas;
- embalagem avulsa por composição física;
- proteção contra confirmação com situação de embalagem inconsistente;
- snapshots históricos de precificação;
- preservação do histórico após mudanças posteriores de custo;
- nomenclatura e exibição de **Preço Final**;
- margem;
- Política Comercial;
- Configurações / Embalagens;
- relatórios de precificação;
- compatibilidade das regras econômicas já congeladas no M04.

## 5. Ajustes manuais finais após o pacote corretivo

Após a entrega do pacote final do Work, foram realizadas somente duas alterações manuais de interface, sem mudança da arquitetura ou das regras econômicas homologadas.

### 5.1 Custos Operacionais

Em `pages/precificacao/custos-operacionais.js`, o texto:

`Mudanças de custo não alteram preços oficiais.`

foi substituído por:

`Mudanças de custo não alteram o Preço Final.`

A alteração foi exclusivamente de nomenclatura/interface e não modificou cálculos nem persistência.

### 5.2 Configurações — Embalagens

Em `pages/configuracoes/index.js`:

- o campo visual **“Valor legado de embalagem (R$)”** foi ocultado;
- a referência correspondente foi removida do quadro **“Regras atuais”**.

A estrutura interna e o valor legado permaneceram preservados para compatibilidade. Não houve remoção de coluna, alteração destrutiva de dados nem mudança da lógica homologada.

## 6. Verificação final de build

Após as duas alterações manuais finais foi executado:

`npm run build`

com sucesso completo:

- lint/checagem de tipos integrada: OK;
- compilação: OK;
- geração estática: **26/26 páginas**.

Não foi identificada falha impeditiva para o fechamento do módulo.

## 7. Status definitivo do M04

**STATUS: HOMOLOGADO FUNCIONAL E TECNICAMENTE EM 30/09/2026.**

A partir deste marco:

- o M04 deve ser considerado **congelado**;
- não deve ser refatorado ou alterado sem necessidade objetiva e análise de impacto;
- o pacote homologado de 30/09/2026 é a referência para versionamento;
- as migrations 005, 006 e 007 passam a integrar o histórico já aplicado do M04, respeitando a regra de não repetição;
- qualquer evolução posterior deve preservar integralmente as regras e compatibilidades já homologadas.

## 8. Próxima etapa

Antes do início do **M05 — Kits, acessórios e embalagem Premium**, deve ser concluído o **versionamento formal do estado homologado atual**.

Somente após esse marco de preservação o desenvolvimento deve avançar para o M05, respeitando integralmente as regras já aprovadas da ERP Eternaê V2.
