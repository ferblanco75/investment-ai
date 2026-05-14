import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MINUTES = 15;

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  currency: string;
  source: string;
  fetched_at: string;
}

// Yahoo Finance v8 — sin API key, datos con delay de ~15min
async function fetchFromYahoo(symbol: string): Promise<PriceData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? meta.previousClose;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol: symbol.toUpperCase(),
      price: Math.round(price * 10000) / 10000,
      change: Math.round(change * 10000) / 10000,
      change_pct: Math.round(changePct * 100) / 100,
      volume: meta.regularMarketVolume ?? 0,
      currency: meta.currency ?? 'USD',
      source: 'yahoo',
      fetched_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Alpha Vantage — con API key, más confiable
async function fetchFromAlphaVantage(symbol: string, apiKey: string): Promise<PriceData | null> {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const quote = json?.['Global Quote'];
    if (!quote || !quote['05. price']) return null;

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePct = parseFloat(quote['10. change percent'].replace('%', ''));
    const volume = parseInt(quote['06. volume']);

    return {
      symbol: symbol.toUpperCase(),
      price: Math.round(price * 10000) / 10000,
      change: Math.round(change * 10000) / 10000,
      change_pct: Math.round(changePct * 100) / 100,
      volume,
      currency: 'USD',
      source: 'alphavantage',
      fetched_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parsear parámetros: GET /market-data?symbols=AAPL,BTC-USD,GGAL.BA
    const url = new URL(req.url);
    const symbolsParam = url.searchParams.get('symbols');
    if (!symbolsParam) {
      return new Response(JSON.stringify({ error: 'Parámetro symbols requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).slice(0, 10);
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY') ?? '';
    const results: Record<string, PriceData | null> = {};

    for (const symbol of symbols) {
      // 1. Verificar cache — si tiene datos frescos (menos de CACHE_TTL_MINUTES), usarlos
      const { data: cached } = await supabaseAdmin
        .from('price_cache')
        .select('*')
        .eq('symbol', symbol)
        .gte('fetched_at', new Date(Date.now() - CACHE_TTL_MINUTES * 60 * 1000).toISOString())
        .single();

      if (cached) {
        results[symbol] = cached as PriceData;
        continue;
      }

      // 2. Buscar en Yahoo Finance
      let data = await fetchFromYahoo(symbol);

      // 3. Fallback a Alpha Vantage si Yahoo falla y hay key
      if (!data && alphaVantageKey) {
        data = await fetchFromAlphaVantage(symbol, alphaVantageKey);
      }

      if (data) {
        // Guardar en cache (upsert por symbol)
        await supabaseAdmin
          .from('price_cache')
          .upsert(data, { onConflict: 'symbol' });
      }

      results[symbol] = data;
    }

    return new Response(
      JSON.stringify({ data: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en market-data:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
