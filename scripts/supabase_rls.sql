-- =============================================================================
-- investment-ai: Row Level Security (RLS)
-- Issue #63: Configurar Row Level Security (RLS) en Supabase
-- =============================================================================
-- Ejecutar DESPUÉS de supabase_schema.sql en Supabase > SQL Editor

-- =============================================================================
-- TABLA: users
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- El usuario solo puede ver su propio perfil
CREATE POLICY "users: select own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- El usuario solo puede actualizar su propio perfil
CREATE POLICY "users: update own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- El perfil se crea automáticamente via trigger (handle_new_user)
-- No se necesita policy de INSERT para el cliente — lo hace el trigger con SECURITY DEFINER

-- =============================================================================
-- TABLA: assets (lectura pública, escritura solo admin)
-- =============================================================================
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer assets
CREATE POLICY "assets: select authenticated" ON public.assets
    FOR SELECT TO authenticated USING (true);

-- Solo service_role puede insertar/actualizar/eliminar assets
-- (se hace desde Edge Functions con service key, no desde el cliente)

-- =============================================================================
-- TABLA: conversations
-- =============================================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations: select own" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "conversations: insert own" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations: update own" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "conversations: delete own" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TABLA: messages
-- =============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: select own" ON public.messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "messages: insert own" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los mensajes no se editan ni eliminan individualmente
-- (se eliminan en cascada al borrar la conversación)

-- =============================================================================
-- TABLA: portfolios
-- =============================================================================
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolios: select own" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "portfolios: insert own" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios: update own" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "portfolios: delete own" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TABLA: portfolio_items
-- =============================================================================
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_items: select own" ON public.portfolio_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "portfolio_items: insert own" ON public.portfolio_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolio_items: update own" ON public.portfolio_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "portfolio_items: delete own" ON public.portfolio_items
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TABLA: price_alerts (solo usuarios premium pueden crear alertas)
-- =============================================================================
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_alerts: select own" ON public.price_alerts
    FOR SELECT USING (auth.uid() = user_id);

-- Solo premium puede crear alertas — verificamos via join con users
CREATE POLICY "price_alerts: insert premium only" ON public.price_alerts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND subscription_tier = 'premium'
        )
    );

CREATE POLICY "price_alerts: update own" ON public.price_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "price_alerts: delete own" ON public.price_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- Habilitar Realtime para tablas que lo necesitan (issue #72)
-- =============================================================================
-- Ejecutar en Supabase > Database > Replication > Tables:
-- Habilitar: messages, price_alerts

-- O via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_alerts;
