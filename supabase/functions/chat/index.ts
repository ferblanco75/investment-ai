import Anthropic from 'npm:@anthropic-ai/sdk@0.27.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detecta símbolos financieros mencionados en el mensaje del usuario
function extractSymbols(text: string): string[] {
  // Patrones: AAPL, BTC-USD, GGAL.BA, $MSFT
  const matches = text.match(/\$?[A-Z]{1,5}(?:[.-][A-Z]{1,3})?/g) ?? [];
  const STOPWORDS = new Set(['ES', 'EN', 'EL', 'LA', 'LOS', 'LAS', 'UN', 'UNA', 'QUE', 'DE', 'A', 'Y', 'O', 'SE', 'NO', 'ME', 'TE', 'SI', 'ETF', 'FCI']);
  return [...new Set(matches
    .map(s => s.replace('$', ''))
    .filter(s => s.length >= 2 && !STOPWORDS.has(s))
  )].slice(0, 5);
}

// Consulta precios desde la tabla price_cache (ya poblada por market-data function)
async function getPriceContext(symbols: string[], supabaseAdmin: ReturnType<typeof createClient>): Promise<string> {
  if (symbols.length === 0) return '';

  const { data } = await supabaseAdmin
    .from('price_cache')
    .select('symbol, price, change, change_pct, currency, fetched_at')
    .in('symbol', symbols);

  if (!data || data.length === 0) return '';

  const lines = data.map((q: { symbol: string; price: number; change: number; change_pct: number; currency: string; fetched_at: string }) => {
    const sign = q.change >= 0 ? '+' : '';
    const age = Math.round((Date.now() - new Date(q.fetched_at).getTime()) / 60000);
    return `${q.symbol}: ${q.currency} ${q.price} (${sign}${q.change_pct}%) — hace ${age} min`;
  });

  return `\n\n[Precios de mercado disponibles]\n${lines.join('\n')}\n(Datos orientativos con posible delay)`;
}

const BASE_SYSTEM_PROMPT = `Sos un asesor de inversiones experto especializado en el mercado argentino e internacional.
Tu rol es explicar conceptos financieros de forma clara y accesible, ayudar a entender instrumentos de inversión
(acciones, bonos, CEDEARs, criptomonedas, ETFs, FCI), analizar riesgos y oportunidades, y orientar al usuario
según su perfil inversor.

Reglas:
- Respondé siempre en español argentino (tuteo)
- Sé concreto y didáctico, evitá el lenguaje excesivamente técnico
- Si el contexto incluye precios de mercado, usálos en tu respuesta y mencioná que pueden no ser en tiempo real
- No prometás rendimientos ni garantizés resultados
- Si el usuario pregunta algo fuera del ámbito financiero, redirigilo amablemente al tema de inversiones
- Usá ejemplos con números concretos cuando ayude a entender`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, conversation_id } = await req.json();

    if (!message?.trim() || !conversation_id) {
      return new Response(JSON.stringify({ error: 'message y conversation_id son requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que la conversación pertenece al usuario
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (convError || !conv) {
      return new Response(JSON.stringify({ error: 'Conversación no encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Recuperar historial + precios en paralelo
    const [historyResult, priceContext] = await Promise.all([
      supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(20),
      getPriceContext(extractSymbols(message), supabaseAdmin),
    ]);

    const history = historyResult.data ?? [];

    // Guardar mensaje del usuario
    const { data: userMsg } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id,
        user_id: user.id,
        role: 'user',
        content: message.trim(),
      })
      .select('id')
      .single();

    // System prompt con contexto de precios si aplica
    const systemPrompt = BASE_SYSTEM_PROMPT + priceContext;

    const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message.trim() },
    ];

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // Guardar respuesta y actualizar conversación en paralelo
    const [botMsgResult] = await Promise.all([
      supabaseAdmin
        .from('messages')
        .insert({
          conversation_id,
          user_id: user.id,
          role: 'assistant',
          content: reply,
          tokens_used: tokensUsed,
        })
        .select('id')
        .single(),
      supabaseAdmin
        .from('conversations')
        .update({
          title: message.trim().slice(0, 60),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation_id)
        .or('title.is.null,title.eq.Nueva conversación'),
    ]);

    return new Response(
      JSON.stringify({
        reply,
        message_id: botMsgResult.data?.id,
        user_message_id: userMsg?.id,
        tokens_used: tokensUsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en Edge Function chat:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
