#!/bin/bash

# Script para crear issues de Investment Explainer AI en GitHub
# Uso: ./create-github-issues.sh [owner/repo]
# Ejemplo: ./create-github-issues.sh tuusuario/investment-explainer-ai

set -e

REPO=${1:-""}

if [ -z "$REPO" ]; then
    echo "❌ Error: Debes proporcionar el nombre del repositorio"
    echo "Uso: ./create-github-issues.sh owner/repo"
    echo "Ejemplo: ./create-github-issues.sh tuusuario/investment-explainer-ai"
    exit 1
fi

echo "🚀 Creando issues para $REPO"
echo ""

# Verificar que gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) no está instalado"
    echo "Instalalo desde: https://cli.github.com/"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "❌ No estás autenticado con GitHub CLI"
    echo "Ejecuta: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI configurado correctamente"
echo ""
echo "Creando labels..."

# Crear labels
gh label create "phase-1" --color "0E8A16" --description "Backend & LLM (Semanas 1-2)" --repo "$REPO" 2>/dev/null || true
gh label create "phase-2" --color "1D76DB" --description "Frontend & UI (Semanas 3-4)" --repo "$REPO" 2>/dev/null || true
gh label create "phase-3" --color "5319E7" --description "Features Core & Monetización (Semanas 5-6)" --repo "$REPO" 2>/dev/null || true
gh label create "phase-4" --color "D93F0B" --description "Testing & Launch (Semanas 7-8)" --repo "$REPO" 2>/dev/null || true
gh label create "priority-high" --color "D73A4A" --description "Crítico para MVP" --repo "$REPO" 2>/dev/null || true
gh label create "priority-medium" --color "FBCA04" --description "Importante pero no bloqueante" --repo "$REPO" 2>/dev/null || true
gh label create "priority-low" --color "0075CA" --description "Nice to have" --repo "$REPO" 2>/dev/null || true
gh label create "enhancement" --color "A2EEEF" --description "Mejora" --repo "$REPO" 2>/dev/null || true

echo "✅ Labels creados"
echo ""
echo "Creando issues..."
echo ""

# FASE 1: BACKEND & LLM

gh issue create --repo "$REPO" \
  --title "Setup del repositorio y estructura del backend" \
  --label "phase-1,priority-high" \
  --body "## Descripción
Configurar la estructura inicial del proyecto backend con FastAPI.

