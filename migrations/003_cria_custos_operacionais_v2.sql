-- ============================================================================
-- ERP ETERNAÊ V2
-- Migration 003 - Criação da estrutura de custos operacionais
-- ============================================================================
--
-- CONTEXTO
-- A V1 mantém custos operacionais fixos diretamente na tabela
-- configuracoes_precificacao, por meio de campos específicos.
--
-- Para a V2, foi definido que os custos operacionais utilizados no rateio
-- da precificação deverão possuir cadastro próprio, permitindo que os custos
-- reais da operação sejam cadastrados livremente, sem limitar o modelo a
-- categorias previamente determinadas pelo sistema.
--
-- Esta migration cria exclusivamente a fundação persistente desse cadastro.
--
-- IMPORTANTE
-- A criação desta estrutura NÃO altera a fonte de custos utilizada atualmente
-- pela precificação da V1.
--
-- Os campos existentes em configuracoes_precificacao permanecem preservados
-- e os cálculos atuais continuam utilizando a estrutura homologada da V1
-- até que a integração econômica da V2 seja implementada e homologada.
--
-- Esta migration NÃO realiza:
--   - backfill de custos operacionais;
--   - criação automática de custos;
--   - migração dos valores atuais de energia, internet, Canva, domínio
--     ou outros custos;
--   - alteração de configuracoes_precificacao;
--   - alteração das fórmulas de precificação;
--   - alteração de produtos;
--   - alteração de kits;
--   - alteração de estoque;
--   - alteração de orçamentos;
--   - alteração de pedidos;
--   - alteração financeira.
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PRECONDIÇÃO
-- A estrutura não pode existir antes desta migration.
-- ============================================================================

DO $$
BEGIN
    IF to_regclass('public.custos_operacionais') IS NOT NULL THEN
        RAISE EXCEPTION
            'Migration 003 abortada: public.custos_operacionais já existe.';
    END IF;
END
$$;

-- ============================================================================
-- 2. CRIAÇÃO DA TABELA DE CUSTOS OPERACIONAIS
-- ============================================================================

CREATE TABLE public.custos_operacionais (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    valor_mensal numeric NOT NULL DEFAULT 0,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT custos_operacionais_pkey
        PRIMARY KEY (id),

    CONSTRAINT custos_operacionais_nome_check
        CHECK (btrim(nome) <> ''),

    CONSTRAINT custos_operacionais_valor_mensal_check
        CHECK (valor_mensal >= 0)
);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- Mantém o padrão de segurança já utilizado pelas tabelas funcionais do ERP.
-- ============================================================================

ALTER TABLE public.custos_operacionais
ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. POLICY PARA USUÁRIOS AUTENTICADOS
-- ============================================================================

CREATE POLICY "ERP authenticated custos_operacionais"
ON public.custos_operacionais
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;

-- ============================================================================
-- FIM DA MIGRATION 003
-- ============================================================================