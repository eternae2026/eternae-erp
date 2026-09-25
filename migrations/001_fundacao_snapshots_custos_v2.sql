-- ============================================================================
-- ERP ETERNAÊ V2
-- Migration 001 - Fundação de snapshots de custos e composição
-- ============================================================================
-- Migration aditiva. Não altera nem remove estruturas/dados existentes.
-- Não realiza backfill, baixa de estoque, mudança de pedidos ou financeiro.
-- ============================================================================

BEGIN;

CREATE TABLE public.orcamento_item_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_item_id uuid NOT NULL,
    tipo_item text NOT NULL,

    custo_materiais_unitario numeric NOT NULL DEFAULT 0,
    custo_mao_obra_unitario numeric NOT NULL DEFAULT 0,
    custo_operacional_unitario numeric NOT NULL DEFAULT 0,
    custo_embalagem_unitario numeric NOT NULL DEFAULT 0,
    custo_sacola_unitario numeric NOT NULL DEFAULT 0,
    custo_outros_unitario numeric NOT NULL DEFAULT 0,
    custo_total_unitario numeric NOT NULL DEFAULT 0,
    custo_total_linha numeric NOT NULL DEFAULT 0,

    margem_percentual_snapshot numeric,
    taxa_cartao_percentual_snapshot numeric,
    desconto_pix_percentual_snapshot numeric,

    parametros_calculo jsonb NOT NULL DEFAULT '{}'::jsonb,
    capturado_em timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT orcamento_item_snapshots_orcamento_item_fkey
        FOREIGN KEY (orcamento_item_id)
        REFERENCES public.orcamento_itens(id)
        ON UPDATE NO ACTION
        ON DELETE RESTRICT,

    CONSTRAINT orcamento_item_snapshots_orcamento_item_unique
        UNIQUE (orcamento_item_id),

    CONSTRAINT orcamento_item_snapshots_tipo_item_check
        CHECK (btrim(tipo_item) <> ''),

    CONSTRAINT orcamento_item_snapshots_custos_check
        CHECK (
            custo_materiais_unitario >= 0
            AND custo_mao_obra_unitario >= 0
            AND custo_operacional_unitario >= 0
            AND custo_embalagem_unitario >= 0
            AND custo_sacola_unitario >= 0
            AND custo_outros_unitario >= 0
            AND custo_total_unitario >= 0
            AND custo_total_linha >= 0
        ),

    CONSTRAINT orcamento_item_snapshots_percentuais_check
        CHECK (
            (margem_percentual_snapshot IS NULL OR margem_percentual_snapshot >= 0)
            AND (taxa_cartao_percentual_snapshot IS NULL OR taxa_cartao_percentual_snapshot >= 0)
            AND (desconto_pix_percentual_snapshot IS NULL OR desconto_pix_percentual_snapshot >= 0)
        )
);

COMMENT ON TABLE public.orcamento_item_snapshots IS
'ERP Eternaê V2: fotografia histórica dos custos e parâmetros de cálculo de cada item comercial.';

COMMENT ON COLUMN public.orcamento_item_snapshots.parametros_calculo IS
'Metadados complementares do cálculo. Custos e percentuais principais permanecem em colunas estruturadas.';

CREATE TABLE public.orcamento_item_snapshot_componentes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id uuid NOT NULL,
    tipo_componente text NOT NULL,

    estoque_id uuid,
    produto_id uuid,

    nome_componente text NOT NULL,
    unidade_snapshot text,
    quantidade_unitaria numeric NOT NULL,

    custo_unitario_snapshot numeric NOT NULL DEFAULT 0,
    custo_total_unitario numeric NOT NULL DEFAULT 0,

    categoria_item_snapshot text,
    embalagem_premium_snapshot boolean NOT NULL DEFAULT false,

    metadados jsonb NOT NULL DEFAULT '{}'::jsonb,
    capturado_em timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT orcamento_item_snapshot_componentes_snapshot_fkey
        FOREIGN KEY (snapshot_id)
        REFERENCES public.orcamento_item_snapshots(id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,

    CONSTRAINT orcamento_item_snapshot_componentes_estoque_fkey
        FOREIGN KEY (estoque_id)
        REFERENCES public.estoque(id)
        ON UPDATE NO ACTION
        ON DELETE SET NULL,

    CONSTRAINT orcamento_item_snapshot_componentes_produto_fkey
        FOREIGN KEY (produto_id)
        REFERENCES public.produtos(id)
        ON UPDATE NO ACTION
        ON DELETE SET NULL,

    CONSTRAINT orcamento_item_snapshot_componentes_tipo_check
        CHECK (btrim(tipo_componente) <> ''),

    CONSTRAINT orcamento_item_snapshot_componentes_nome_check
        CHECK (btrim(nome_componente) <> ''),

    CONSTRAINT orcamento_item_snapshot_componentes_quantidade_check
        CHECK (quantidade_unitaria > 0),

    CONSTRAINT orcamento_item_snapshot_componentes_custos_check
        CHECK (
            custo_unitario_snapshot >= 0
            AND custo_total_unitario >= 0
        )
);

COMMENT ON TABLE public.orcamento_item_snapshot_componentes IS
'ERP Eternaê V2: composição histórica vinculada ao snapshot de custo de um item comercial.';

COMMENT ON COLUMN public.orcamento_item_snapshot_componentes.quantidade_unitaria IS
'Quantidade do componente necessária para uma unidade do item comercial.';

CREATE INDEX idx_orcamento_item_snapshot_componentes_snapshot_id
    ON public.orcamento_item_snapshot_componentes (snapshot_id);

CREATE INDEX idx_orcamento_item_snapshot_componentes_estoque_id
    ON public.orcamento_item_snapshot_componentes (estoque_id)
    WHERE estoque_id IS NOT NULL;

CREATE INDEX idx_orcamento_item_snapshot_componentes_produto_id
    ON public.orcamento_item_snapshot_componentes (produto_id)
    WHERE produto_id IS NOT NULL;

ALTER TABLE public.orcamento_item_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_item_snapshot_componentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_orcamento_item_snapshots"
    ON public.orcamento_item_snapshots
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_all_orcamento_item_snapshot_componentes"
    ON public.orcamento_item_snapshot_componentes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

REVOKE ALL ON TABLE public.orcamento_item_snapshots FROM anon;
REVOKE ALL ON TABLE public.orcamento_item_snapshot_componentes FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.orcamento_item_snapshots
    TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.orcamento_item_snapshot_componentes
    TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICAÇÕES PÓS-MIGRATION - SOMENTE LEITURA
-- ============================================================================

SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
      'orcamento_item_snapshots',
      'orcamento_item_snapshot_componentes'
  )
ORDER BY c.relname;

SELECT
    tablename AS table_name,
    policyname AS policy_name,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
      'orcamento_item_snapshots',
      'orcamento_item_snapshot_componentes'
  )
ORDER BY tablename, policyname;

SELECT
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
      'orcamento_item_snapshots',
      'orcamento_item_snapshot_componentes'
  )
ORDER BY tablename, indexname;

SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
      'orcamento_item_snapshots',
      'orcamento_item_snapshot_componentes'
  )
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
