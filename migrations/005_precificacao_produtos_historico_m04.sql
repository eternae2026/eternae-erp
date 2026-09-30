-- ERP Eternaê V2 - M04: precificação de produtos e histórico econômico
-- Migration aditiva, sem backfill histórico e sem alteração de pedidos fechados.

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.produtos') IS NULL
       OR to_regclass('public.estoque') IS NULL
       OR to_regclass('public.produto_composicao') IS NULL
       OR to_regclass('public.configuracoes_precificacao') IS NULL
       OR to_regclass('public.configuracoes_sistema') IS NULL
       OR to_regclass('public.custos_operacionais') IS NULL
       OR to_regclass('public.produto_embalagens') IS NULL
       OR to_regclass('public.embalagem_componentes') IS NULL THEN
        RAISE EXCEPTION 'M04 abortada: uma estrutura-base do M02/M03 não existe.';
    END IF;
END
$$;

-- A ausência deliberada de embalagem não é o mesmo que ausência de configuração.
ALTER TABLE public.produtos
    ADD COLUMN IF NOT EXISTS sem_embalagem_avulsa boolean NOT NULL DEFAULT false;

-- Parâmetro econômico editável. Não é derivado do histórico de pedidos.
ALTER TABLE public.configuracoes_sistema
    ADD COLUMN IF NOT EXISTS estimativa_pedidos_mes numeric NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'configuracoes_sistema_estimativa_pedidos_mes_check'
    ) THEN
        ALTER TABLE public.configuracoes_sistema
            ADD CONSTRAINT configuracoes_sistema_estimativa_pedidos_mes_check
            CHECK (estimativa_pedidos_mes >= 0);
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.precificacoes_v2 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id uuid NOT NULL UNIQUE,
    requisicao_confirmacao jsonb NOT NULL,
    produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    confirmada_em timestamptz NOT NULL DEFAULT now(),
    custo_ficha_tecnica numeric NOT NULL DEFAULT 0,
    custo_mao_obra numeric NOT NULL DEFAULT 0,
    custo_operacional numeric NOT NULL DEFAULT 0,
    custo_sacolas_estimado numeric NOT NULL DEFAULT 0,
    estimativa_pedidos_mes numeric NOT NULL DEFAULT 0,
    quantidade_sacolas_por_pedido numeric NOT NULL DEFAULT 0,
    custo_unitario_sacola numeric NOT NULL DEFAULT 0,
    custo_producao numeric NOT NULL DEFAULT 0,
    custo_embalagem_avulsa numeric NOT NULL DEFAULT 0,
    custo_venda_avulsa numeric NOT NULL DEFAULT 0,
    margem_desejada numeric NOT NULL DEFAULT 0,
    taxa_cartao numeric NOT NULL DEFAULT 0,
    preco_base_sugerido numeric NOT NULL DEFAULT 0,
    preco_oficial_sugerido numeric NOT NULL DEFAULT 0,
    preco_final_oficial numeric NOT NULL DEFAULT 0,
    margem_real numeric NOT NULL DEFAULT 0,
    parametros_mao_obra jsonb NOT NULL DEFAULT '{}'::jsonb,
    informacoes_custos_operacionais jsonb NOT NULL DEFAULT '{}'::jsonb,
    embalagem_configurada boolean NOT NULL DEFAULT false,
    sem_embalagem_avulsa boolean NOT NULL DEFAULT false,
    criado_por uuid,
    CONSTRAINT precificacoes_v2_valores_check CHECK (
        custo_ficha_tecnica >= 0 AND custo_mao_obra >= 0
        AND custo_operacional >= 0 AND custo_sacolas_estimado >= 0
        AND estimativa_pedidos_mes >= 0 AND quantidade_sacolas_por_pedido >= 0
        AND custo_unitario_sacola >= 0 AND custo_producao >= 0
        AND custo_embalagem_avulsa >= 0 AND custo_venda_avulsa >= 0
        AND margem_desejada >= 0 AND margem_desejada < 100
        AND taxa_cartao >= 0 AND taxa_cartao < 100
        AND preco_base_sugerido >= 0 AND preco_oficial_sugerido >= 0
        AND preco_final_oficial >= 0
    )
);

