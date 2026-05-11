-- =============================================================================
-- investment-ai: Supabase Schema
-- Issue #62: Setup proyecto Supabase (esquema de base de datos)
-- =============================================================================
-- Ejecutar este SQL en Supabase > SQL Editor

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLA: users (perfil extendido — complementa auth.users de Supabase)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_ends_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para crear perfil de usuario automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- TABLA: assets (instrumentos financieros — compartida, no por usuario)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol      TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    asset_type  TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto', 'etf', 'bond', 'cedear')),
    currency    TEXT NOT NULL DEFAULT 'USD',
    exchange    TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índice para búsqueda por símbolo
CREATE INDEX IF NOT EXISTS assets_symbol_idx ON public.assets (symbol);
CREATE INDEX IF NOT EXISTS assets_type_idx ON public.assets (asset_type);

-- Datos iniciales de assets comunes
INSERT INTO public.assets (symbol, name, asset_type, currency, exchange) VALUES
    ('BTC', 'Bitcoin', 'crypto', 'USD', 'CRYPTO'),
    ('ETH', 'Ethereum', 'crypto', 'USD', 'CRYPTO'),
    ('AAPL', 'Apple Inc.', 'stock', 'USD', 'NASDAQ'),
    ('MSFT', 'Microsoft Corporation', 'stock', 'USD', 'NASDAQ'),
    ('GOOGL', 'Alphabet Inc.', 'stock', 'USD', 'NASDAQ'),
    ('AMZN', 'Amazon.com Inc.', 'stock', 'USD', 'NASDAQ'),
    ('SPY', 'SPDR S&P 500 ETF Trust', 'etf', 'USD', 'NYSE'),
    ('QQQ', 'Invesco QQQ Trust', 'etf', 'USD', 'NASDAQ'),
    ('GGAL', 'Grupo Financiero Galicia', 'cedear', 'ARS', 'BCBA'),
    ('YPF', 'YPF S.A.', 'cedear', 'ARS', 'BCBA')
ON CONFLICT (symbol) DO NOTHING;

-- =============================================================================
-- TABLA: conversations (historial de chat con la IA)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations (user_id);

-- =============================================================================
-- TABLA: messages (mensajes individuales dentro de una conversación)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at DESC);

-- =============================================================================
-- TABLA: portfolios (portafolios de inversión del usuario)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.portfolios (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL DEFAULT 'Mi Portafolio',
    description TEXT,
    currency    TEXT NOT NULL DEFAULT 'USD',
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS portfolios_user_id_idx ON public.portfolios (user_id);

-- =============================================================================
-- TABLA: portfolio_items (activos dentro de un portafolio)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES public.assets(id),
    quantity        NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
    average_price   NUMERIC(18, 4) NOT NULL CHECK (average_price > 0),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (portfolio_id, asset_id)
);

CREATE TRIGGER portfolio_items_updated_at
    BEFORE UPDATE ON public.portfolio_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS portfolio_items_portfolio_id_idx ON public.portfolio_items (portfolio_id);
CREATE INDEX IF NOT EXISTS portfolio_items_user_id_idx ON public.portfolio_items (user_id);

-- =============================================================================
-- TABLA: price_alerts (alertas de precio — solo usuarios premium)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES public.assets(id),
    condition       TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    target_price    NUMERIC(18, 4) NOT NULL CHECK (target_price > 0),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at    TIMESTAMPTZ,
    notified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER price_alerts_updated_at
    BEFORE UPDATE ON public.price_alerts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS price_alerts_user_id_idx ON public.price_alerts (user_id);
CREATE INDEX IF NOT EXISTS price_alerts_active_idx ON public.price_alerts (is_active) WHERE is_active = TRUE;
