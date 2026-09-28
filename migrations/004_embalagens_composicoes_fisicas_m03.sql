-- ERP Eternaê V2 — M03: embalagens e composições físicas
-- Migration aditiva. Não altera preços, kits comerciais, pedidos ou estoque.
-- Não executar em produção sem o preflight e a autorização do processo oficial.

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.estoque') IS NULL
       OR to_regclass('public.produtos') IS NULL
       OR to_regclass('public.kits') IS NULL
       OR to_regclass('public.configuracoes_sistema') IS NULL THEN
        RAISE EXCEPTION 'M03 abortada: falta uma tabela-base esperada.';
    END IF;
    IF to_regclass('public.embalagens_fisicas') IS NOT NULL
       OR to_regclass('public.embalagem_componentes') IS NOT NULL
       OR to_regclass('public.produto_embalagens') IS NOT NULL
       OR to_regclass('public.kit_embalagens') IS NOT NULL THEN
        RAISE EXCEPTION 'M03 abortada: uma ou mais estruturas novas já existem.';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'configuracoes_sistema'
          AND column_name = 'sacola_estoque_id'
    ) THEN
        RAISE EXCEPTION 'M03 abortada: sacola_estoque_id já existe.';
    END IF;
END
$$;

CREATE TABLE public.embalagens_fisicas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    tipo text NOT NULL,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT embalagens_fisicas_nome_check CHECK (btrim(nome) <> ''),
    CONSTRAINT embalagens_fisicas_tipo_check CHECK (tipo IN ('produto', 'kit', 'premium')),
    CONSTRAINT embalagens_fisicas_id_tipo_unique UNIQUE (id, tipo)
);

CREATE TABLE public.embalagem_componentes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    embalagem_id uuid NOT NULL,
    estoque_id uuid NOT NULL,
    quantidade numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT embalagem_componentes_embalagem_fkey
        FOREIGN KEY (embalagem_id) REFERENCES public.embalagens_fisicas(id)
        ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT embalagem_componentes_estoque_fkey
        FOREIGN KEY (estoque_id) REFERENCES public.estoque(id)
        ON UPDATE NO ACTION ON DELETE RESTRICT,
    CONSTRAINT embalagem_componentes_quantidade_check CHECK (quantidade > 0),
    CONSTRAINT embalagem_componentes_item_unique UNIQUE (embalagem_id, estoque_id)
);

CREATE TABLE public.produto_embalagens (
    produto_id uuid PRIMARY KEY,
    embalagem_id uuid NOT NULL,
    tipo text NOT NULL DEFAULT 'produto',
    CONSTRAINT produto_embalagens_tipo_check CHECK (tipo = 'produto'),
    CONSTRAINT produto_embalagens_produto_fkey
        FOREIGN KEY (produto_id) REFERENCES public.produtos(id)
        ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT produto_embalagens_embalagem_fkey
        FOREIGN KEY (embalagem_id, tipo) REFERENCES public.embalagens_fisicas(id, tipo)
        ON UPDATE NO ACTION ON DELETE RESTRICT
);

CREATE TABLE public.kit_embalagens (
    kit_id uuid PRIMARY KEY,
    embalagem_id uuid NOT NULL,
    tipo text NOT NULL DEFAULT 'kit',
    CONSTRAINT kit_embalagens_tipo_check CHECK (tipo = 'kit'),
    CONSTRAINT kit_embalagens_kit_fkey
        FOREIGN KEY (kit_id) REFERENCES public.kits(id)
        ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT kit_embalagens_embalagem_fkey
        FOREIGN KEY (embalagem_id, tipo) REFERENCES public.embalagens_fisicas(id, tipo)
        ON UPDATE NO ACTION ON DELETE RESTRICT
);

ALTER TABLE public.configuracoes_sistema
    ADD COLUMN sacola_estoque_id uuid;

ALTER TABLE public.configuracoes_sistema
    ADD CONSTRAINT configuracoes_sistema_sacola_estoque_fkey
    FOREIGN KEY (sacola_estoque_id) REFERENCES public.estoque(id)
    ON UPDATE NO ACTION ON DELETE RESTRICT;

CREATE INDEX idx_embalagem_componentes_estoque_id
    ON public.embalagem_componentes (estoque_id);
CREATE INDEX idx_produto_embalagens_embalagem_id
    ON public.produto_embalagens (embalagem_id);
CREATE INDEX idx_kit_embalagens_embalagem_id
    ON public.kit_embalagens (embalagem_id);
CREATE INDEX idx_embalagens_fisicas_tipo_ativo
    ON public.embalagens_fisicas (tipo, ativo);

ALTER TABLE public.embalagens_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embalagem_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_embalagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_embalagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_embalagens_fisicas"
    ON public.embalagens_fisicas FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_embalagem_componentes"
    ON public.embalagem_componentes FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_produto_embalagens"
    ON public.produto_embalagens FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_kit_embalagens"
    ON public.kit_embalagens FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

REVOKE ALL ON public.embalagens_fisicas, public.embalagem_componentes,
    public.produto_embalagens, public.kit_embalagens FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embalagens_fisicas,
    public.embalagem_componentes, public.produto_embalagens,
    public.kit_embalagens TO authenticated;

COMMIT;