CREATE TABLE IF NOT EXISTS public.precificacoes_v2_componentes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    precificacao_id uuid NOT NULL REFERENCES public.precificacoes_v2(id) ON DELETE RESTRICT,
    tipo_componente text NOT NULL,
    estoque_id uuid REFERENCES public.estoque(id) ON DELETE SET NULL,
    nome_snapshot text NOT NULL,
    categoria_snapshot text,
    quantidade numeric NOT NULL,
    custo_unitario_snapshot numeric NOT NULL DEFAULT 0,
    custo_total_snapshot numeric NOT NULL DEFAULT 0,
    metadados jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT precificacoes_v2_componentes_tipo_check CHECK (btrim(tipo_componente) <> ''),
    CONSTRAINT precificacoes_v2_componentes_quantidade_check CHECK (quantidade > 0),
    CONSTRAINT precificacoes_v2_componentes_custos_check CHECK (
        custo_unitario_snapshot >= 0 AND custo_total_snapshot >= 0
    )
);

CREATE INDEX IF NOT EXISTS idx_precificacoes_v2_produto_data
    ON public.precificacoes_v2 (produto_id, confirmada_em DESC);
CREATE INDEX IF NOT EXISTS idx_precificacoes_v2_componentes_precificacao
    ON public.precificacoes_v2_componentes (precificacao_id);

ALTER TABLE public.precificacoes_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precificacoes_v2_componentes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'precificacoes_v2' AND policyname = 'authenticated_select_precificacoes_v2') THEN
        CREATE POLICY authenticated_select_precificacoes_v2 ON public.precificacoes_v2
            FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'precificacoes_v2_componentes' AND policyname = 'authenticated_select_precificacoes_v2_componentes') THEN
        CREATE POLICY authenticated_select_precificacoes_v2_componentes ON public.precificacoes_v2_componentes
            FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;

REVOKE ALL ON public.precificacoes_v2, public.precificacoes_v2_componentes FROM anon, PUBLIC;
GRANT SELECT ON public.precificacoes_v2, public.precificacoes_v2_componentes TO authenticated;

-- Histórico é append-only. A exclusão de produto continua protegida pela FK.
CREATE OR REPLACE FUNCTION public.bloquear_alteracao_precificacao_v2()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Histórico de precificação V2 é imutável.';
END;
$$;

REVOKE ALL ON FUNCTION public.bloquear_alteracao_precificacao_v2() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_bloquear_update_precificacoes_v2 ON public.precificacoes_v2;
CREATE TRIGGER trg_bloquear_update_precificacoes_v2
    BEFORE UPDATE OR DELETE ON public.precificacoes_v2
    FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_precificacao_v2();

DROP TRIGGER IF EXISTS trg_bloquear_update_precificacoes_v2_componentes ON public.precificacoes_v2_componentes;
CREATE TRIGGER trg_bloquear_update_precificacoes_v2_componentes
    BEFORE UPDATE OR DELETE ON public.precificacoes_v2_componentes
    FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_precificacao_v2();