## Tasks
- [ ] Crear repositorio en GitHub
- [ ] Setup estructura de carpetas según ARQUITECTURA.md
- [ ] Configurar \`.gitignore\` para Python
- [ ] Crear \`requirements.txt\` con dependencias base
- [ ] Configurar pre-commit hooks (black, flake8)
- [ ] Agregar README.md con instrucciones de setup
- [ ] Crear \`.env.example\` con variables necesarias

## Criterios de aceptación
- El proyecto se puede clonar y correr con \`uvicorn app.main:app --reload\`
- Pre-commit hooks funcionan correctamente
- Documentación básica está presente

## Semana
Semana 1"

echo "✅ Issue #1 creado"

gh issue create --repo "$REPO" \
  --title "Configurar base de datos PostgreSQL y modelos" \
  --label "phase-1,priority-high" \
  --body "## Descripción
Implementar modelos de base de datos con SQLAlchemy y configurar Alembic para migraciones.

## Tasks
- [ ] Instalar PostgreSQL localmente o usar Vercel Postgres
- [ ] Configurar SQLAlchemy en \`database.py\`
- [ ] Crear modelo \`User\` con campos según ARQUITECTURA.md
- [ ] Crear modelo \`Conversation\`
- [ ] Crear modelo \`Message\`
- [ ] Crear modelo \`Asset\`
- [ ] Crear modelo \`Portfolio\` y \`PortfolioItem\`
- [ ] Configurar Alembic
- [ ] Crear migración inicial
- [ ] Aplicar migraciones: \`alembic upgrade head\`

## Criterios de aceptación
- Todas las tablas se crean correctamente
- Relaciones FK funcionan
- Migraciones son reproducibles

## Documentación relacionada
Ver \`docs/ARQUITECTURA.md\` sección \"Base de Datos\"

## Semana
Semana 1"

echo "✅ Issue #2 creado"

gh issue create --repo "$REPO" \
  --title "Implementar sistema de autenticación JWT" \
  --label "phase-1,priority-high" \
  --body "## Descripción
Sistema completo de registro, login y autenticación con JWT tokens.

## Tasks
- [ ] Crear endpoint \`POST /api/v1/auth/register\`
  - Validar email único
  - Hashear password con bcrypt
  - Retornar usuario creado
- [ ] Crear endpoint \`POST /api/v1/auth/login\`
  - Validar credenciales
  - Generar JWT token
  - Retornar token + user data
- [ ] Implementar \`get_current_user\` dependency
- [ ] Crear schemas Pydantic (UserCreate, UserResponse, Token)
- [ ] Agregar tests unitarios (pytest)

## Criterios de aceptación
- Registro funciona con validación de email
- Login retorna JWT token válido
- Token expira después de 24 horas
- Tests pasan con >80% coverage

## Ejemplo de test
\`\`\`python
def test_register_user(client):
    response = client.post(\"/api/v1/auth/register\", json={
        \"email\": \"test@example.com\",
        \"password\": \"securepassword123\"
    })
    assert response.status_code == 201
    assert \"id\" in response.json()
\`\`\`

## Semana
Semana 1"

echo "✅ Issue #3 creado"

gh issue create --repo "$REPO" \
  --title "Integrar Claude API para explicaciones" \
  --label "phase-1,priority-high" \
  --body "## Descripción
Crear servicio para integrar Claude API y generar explicaciones de activos financieros.

## Tasks
- [ ] Instalar \`anthropic\` SDK
- [ ] Crear \`ClaudeService\` en \`app/services/claude_service.py\`
- [ ] Implementar método \`explain_asset(symbol, asset_data)\`
- [ ] Diseñar prompt template para explicaciones
- [ ] Manejar errores de API (rate limits, timeouts)
- [ ] Agregar logging de requests
- [ ] Testear con diferentes activos (AAPL, BTC, etc)

## Criterios de aceptación
- Explicaciones son coherentes y en español rioplatense
- Respuestas tienen 3-4 párrafos
- Manejo de errores apropiado
- Tiempo de respuesta <5 segundos

## Ejemplo de uso
\`\`\`python
service = ClaudeService()
explanation = await service.explain_asset(\"AAPL\", {
    \"price\": 178.32,
    \"change\": 2.3,
    \"volume\": \"52M\"
})
print(explanation)
\`\`\`

## Semana
Semana 2"

echo "✅ Issue #4 creado"

gh issue create --repo "$REPO" \
  --title "Integrar APIs financieras (Alpha Vantage, Yahoo Finance)" \
  --label "phase-1,priority-high" \
  --body "## Descripción
Servicio para obtener datos de activos en tiempo real.

## Tasks
- [ ] Crear \`FinanceService\` en \`app/services/finance_service.py\`
- [ ] Implementar método \`get_asset_data(symbol)\` con Alpha Vantage
- [ ] Implementar método \`get_historical_data(symbol, period)\` con yfinance
- [ ] Implementar método \`search_assets(query)\` para búsqueda
- [ ] Agregar fallback entre APIs (si una falla, usar otra)
- [ ] Implementar caching simple (dict o Redis)
- [ ] Manejar rate limits

## Criterios de aceptación
- Retorna precio actual, cambio %, volumen
- Datos históricos en formato compatible con Chart.js
- Búsqueda retorna top 5 resultados
- Cache funciona (no llama API si data <5 min)

## Semana
Semana 2"

echo "✅ Issue #5 creado"

gh issue create --repo "$REPO" \
  --title "Implementar rate limiting por usuario" \
  --label "phase-1,priority-high" \
  --body "## Descripción
Sistema de rate limiting: 3 queries/día para free, ilimitado para premium.

## Tasks
- [ ] Crear función \`check_rate_limit(user_id, db)\` en \`utils/rate_limit.py\`
- [ ] Implementar lógica de contador diario
- [ ] Reset automático cada 24 horas
- [ ] Excepciones para usuarios premium
- [ ] Retornar error 429 con mensaje claro
- [ ] Agregar tests

## Criterios de aceptación
- Free users bloqueados después de 3 queries
- Premium users sin restricción
- Contador se resetea a medianoche UTC
- Error message es user-friendly

## Semana
Semana 2"

echo "✅ Issue #6 creado"

gh issue create --repo "$REPO" \
  --title "Crear endpoint de chat principal" \
  --label "phase-1,priority-high" \
  --body "## Descripción
Endpoint que une todo: recibe mensaje, consulta APIs, genera respuesta con Claude.

## Tasks
- [ ] Crear router \`chat.py\`
- [ ] Implementar \`POST /api/v1/chat/explain\`
- [ ] Validar request con Pydantic
- [ ] Extraer símbolo del mensaje (regex simple)
- [ ] Llamar \`FinanceService.get_asset_data()\`
- [ ] Llamar \`ClaudeService.explain_asset()\`
- [ ] Guardar conversación en DB
- [ ] Retornar response con mensaje + chart_data
- [ ] Agregar tests E2E

## Criterios de aceptación
- Endpoint responde en <5 segundos
- Formato de respuesta correcto
- Conversación se guarda en DB
- Tests E2E pasan

## Ejemplo de request
\`\`\`json
POST /api/v1/chat/explain
{
  \"message\": \"Qué es AAPL?\",
  \"conversation_id\": null
}
\`\`\`

## Ejemplo de response
\`\`\`json
{
  \"message\": \"Apple Inc (AAPL) es una empresa...\",
  \"chart_data\": [...],
  \"asset_info\": {
    \"symbol\": \"AAPL\",
    \"price\": 178.32,
    \"change\": 2.3
  }
}
\`\`\`

## Semana
Semana 2"

echo "✅ Issue #7 creado"

gh issue create --repo "$REPO" \
  --title "Tests unitarios del backend" \
  --label "phase-1,priority-medium" \
  --body "## Descripción
Alcanzar >70% de test coverage en el backend.

## Tasks
- [ ] Tests de autenticación (register, login, JWT)
- [ ] Tests de ClaudeService (mocked)
- [ ] Tests de FinanceService (mocked)
- [ ] Tests de rate limiting
- [ ] Tests de endpoints de chat
- [ ] Configurar pytest-cov
- [ ] Generar reporte de coverage

## Criterios de aceptación
- Coverage >70%
- Todos los tests pasan
- CI/CD ejecuta tests automáticamente

## Semana
Semana 2"

echo "✅ Issue #8 creado"

# FASE 2: FRONTEND & UI

gh issue create --repo "$REPO" \
  --title "Setup proyecto Next.js con TypeScript y Tailwind" \
  --label "phase-2,priority-high" \
  --body "## Descripción
Configurar proyecto frontend con Next.js 14, TypeScript y Tailwind CSS.

## Tasks
- [ ] Ejecutar \`npx create-next-app@latest\`
- [ ] Configurar TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Setup estructura de carpetas (/app, /components, /lib, /hooks)
- [ ] Configurar ESLint y Prettier
- [ ] Crear \`tailwind.config.js\` con design tokens del ANEXO-UX.md
- [ ] Agregar font Inter de Google Fonts
- [ ] Setup .env.local con variables

## Criterios de aceptación
- \`npm run dev\` funciona sin errores
- Tailwind CSS aplicado correctamente
- TypeScript sin errores de compilación

## Semana
Semana 3"

echo "✅ Issue #9 creado"

gh issue create --repo "$REPO" \
  --title "Diseñar landing page responsive" \
  --label "phase-2,priority-high" \
  --body "## Descripción
Landing page con hero, features, pricing y CTA.

## Tasks
- [ ] Crear \`/app/page.tsx\`
- [ ] Sección Hero (título, subtitle, CTA)
- [ ] Sección Features (3 features con iconos)
- [ ] Sección video demo (embed YouTube/Vimeo)
- [ ] Sección Pricing (Free vs Premium)
- [ ] Footer con links
- [ ] Responsive mobile, tablet, desktop
- [ ] Animaciones con Framer Motion

## Criterios de aceptación
- Responsive en 320px, 768px, 1024px
- Lighthouse score >90
- CTA lleva a /login o /chat

## Referencia
Ver wireframe en \`anexos/ANEXO-UX.md\`

## Semana
Semana 3"

echo "✅ Issue #10 creado"

gh issue create --repo "$REPO" \
  --title "Implementar pantallas de auth (login/registro)" \
  --label "phase-2,priority-high" \
  --body "## Descripción
Pantallas de login y registro con validación.

## Tasks
- [ ] Crear \`/app/login/page.tsx\`
- [ ] Crear \`/app/register/page.tsx\`
- [ ] Form de login (email, password)
- [ ] Form de registro (email, password, confirm password)
- [ ] Validación con React Hook Form + Zod
- [ ] Llamar API de auth al enviar
- [ ] Guardar JWT en localStorage
- [ ] Redirect a /chat después de login exitoso
- [ ] Mostrar errores user-friendly

## Criterios de aceptación
- Validación funciona (email válido, passwords coinciden)
- JWT se guarda correctamente
- Redirect funciona
- Errores se muestran inline

## Semana
Semana 3"

echo "✅ Issue #11 creado"

gh issue create --repo "$REPO" \
  --title "Crear interfaz de chat con burbujas" \
  --label "phase-2,priority-high" \
  --body "## Descripción
Interfaz conversacional del chatbot.

## Tasks
- [ ] Crear componente \`ChatBubble\` (user vs assistant)
- [ ] Crear componente \`ChatInput\` (textarea auto-resize + botón)
- [ ] Crear componente \`ChatInterface\` (contenedor principal)
- [ ] Implementar scroll automático al final
- [ ] Loading state mientras espera respuesta
- [ ] Manejo de errores
- [ ] Integrar con API backend

## Criterios de aceptación
- Burbujas se ven diferenciadas (user vs bot)
- Input se expande con contenido
- Scroll automático funciona
- Loading spinner se muestra

## Referencia
Ver wireframe en \`anexos/ANEXO-UX.md\`

## Semana
Semana 4"

echo "✅ Issue #12 creado"

gh issue create --repo "$REPO" \
  --title "Implementar componente de gráficos (Chart.js)" \
  --label "phase-2,priority-high" \
  --body "## Descripción
Gráfico de línea para mostrar precio histórico.

## Tasks
- [ ] Instalar \`chart.js\` y \`react-chartjs-2\`
- [ ] Crear componente \`PriceChart\`
- [ ] Configurar line chart con datos de precio
- [ ] Customizar colores según design system
- [ ] Hacer responsive
- [ ] Agregar tooltips al hover
- [ ] Animaciones smooth

## Criterios de aceptación
- Gráfico se renderiza correctamente
- Responsive en mobile y desktop
- Colores coinciden con paleta del proyecto

## Ejemplo de uso
\`\`\`tsx
<PriceChart 
  data={[
    { date: \"2024-01-01\", price: 170 },
    { date: \"2024-01-02\", price: 172 },
    ...
  ]}
/>
\`\`\`

## Semana
Semana 4"

echo "✅ Issue #13 creado"

gh issue create --repo "$REPO" \
  --title "Configurar PWA (manifest.json, service worker)" \
  --label "phase-2,priority-medium" \
  --body "## Descripción
Convertir la app en PWA instalable.

## Tasks
- [ ] Instalar \`next-pwa\`
- [ ] Crear \`public/manifest.json\`
- [ ] Generar iconos (192x192, 512x512)
- [ ] Configurar service worker
- [ ] Testear instalación en mobile
- [ ] Agregar banner \"Agregar a inicio\"

## Criterios de aceptación
- App es instalable desde el navegador
- Funciona offline (básico)
- Iconos se ven correctos

## Semana
Semana 4"

echo "✅ Issue #14 creado"

gh issue create --repo "$REPO" \
  --title "Implementar dark mode toggle" \
  --label "phase-2,priority-low" \
  --body "## Descripción
Toggle para cambiar entre modo claro y oscuro.

## Tasks
- [ ] Instalar \`next-themes\`
- [ ] Crear tema oscuro en Tailwind config
- [ ] Componente toggle (switch)
- [ ] Persistir preferencia en localStorage
- [ ] Aplicar tema en toda la app

## Criterios de aceptación
- Toggle funciona sin flicker
- Preferencia se persiste
- Todos los componentes se adaptan

## Semana
Semana 4"

echo "✅ Issue #15 creado"

# FASE 3: FEATURES CORE & MONETIZACIÓN

gh issue create --repo "$REPO" \
  --title "Integrar Stripe para suscripciones" \
  --label "phase-3,priority-high" \
  --body "## Descripción
Sistema completo de pagos con Stripe.

## Tasks
- [ ] Crear cuenta Stripe (test mode)
- [ ] Instalar \`stripe\` en backend
- [ ] Crear productos en Stripe (Free, Premium \$9.99/mes)
- [ ] Endpoint \`POST /api/v1/subscriptions/create-checkout\`
- [ ] Endpoint \`POST /api/v1/subscriptions/webhook\` (para eventos)
- [ ] Actualizar \`user.subscription_tier\` en DB
- [ ] Integrar Stripe Elements en frontend
- [ ] Testear con tarjetas de prueba

## Criterios de aceptación
- Checkout flow completo funciona
- Webhook actualiza DB correctamente
- Usuarios premium tienen acceso ilimitado

## Referencia
https://stripe.com/docs/billing/subscriptions/overview

## Semana
Semana 5"

echo "✅ Issue #16 creado"

gh issue create --repo "$REPO" \
  --title "Crear pantalla de pricing" \
  --label "phase-3,priority-high" \
  --body "## Descripción
Página de pricing con comparación Free vs Premium.

## Tasks
- [ ] Crear \`/app/pricing/page.tsx\`
- [ ] Diseño de tabla comparativa
- [ ] Highlight de plan Premium
- [ ] CTA \"Empezar Premium\"
- [ ] Redirect a Stripe Checkout
- [ ] Responsive design

## Criterios de aceptación
- Tabla es clara y fácil de entender
- CTA lleva a checkout
- Mobile-friendly

## Semana
Semana 5"

echo "✅ Issue #17 creado"

gh issue create --repo "$REPO" \
  --title "Dashboard de usuario con portfolios" \
  --label "phase-3,priority-medium" \
  --body "## Descripción
Panel donde el usuario ve su portfolio simulado.

## Tasks
- [ ] Crear \`/app/dashboard/page.tsx\`
- [ ] Mostrar plan actual (Free/Premium)
- [ ] Lista de activos en portfolio
- [ ] Cálculo de ganancias/pérdidas
- [ ] Botón \"Agregar activo\"
- [ ] Botón \"Eliminar activo\"
- [ ] Gráfico de performance del portfolio

## Criterios de aceptación
- Portfolio se guarda en DB
- Cálculos son correctos
- UI es intuitiva

## Semana
Semana 6"

echo "✅ Issue #18 creado"

gh issue create --repo "$REPO" \
  --title "Sistema de alertas de precio (Premium)" \
  --label "phase-3,priority-medium" \
  --body "## Descripción
Usuarios premium pueden configurar alertas de precio.

## Tasks
- [ ] Endpoint \`POST /api/v1/alerts\` (crear alerta)
- [ ] Endpoint \`GET /api/v1/alerts\` (listar alertas)
- [ ] Endpoint \`DELETE /api/v1/alerts/{id}\` (eliminar)
- [ ] Background job (Celery opcional) para check de precios
- [ ] Email notification cuando alerta se dispara
- [ ] UI para configurar alertas

## Criterios de aceptación
- Solo premium puede crear alertas
- Email se envía cuando precio alcanza threshold
- Alertas se pueden desactivar

## Semana
Semana 6"

echo "✅ Issue #19 creado"

gh issue create --repo "$REPO" \
  --title "Sistema de emails transaccionales" \
  --label "phase-3,priority-medium" \
  --body "## Descripción
Emails de bienvenida, confirmación de pago, cancelación.

## Tasks
- [ ] Integrar Resend o SendGrid
- [ ] Template: Email de bienvenida
- [ ] Template: Confirmación de suscripción
- [ ] Template: Cancelación de suscripción
- [ ] Template: Alerta de precio disparada
- [ ] Enviar emails en eventos correspondientes

## Criterios de aceptación
- Emails se envían correctamente
- Templates son responsive
- Tasa de delivery >95%

## Semana
Semana 6"

echo "✅ Issue #20 creado"

# FASE 4: TESTING & LAUNCH

gh issue create --repo "$REPO" \
  --title "Tests E2E con Playwright" \
  --label "phase-4,priority-high" \
  --body "## Descripción
Tests end-to-end de flujos críticos.

## Tasks
- [ ] Instalar Playwright
- [ ] Test: Registro → Login → Primera consulta
- [ ] Test: Upgrade a Premium → Checkout exitoso
- [ ] Test: Agregar activo a portfolio
- [ ] Test: Configurar alerta (premium)
- [ ] Ejecutar en CI/CD

## Criterios de aceptación
- Todos los tests pasan
- Tiempo de ejecución <5 minutos

## Semana
Semana 7"

echo "✅ Issue #21 creado"

gh issue create --repo "$REPO" \
  --title "Optimización de performance" \
  --label "phase-4,priority-high" \
  --body "## Descripción
Alcanzar Lighthouse score >90.

## Tasks
- [ ] Code splitting con dynamic imports
- [ ] Optimizar imágenes con next/image
- [ ] Lazy loading de componentes pesados
- [ ] Reducir bundle size (analizar con webpack-bundle-analyzer)
- [ ] Implementar caching en backend
- [ ] Comprimir respuestas con gzip

## Criterios de aceptación
- Lighthouse Performance >90
- Time to Interactive <3 segundos
- Bundle size <500KB

## Semana
Semana 7"

echo "✅ Issue #22 creado"

gh issue create --repo "$REPO" \
  --title "SEO y meta tags" \
  --label "phase-4,priority-medium" \
  --body "## Descripción
Optimizar para motores de búsqueda.

## Tasks
- [ ] Meta tags en todas las páginas (title, description)
- [ ] Open Graph tags para redes sociales
- [ ] Twitter cards
- [ ] Generar sitemap.xml
- [ ] Robots.txt
- [ ] Schema.org markup

## Criterios de aceptación
- Meta tags correctos en todas las páginas
- Sitemap.xml generado automáticamente
- Preview de link en redes sociales funciona

## Semana
Semana 7"

echo "✅ Issue #23 creado"

gh issue create --repo "$REPO" \
  --title "Configurar analytics y monitoring" \
  --label "phase-4,priority-high" \
  --body "## Descripción
Tracking de eventos y monitoreo de errores.

## Tasks
- [ ] Integrar Google Analytics 4
- [ ] Integrar Mixpanel para eventos custom
- [ ] Integrar Sentry para error tracking
- [ ] Setup UptimeRobot para monitoreo de uptime
- [ ] Dashboard de métricas clave

## Criterios de aceptación
- Eventos se trackean correctamente
- Errores se reportan a Sentry
- Alertas de downtime configuradas

## Semana
Semana 7"

echo "✅ Issue #24 creado"

gh issue create --repo "$REPO" \
  --title "Recruitment y onboarding de beta testers" \
  --label "phase-4,priority-high" \
  --body "## Descripción
Reclutar 50 beta testers y recolectar feedback.

## Tasks
- [ ] Post en LinkedIn pidiendo beta testers
- [ ] Crear grupo de WhatsApp/Telegram
- [ ] Documento de onboarding para beta testers
- [ ] Form de feedback (Google Forms o Typeform)
- [ ] Calls semanales para recolectar feedback
- [ ] Iterar basado en feedback

## Criterios de aceptación
- 50+ usuarios en beta
- Feedback documentado
- Al menos 3 bugs críticos encontrados y resueltos

## Semana
Semana 7"

echo "✅ Issue #25 creado"

gh issue create --repo "$REPO" \
  --title "Preparación del lanzamiento (press kit, content)" \
  --label "phase-4,priority-high" \
  --body "## Descripción
Crear assets para el lanzamiento público.

## Tasks
- [ ] Video demo (30-60 segundos)
- [ ] Screenshots de la app (5-10)
- [ ] Logo en diferentes formatos
- [ ] Artículo de lanzamiento (Medium/LinkedIn)
- [ ] Posts para redes sociales
- [ ] Submission a Product Hunt preparada

## Criterios de aceptación
- Video demo publicado en YouTube
- Press kit en carpeta compartida
- Artículo escrito y listo para publicar

## Semana
Semana 8"

echo "✅ Issue #26 creado"

gh issue create --repo "$REPO" \
  --title "Lanzamiento en Product Hunt" \
  --label "phase-4,priority-high" \
  --body "## Descripción
Launch en Product Hunt el Día 1.

## Tasks
- [ ] Preparar submission (título, descripción, tags)
- [ ] Subir screenshots y video
- [ ] Submit a las 00:01 PST
- [ ] Responder todos los comentarios durante el día
- [ ] Pedir upvotes a beta testers (ético)
- [ ] Monitorear ranking

## Criterios de aceptación
- Submission live en Product Hunt
- >50 upvotes en primer día
- >10 comentarios respondidos

## Semana
Semana 8"

echo "✅ Issue #27 creado"

gh issue create --repo "$REPO" \
  --title "Deploy a producción en Vercel" \
  --label "phase-4,priority-high" \
  --body "## Descripción
Deploy final a producción.

## Tasks
- [ ] Configurar dominio personalizado
- [ ] Configurar SSL (Vercel lo hace automático)
- [ ] Configurar variables de entorno en Vercel
- [ ] Deploy de frontend
- [ ] Deploy de backend (serverless functions)
- [ ] Verificar que todo funcione

## Criterios de aceptación
- App accesible en https://investexplainer.ai
- SSL válido
- 0 errores en producción

## Semana
Semana 8"

echo "✅ Issue #28 creado"

# BACKLOG (Post-MVP)

gh issue create --repo "$REPO" \
  --title "[BACKLOG] Soporte para múltiples idiomas (i18n)" \
  --label "enhancement,priority-low" \
  --body "## Descripción
Agregar inglés, portugués como idiomas adicionales.

## Tasks
- [ ] Configurar next-intl o react-i18next
- [ ] Traducir todos los strings del frontend
- [ ] Traducir prompts de Claude (backend)
- [ ] Selector de idioma en UI

## Criterios de aceptación
- App funciona en español, inglés, portugués
- Traducciones son naturales (no Google Translate literal)

## Post-MVP
Este feature se implementará después del lanzamiento inicial."

echo "✅ Issue #29 creado"

gh issue create --repo "$REPO" \
  --title "[BACKLOG] Notificaciones push (Web Push API)" \
  --label "enhancement,priority-low" \
  --body "## Descripción
Notificaciones push cuando alertas se disparan.

## Tasks
- [ ] Integrar Web Push API
- [ ] Pedir permisos al usuario
- [ ] Enviar notificaciones desde backend
- [ ] Configurar service worker para notificaciones

## Criterios de aceptación
- Notificaciones se reciben en desktop y mobile
- Usuario puede desactivarlas

## Post-MVP
Este feature se implementará después del lanzamiento inicial."

echo "✅ Issue #30 creado"

gh issue create --repo "$REPO" \
  --title "[BACKLOG] Integración con brokers (Belo, Cocos Capital)" \
  --label "enhancement,priority-low" \
  --body "## Descripción
Link directo para comprar activos desde la app.

## Tasks
- [ ] Investigar APIs de brokers LATAM
- [ ] Integrar con al menos 1 broker
- [ ] Botón \"Comprar en [Broker]\"
- [ ] Affiliate tracking (comisiones)

## Criterios de aceptación
- Usuario puede hacer clic y abrir broker con activo pre-seleccionado
- Tracking de conversiones funciona

## Post-MVP
Este feature se implementará después del lanzamiento inicial."

echo "✅ Issue #31 creado"

gh issue create --repo "$REPO" \
  --title "[BACKLOG] Comparativas avanzadas (hasta 5 activos)" \
  --label "enhancement,priority-medium" \
  --body "## Descripción
Tabla comparativa de múltiples activos lado a lado.

## Tasks
- [ ] UI para seleccionar hasta 5 activos
- [ ] Tabla comparativa con métricas clave
- [ ] Gráfico comparativo de performance
- [ ] Feature solo para premium

## Criterios de aceptación
- Comparativa es clara y útil
- Performance no se degrada con 5 activos

## Post-MVP
Este feature se implementará después del lanzamiento inicial."

echo "✅ Issue #32 creado"

gh issue create --repo "$REPO" \
  --title "[BACKLOG] Export de portfolios a CSV/Excel" \
  --label "enhancement,priority-low" \
  --body "## Descripción
Descargar portfolio como archivo CSV o Excel.

## Tasks
- [ ] Endpoint para generar CSV/Excel
- [ ] Botón de descarga en dashboard
- [ ] Formato de archivo claro y útil

## Criterios de aceptación
- Archivo descargable incluye todos los activos
- Se puede abrir en Excel/Google Sheets

## Post-MVP
Este feature se implementará después del lanzamiento inicial."

echo "✅ Issue #33 creado"

echo ""
echo "🎉 ¡Listo! Se crearon 33 issues en $REPO"
echo ""
echo "Próximos pasos:"
echo "1. Visita https://github.com/$REPO/issues para ver todos los issues"
echo "2. Crea un proyecto en GitHub Projects para organizarlos"
echo "3. Asigna los issues al proyecto"
echo "4. ¡Empieza a desarrollar!"
echo ""
