-- ============================================================================
-- ERP ETERNAÊ V2
-- Migration 002 - Correção da fundação inicial V2
-- ============================================================================
--
-- CONTEXTO
-- A Migration 001 criou antecipadamente estruturas de snapshot vinculadas
-- diretamente aos itens de orçamento.
--
-- Após a conclusão e congelamento da Etapa 4.2, ficou definido que essas
-- estruturas não representam o modelo oficial de snapshots da V2.
--
-- Esta migration:
--   1. valida que as estruturas prematuras continuam sem dados;
--   2. interrompe a execução caso exista qualquer registro;
--   3. remove exclusivamente as duas tabelas criadas pela Migration 001;
--   4. não cria nova estrutura de negócio;
--   5. não altera dados ou estruturas funcionais da V1.
--
-- IMPORTANTE
-- A Migration 001 permanece preservada no histórico Git.
-- Esta Migration 002 documenta e executa sua correção de forma explícita.
--
-- Não realiza:
--   - backfill;
--   - baixa de estoque;
--   - alteração de pedidos;
--   - alteração de orçamentos;
--   - alteração financeira;
--   - alteração de produtos;
--   - alteração de kits;
--   - alteração de configurações da V1.
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PRECONDIÇÃO: AS DUAS TABELAS DEVEM EXISTIR
-- ============================================================================

DO $$
BEGIN
    IF to_regclass('public.orcamento_item_snapshots') IS NULL THEN
        RAISE EXCEPTION
            'Migration 002 abortada: public.orcamento_item_snapshots não existe.';
    END IF;

    IF to_regclass('public.orcamento_item_snapshot_componentes') IS NULL THEN
        RAISE EXCEPTION
            'Migration 002 abortada: public.orcamento_item_snapshot_componentes não existe.';
    END IF;
END
$$;

-- ============================================================================
-- 2. PRECONDIÇÃO: NENHUMA DAS ESTRUTURAS PODE CONTER DADOS
-- ============================================================================

DO $$
DECLARE
    v_snapshots bigint;
    v_componentes bigint;
BEGIN
    SELECT COUNT(*)
      INTO v_snapshots
      FROM public.orcamento_item_snapshots;

    SELECT COUNT(*)
      INTO v_componentes
      FROM public.orcamento_item_snapshot_componentes;

    IF v_snapshots <> 0 OR v_componentes <> 0 THEN
        RAISE EXCEPTION
            'Migration 002 abortada: foram encontrados dados V2. snapshots=%, componentes=%. Nenhuma estrutura foi removida.',
            v_snapshots,
            v_componentes;
    END IF;
END
$$;

-- ============================================================================
-- 3. CORREÇÃO DA FUNDAÇÃO INICIAL
--
-- Ordem intencional:
-- primeiro a tabela filha; depois a tabela pai.
--
-- Não utilizar CASCADE.
-- Se surgir uma dependência externa não prevista, a migration deverá falhar
-- em vez de remover silenciosamente outros objetos.
-- ============================================================================

DROP TABLE public.orcamento_item_snapshot_componentes;

DROP TABLE public.orcamento_item_snapshots;

COMMIT;

-- ============================================================================
-- FIM DA MIGRATION 002
-- ============================================================================