-- Fonte única de custo atual. A parcela de sacolas está dentro do custo operacional;
-- ela também é retornada separadamente para explicabilidade do snapshot.
CREATE OR REPLACE FUNCTION public.calcular_custo_atual_produto(p_produto_id uuid)
RETURNS TABLE (
    produto_id uuid, custo_ficha_tecnica numeric, custo_mao_obra numeric,
    custo_operacional numeric, custo_sacolas_estimado numeric,
    estimativa_pedidos_mes numeric, quantidade_sacolas_por_pedido numeric,
    custo_unitario_sacola numeric, custo_producao numeric,
    custo_embalagem_avulsa numeric, custo_venda_avulsa numeric,
    horas_mensais numeric, valor_hora numeric, custo_operacional_por_hora numeric,
    margem_desejada numeric, taxa_cartao numeric, preco_base_sugerido numeric,
    preco_oficial_sugerido numeric, preco_oficial_atual numeric,
    margem_atual numeric, embalagem_configurada boolean,
    sem_embalagem_avulsa boolean, ficha_componentes jsonb,
    embalagem_componentes jsonb, informacoes_custos_operacionais jsonb
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
WITH cfg AS (
    SELECT COALESCE((SELECT pro_labore_desejado FROM public.configuracoes_precificacao ORDER BY id LIMIT 1), 0)::numeric AS pro_labore,
           COALESCE((SELECT horas_por_dia FROM public.configuracoes_precificacao ORDER BY id LIMIT 1), 0)::numeric AS horas_dia,
           COALESCE((SELECT dias_por_semana FROM public.configuracoes_precificacao ORDER BY id LIMIT 1), 0)::numeric AS dias_semana,
           COALESCE((SELECT margem_lucro FROM public.produtos WHERE id = p_produto_id), 0)::numeric AS margem,
           COALESCE((SELECT taxa_cartao FROM public.configuracoes_precificacao ORDER BY id LIMIT 1), 0)::numeric AS taxa,
           COALESCE((SELECT estimativa_pedidos_mes FROM public.configuracoes_sistema ORDER BY created_at NULLS LAST, id LIMIT 1), 0)::numeric AS pedidos_mes,
           COALESCE((SELECT quantidade_sacolas_por_pedido FROM public.configuracoes_sistema ORDER BY created_at NULLS LAST, id LIMIT 1), 0)::numeric AS sacolas_pedido,
           COALESCE((SELECT sacola_estoque_id FROM public.configuracoes_sistema ORDER BY created_at NULLS LAST, id LIMIT 1), NULL)::uuid AS sacola_id,
           COALESCE((SELECT preco_final FROM public.produtos WHERE id = p_produto_id), (SELECT preco FROM public.produtos WHERE id = p_produto_id), 0)::numeric AS preco_atual,
           COALESCE((SELECT sem_embalagem_avulsa FROM public.produtos WHERE id = p_produto_id), false) AS sem_embalagem
), ficha AS (
    SELECT COALESCE(SUM(pc.quantidade * e.custo_unitario), 0)::numeric AS total,
           COALESCE(jsonb_agg(jsonb_build_object('estoque_id', e.id, 'nome', e.nome, 'categoria', e.categoria_item, 'quantidade', pc.quantidade, 'custo_unitario', e.custo_unitario, 'custo_total', pc.quantidade * e.custo_unitario) ORDER BY e.nome) FILTER (WHERE e.id IS NOT NULL), '[]'::jsonb) AS itens
    FROM public.produto_composicao pc JOIN public.estoque e ON e.id = pc.insumo_id
    WHERE pc.produto_id = p_produto_id
), emb AS (
    SELECT COUNT(pe.embalagem_id) > 0 AS configurada,
           COALESCE(SUM(ec.quantidade * e.custo_unitario), 0)::numeric AS total,
           COALESCE(jsonb_agg(jsonb_build_object('estoque_id', e.id, 'nome', e.nome, 'quantidade', ec.quantidade, 'custo_unitario', e.custo_unitario, 'custo_total', ec.quantidade * e.custo_unitario) ORDER BY e.nome) FILTER (WHERE e.id IS NOT NULL), '[]'::jsonb) AS itens
    FROM public.produto_embalagens pe
    JOIN public.embalagem_componentes ec ON ec.embalagem_id = pe.embalagem_id
    JOIN public.estoque e ON e.id = ec.estoque_id
    WHERE pe.produto_id = p_produto_id
), sac AS (
    SELECT COALESCE(e.custo_unitario, 0)::numeric AS custo_unitario
    FROM cfg LEFT JOIN public.estoque e ON e.id = cfg.sacola_id
), ops AS (
    SELECT COALESCE(SUM(valor_mensal), 0)::numeric AS total,
           COALESCE(jsonb_agg(jsonb_build_object('nome', nome, 'valor_mensal', valor_mensal) ORDER BY nome), '[]'::jsonb) AS itens
    FROM public.custos_operacionais
    WHERE ativo = true
), base AS (
    SELECT p.id, p.tempo_producao, f.total AS ficha, f.itens AS ficha_itens, e.total AS embalagem,
           e.itens AS embalagem_itens, e.configurada, c.*, s.custo_unitario AS sacola_unitario,
           (o.total + (c.pedidos_mes * c.sacolas_pedido * s.custo_unitario)) AS ops_total, o.itens AS ops_itens
    FROM public.produtos p CROSS JOIN cfg c CROSS JOIN ficha f CROSS JOIN emb e CROSS JOIN sac s CROSS JOIN ops o
    WHERE p.id = p_produto_id
), calc AS (
    SELECT b.*, (b.horas_dia * b.dias_semana * 4.33) AS horas_mes,
           (CASE WHEN b.horas_dia * b.dias_semana * 4.33 > 0 THEN b.pro_labore / (b.horas_dia * b.dias_semana * 4.33) ELSE 0 END) AS v_hora,
           (b.pedidos_mes * b.sacolas_pedido * b.sacola_unitario) AS sacolas_mes
    FROM base b
)
SELECT id, ficha, (tempo_producao / 60.0) * v_hora,
       (tempo_producao / 60.0) * CASE WHEN horas_mes > 0 THEN ops_total / horas_mes ELSE 0 END,
       sacolas_mes, pedidos_mes, sacolas_pedido, sacola_unitario,
       ficha + (tempo_producao / 60.0) * v_hora + (tempo_producao / 60.0) * CASE WHEN horas_mes > 0 THEN ops_total / horas_mes ELSE 0 END,
       CASE WHEN sem_embalagem THEN 0 ELSE embalagem END,
       ficha + (tempo_producao / 60.0) * v_hora + (tempo_producao / 60.0) * CASE WHEN horas_mes > 0 THEN ops_total / horas_mes ELSE 0 END + CASE WHEN sem_embalagem THEN 0 ELSE embalagem END,
       horas_mes, v_hora, CASE WHEN horas_mes > 0 THEN ops_total / horas_mes ELSE 0 END,
       margem, taxa,
       CASE WHEN margem < 100 THEN (ficha + (tempo_producao / 60.0) * v_hora + (tempo_producao / 60.0) * CASE WHEN horas_mes > 0 THEN ops_total / horas_mes ELSE 0 END + CASE WHEN sem_embalagem THEN 0 ELSE embalagem END) / NULLIF(1 - margem / 100, 0) ELSE 0 END,
       CASE WHEN taxa < 100 AND margem < 100 THEN ((ficha + (tempo_producao / 60.0) * v_hora + (tempo_producao / 60.0) * CASE WHEN horas_mes > 0 THEN ops_total / horas_mes ELSE 0 END + CASE WHEN sem_embalagem THEN 0 ELSE embalagem END) / NULLIF(1 - margem / 100, 0)) / NULLIF(1 - taxa / 100, 0) ELSE 0 END,
       preco_atual,
       CASE WHEN preco_atual > 0 THEN ((preco_atual - (ficha + (tempo_producao / 60.0) * v_hora + (tempo_producao / 60.0) * CASE WHEN horas_mes > 0 THEN ops_total / horas_mes ELSE 0 END + CASE WHEN sem_embalagem THEN 0 ELSE embalagem END)) / preco_atual) * 100 ELSE 0 END,
       configurada, sem_embalagem, ficha_itens, embalagem_itens,
       jsonb_build_object('custos_cadastrados', ops_itens, 'total_mensal', ops_total, 'sacolas_mensal', sacolas_mes, 'horas_mensais', horas_mes)
FROM calc;
$$;

REVOKE ALL ON FUNCTION public.calcular_custo_atual_produto(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calcular_custo_atual_produto(uuid) TO authenticated;

-- A chave identifica a intenção, independentemente dos valores econômicos.
-- O lock da chave serializa retries; o lock da linha serializa confirmações do produto.
CREATE OR REPLACE FUNCTION public.confirmar_precificacao_v2(
    p_operacao_id uuid, p_produto_id uuid, p_preco_final numeric,
    p_margem_desejada numeric, p_tempo_producao numeric,
    p_componentes jsonb, p_sem_embalagem boolean
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_solicitacao jsonb;
    v_previa public.precificacoes_v2%ROWTYPE;
    v_produto public.produtos%ROWTYPE;
    v_item jsonb;
    v_estoque_id uuid;
    v_quantidade numeric;
    v_custo_unitario numeric;
    v_categoria text;
    v_estoque_visto uuid[] := ARRAY[]::uuid[];
    c record;
    novo_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;
    IF p_operacao_id IS NULL OR p_produto_id IS NULL
       OR p_preco_final IS NULL OR p_margem_desejada IS NULL
       OR p_tempo_producao IS NULL
       OR p_preco_final::text IN ('NaN', 'Infinity', '-Infinity')
       OR p_margem_desejada::text IN ('NaN', 'Infinity', '-Infinity')
       OR p_tempo_producao::text IN ('NaN', 'Infinity', '-Infinity')
       OR p_preco_final <= 0 OR p_margem_desejada < 0
       OR p_margem_desejada >= 100 OR p_tempo_producao <= 0 THEN
        RAISE EXCEPTION 'Parâmetros de precificação inválidos.';
    END IF;

    v_solicitacao := jsonb_build_object(
        'produto_id', p_produto_id, 'preco_final', p_preco_final,
        'margem_desejada', p_margem_desejada,
        'tempo_producao', p_tempo_producao,
        'componentes', p_componentes,
        'sem_embalagem', p_sem_embalagem
    );

    -- Chaves iguais aguardam a transação anterior antes de consultar o histórico.
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_operacao_id::text, 0)
    );
    SELECT * INTO v_previa
    FROM public.precificacoes_v2
    WHERE operacao_id = p_operacao_id;
    IF FOUND THEN
        IF v_previa.criado_por IS DISTINCT FROM auth.uid()
           OR v_previa.requisicao_confirmacao IS DISTINCT FROM v_solicitacao THEN
            RAISE EXCEPTION 'Chave de confirmação já utilizada em outra solicitação.';
        END IF;
        RETURN v_previa.id;
    END IF;

    SELECT * INTO v_produto
    FROM public.produtos
    WHERE id = p_produto_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado.';
    END IF;

    IF pg_catalog.jsonb_typeof(p_componentes) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'A Ficha Técnica precisa conter uma lista válida de componentes.';
    END IF;
    IF pg_catalog.jsonb_array_length(p_componentes) = 0 THEN
        RAISE EXCEPTION 'A Ficha Técnica precisa conter uma lista válida de componentes.';
    END IF;

    FOR v_item IN SELECT value FROM pg_catalog.jsonb_array_elements(p_componentes)
    LOOP
        IF pg_catalog.jsonb_typeof(v_item) IS DISTINCT FROM 'object'
           OR pg_catalog.jsonb_typeof(v_item->'estoque_id') IS DISTINCT FROM 'string'
           OR pg_catalog.jsonb_typeof(v_item->'quantidade') IS DISTINCT FROM 'number' THEN
            RAISE EXCEPTION 'Componente da Ficha Técnica com estrutura inválida.';
        END IF;
        BEGIN
            v_estoque_id := (v_item->>'estoque_id')::uuid;
            v_quantidade := (v_item->>'quantidade')::numeric;
        EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
            RAISE EXCEPTION 'Componente da Ficha Técnica com identificador ou quantidade inválida.';
        END;
        IF v_estoque_id IS NULL OR v_quantidade IS NULL OR v_quantidade <= 0
           OR v_quantidade::text IN ('NaN', 'Infinity', '-Infinity') THEN
            RAISE EXCEPTION 'A quantidade da Ficha Técnica deve ser maior que zero.';
        END IF;
        IF v_estoque_id = ANY(v_estoque_visto) THEN
            RAISE EXCEPTION 'Item de Estoque repetido na Ficha Técnica: %.', v_estoque_id;
        END IF;
        v_estoque_visto := pg_catalog.array_append(v_estoque_visto, v_estoque_id);

        SELECT e.custo_unitario, e.categoria_item
        INTO v_custo_unitario, v_categoria
        FROM public.estoque e
        WHERE e.id = v_estoque_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item de Estoque da Ficha Técnica não encontrado: %.', v_estoque_id;
        END IF;
        IF v_custo_unitario IS NULL OR v_custo_unitario < 0
           OR v_custo_unitario::text IN ('NaN', 'Infinity', '-Infinity') THEN
            RAISE EXCEPTION 'Custo atual inválido para o item de Estoque: %.', v_estoque_id;
        END IF;
        IF pg_catalog.lower(pg_catalog.coalesce(v_categoria, '')) = 'embalagem' THEN
            RAISE EXCEPTION 'Item classificado como embalagem está na Ficha Técnica; revise a classificação antes de confirmar: %.', v_estoque_id;
        END IF;
        IF EXISTS (
            SELECT 1 FROM public.produto_embalagens pe
            JOIN public.embalagem_componentes ec ON ec.embalagem_id = pe.embalagem_id
            WHERE pe.produto_id = p_produto_id AND ec.estoque_id = v_estoque_id
        ) THEN
            RAISE EXCEPTION 'Item da embalagem M03 também está na Ficha Técnica: %.', v_estoque_id;
        END IF;
        IF EXISTS (
            SELECT 1 FROM public.configuracoes_sistema cs
            WHERE cs.sacola_estoque_id = v_estoque_id
        ) THEN
            RAISE EXCEPTION 'A sacola padrão participa dos Custos Operacionais e não pode estar na Ficha Técnica.';
        END IF;
    END LOOP;

    DELETE FROM public.produto_composicao WHERE produto_id = p_produto_id;
    INSERT INTO public.produto_composicao (produto_id, insumo_id, quantidade)
    SELECT p_produto_id, (x->>'estoque_id')::uuid, (x->>'quantidade')::numeric
    FROM pg_catalog.jsonb_array_elements(p_componentes) x;

    UPDATE public.produtos
    SET tempo_producao = p_tempo_producao,
        margem_lucro = p_margem_desejada,
        sem_embalagem_avulsa = COALESCE(p_sem_embalagem, sem_embalagem_avulsa),
        preco_final = p_preco_final,
        preco = p_preco_final
    WHERE id = p_produto_id;

    SELECT * INTO c FROM public.calcular_custo_atual_produto(p_produto_id);
    IF NOT FOUND OR c.taxa_cartao IS NULL OR c.taxa_cartao < 0
       OR c.taxa_cartao >= 100 OR c.horas_mensais <= 0
       OR c.custo_venda_avulsa < 0 THEN
        RAISE EXCEPTION 'Parâmetros econômicos atuais inválidos para confirmar a precificação.';
    END IF;

    INSERT INTO public.precificacoes_v2 (
        operacao_id, requisicao_confirmacao, produto_id, custo_ficha_tecnica,
        custo_mao_obra, custo_operacional, custo_sacolas_estimado,
        estimativa_pedidos_mes, quantidade_sacolas_por_pedido,
        custo_unitario_sacola, custo_producao, custo_embalagem_avulsa,
        custo_venda_avulsa, margem_desejada, taxa_cartao,
        preco_base_sugerido, preco_oficial_sugerido, preco_final_oficial,
        margem_real, parametros_mao_obra, informacoes_custos_operacionais,
        embalagem_configurada, sem_embalagem_avulsa, criado_por
    ) VALUES (
        p_operacao_id, v_solicitacao, p_produto_id, c.custo_ficha_tecnica,
        c.custo_mao_obra, c.custo_operacional, c.custo_sacolas_estimado,
        c.estimativa_pedidos_mes, c.quantidade_sacolas_por_pedido,
        c.custo_unitario_sacola, c.custo_producao, c.custo_embalagem_avulsa,
        c.custo_venda_avulsa, p_margem_desejada, c.taxa_cartao,
        c.custo_venda_avulsa / (1 - p_margem_desejada / 100),
        (c.custo_venda_avulsa / (1 - p_margem_desejada / 100))
            / (1 - c.taxa_cartao / 100),
        p_preco_final, c.margem_atual,
        jsonb_build_object(
            'pro_labore', c.valor_hora * c.horas_mensais,
            'horas_mensais', c.horas_mensais,
            'valor_hora', c.valor_hora,
            'tempo_producao_minutos', p_tempo_producao
        ),
        c.informacoes_custos_operacionais, c.embalagem_configurada,
        c.sem_embalagem_avulsa, auth.uid()
    ) RETURNING id INTO novo_id;

    INSERT INTO public.precificacoes_v2_componentes (
        precificacao_id, tipo_componente, estoque_id, nome_snapshot,
        categoria_snapshot, quantidade, custo_unitario_snapshot,
        custo_total_snapshot, metadados
    )
    SELECT novo_id, 'ficha_tecnica', (x->>'estoque_id')::uuid,
           x->>'nome', x->>'categoria', (x->>'quantidade')::numeric,
           (x->>'custo_unitario')::numeric, (x->>'custo_total')::numeric,
           '{}'::jsonb
    FROM pg_catalog.jsonb_array_elements(c.ficha_componentes) x;

    INSERT INTO public.precificacoes_v2_componentes (
        precificacao_id, tipo_componente, estoque_id, nome_snapshot,
        categoria_snapshot, quantidade, custo_unitario_snapshot,
        custo_total_snapshot, metadados
    )
    SELECT novo_id, 'embalagem_avulsa', (x->>'estoque_id')::uuid,
           x->>'nome', 'embalagem', (x->>'quantidade')::numeric,
           (x->>'custo_unitario')::numeric, (x->>'custo_total')::numeric,
           '{}'::jsonb
    FROM pg_catalog.jsonb_array_elements(c.embalagem_componentes) x;
    RETURN novo_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_precificacao_v2(
    uuid, uuid, numeric, numeric, numeric, jsonb, boolean
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_precificacao_v2(
    uuid, uuid, numeric, numeric, numeric, jsonb, boolean
) TO authenticated;
COMMIT;
