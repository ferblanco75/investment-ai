-- =============================================================================
-- investment-ai: Tabla de cache de precios
-- Issue #67: Edge Function market-data
-- Ejecutar en Supabase > SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.price_cache (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol      TEXT NOT NULL,
    price       NUMERIC(18, 4) NOT NULL,
    change      NUMERIC(10, 4),
    change_pct  NUMERIC(10, 4),
    volume      BIGINT,
    currency    TEXT NOT NULL DEFAULT 'USD',
    source      TEXT NOT NULL DEFAULT 'yahoo',
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS price_cache_symbol_idx ON public.price_cache (symbol);

-- Solo service_role puede escribir (desde Edge Functions)
ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_cache: select authenticated" ON public.price_cache
    FOR SELECT TO authenticated USING (true);
