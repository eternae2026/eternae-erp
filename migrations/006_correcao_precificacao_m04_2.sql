-- M04.2: atualiza apenas a RPC instalada pela migration 005.
-- A 005 permanece intocada e não deve ser reexecutada.
BEGIN;

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
        IF pg_catalog.lower(COALESCE(v_categoria, ''::text)) = 'embalagem' THEN
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

    IF COALESCE(p_sem_embalagem, v_produto.sem_embalagem_avulsa) AND EXISTS (
        SELECT 1 FROM public.produto_embalagens
        WHERE produto_id = p_produto_id
    ) THEN
        RAISE EXCEPTION 'O produto possui embalagem M03 associada. Remova a associação explicitamente antes de confirmar sem embalagem.';
    END IF;

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
