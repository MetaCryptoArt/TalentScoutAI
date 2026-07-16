# CLAUDE.md — TalentScout AI · Contexto Maestro

> Este archivo es el contexto de referencia para Claude Code.
> Léelo completo antes de tocar cualquier archivo del proyecto.
> Nunca lo elimines ni lo sobreescribas sin confirmación de Salo.

---

## 1. ¿Qué es TalentScout AI?

TalentScout AI es un sistema B2B SaaS de pre-calificación de candidatos mediante WhatsApp y voz. Automatiza el proceso de screening de RR.HH. usando inteligencia artificial: recibe CVs, conduce entrevistas por WhatsApp y por voz, analiza el perfil DISC, detecta fraude en el CV, verifica historial laboral vía CSS Panamá, y genera un reporte final consolidado con Fraud Risk Score para la empresa cliente.

**Propietario:** Salomon Bardayan (Salo) — Panama City, Panamá.
**Estado actual:** MVP en construcción. Módulos 1–3 implementados. Módulos 4–9 pendientes.
**Objetivo comercial:** Producto listo para vender a empresas en Panamá para julio-agosto 2026.
**Diferenciador clave:** Único sistema en Panamá que combina DISC + entrevista de voz con IA + verificación CSS + Fraud Risk Score en un solo flujo automatizado.

---

## 2. Stack Tecnológico

### Backend / Automatización
- **n8n Cloud** — instancia en `https://talentscout.app.n8n.cloud`
- **Gemini 2.5 Flash** — modelo de IA para extracción de CV y análisis DISC
  - API key formato: `AQ.Ab8...` (guardada en n8n Credentials)
  - Autenticación: query parameter (no Bearer header)
- **Twilio / WhatsApp Business** — canal de comunicación con candidatos
  - Account SID: `AC22c271db390fded48b41ddffd19c63db`
  - Auth Token: SOLO en n8n Credentials panel. NUNCA en JSON de workflow.
  - Credential name en n8n: `TalentScout Twilio Account`
- **Google Sheets** — base de datos de sesiones
  - Sheet ID: `1PREnTQ2ExycKZ2J_mq-GIL9P7PgqO61i3Te9IB2qQv0`
  - Tab principal: `interview_sessions`

### Frontend / Dashboard
- **Next.js 16.2** con App Router
- **React 19**
- **TypeScript 5.7**
- **Tailwind CSS v4** ⚠️ — usar sintaxis v4 (no tailwind.config.js tradicional)
- **shadcn/ui** — componentes base
- **lucide-react** — íconos
- **@vercel/analytics** — deploy target: Vercel
- **pnpm** — gestor de paquetes (NO usar npm ni yarn)

### Entrevista de Voz
- **Vapi.ai** — plataforma de entrevistas de voz con IA (seleccionada sobre Retell AI)
  - API key: pendiente de configurar (crear cuenta en vapi.ai)
  - Costo estimado: ~$0.05–0.10 USD por minuto de llamada
  - Integración: webhook de Vapi → n8n → Google Sheets
  - El candidato recibe un link por WhatsApp y abre la entrevista de voz en su navegador (sin app)

### Conexiones MCP activas en Claude Code
- **n8n-mcp** via Instance-level MCP
  - URL: `https://talentscout.app.n8n.cloud/mcp-server/http`
  - Auth: Bearer token (guardado en `~/.claude/settings.json`)

---

## 3. Arquitectura del Sistema

```
Empresa Cliente
    ↓ sube CV (PDF) vía Dashboard Web
    
[Módulo 1] Ingesta de CV ✅ IMPLEMENTADO
    → n8n recibe PDF via webhook
    → Gemini extrae: nombre, email, teléfono, empresas, cargos, fechas, educación
    → Detecta inconsistencias internas del CV (fechas solapadas, progresión irreal)
    → Guarda en Google Sheets (interview_sessions)

[Módulo 2] Consentimiento WhatsApp (Ley 81 Panamá) ✅ IMPLEMENTADO
    → Twilio envía mensaje de opt-in al candidato
    → Candidato responde "SÍ" para continuar
    → Sin consentimiento → proceso termina, status = "rejected_no_consent"

[Módulo 3] Entrevista de Texto DISC ✅ IMPLEMENTADO
    → WhatsApp conversacional con 3 preguntas dinámicas
    → Preguntas de seguimiento basadas en respuesta anterior (anti-ChatGPT)
    → Análisis de tiempo de respuesta por timestamp de WhatsApp
    → Sesión persistida en Google Sheets por session_id

[Módulo 4] Análisis DISC ← PENDIENTE
    → Gemini analiza las respuestas de texto
    → Clasifica perfil: D / I / S / C con porcentajes (deben sumar 100%)
    → Score de autenticidad: detecta respuestas generadas por IA
    → Si DISC score >= threshold → invita a entrevista de voz
    → Si DISC score < threshold → status = "rejected_disc"

[Módulo 5] Entrevista de Voz con IA ← PENDIENTE
    → Twilio envía link de Vapi.ai al candidato por WhatsApp
    → Candidato abre link en navegador (sin app requerida)
    → Agente de voz Vapi conduce entrevista de 10-15 minutos
    → Preguntas sobre experiencias específicas (nombres, fechas, situaciones reales)
    → Vapi transcribe en tiempo real y envía webhook a n8n al finalizar
    → Análisis de timestamps de respuesta de voz incluido

[Módulo 6] Análisis de Transcripción + Fraud Voice Detection ← PENDIENTE
    → Gemini analiza la transcripción completa de la entrevista de voz
    → Detecta: hesitaciones ante preguntas de fechas/empresas, inconsistencias
      con el CV, cambios de historia en preguntas de seguimiento, vocabulario
      técnico real vs. vocabulario del CV
    → Genera Voice Authenticity Score (0–100)
    → Enriquece el análisis DISC con datos de la entrevista de voz

[Módulo 7] Fraud Risk Score Consolidado ← PENDIENTE
    → Consolida señales de todos los módulos anteriores:
      · Inconsistencias internas del CV (Módulo 1)
      · Score de autenticidad de respuestas de texto (Módulo 4)
      · Voice Authenticity Score (Módulo 6)
    → Gemini genera Fraud Risk Score final (0–100, donde 0 = sin riesgo)
    → Clasifica candidato: VERIFIED / CAUTION / HIGH RISK

[Módulo 8] Reporte Final Consolidado ← PENDIENTE
    → JSON completo con todos los datos del candidato
    → Actualiza Google Sheets con resultados completos
    → Status → "complete"
    → Dashboard Web muestra reporte completo a empresa cliente
    → Notificación WhatsApp a empresa cliente con resumen ejecutivo

[Dashboard Web] — Este repositorio
    → Visualiza candidatos procesados con todos los scores
    → Muestra perfil DISC, Fraud Risk Score, CSS Verification
    → Permite descargar reporte PDF por candidato
    → Acceso por empresa cliente (RR.HH.) con credenciales
```

---

## 4. Estructura del Repositorio

```
talentscout-ai-dashboard/
├── app/                        # App Router de Next.js
│   ├── page.tsx                # Dashboard principal
│   ├── layout.tsx              # Layout global
│   └── api/                    # API routes (a crear)
│       ├── candidates/         # GET candidatos desde Sheets
│       ├── sessions/           # GET sesiones activas
│       ├── reports/            # GET reportes DISC + Fraud Score
│       └── vapi-webhook/       # POST webhook de Vapi al finalizar llamada
├── components/                 # Componentes React (generados por v0)
│   ├── CandidateCard.tsx       # Tarjeta de candidato con scores
│   ├── DISCChart.tsx           # Visualización perfil DISC
│   ├── FraudRiskBadge.tsx      # Badge VERIFIED / CAUTION / HIGH RISK
│   └── VoiceInterviewPlayer.tsx # Reproductor de transcripción
├── lib/                        # Utilidades y helpers
│   ├── sheets.ts               # Cliente de Google Sheets
│   ├── vapi.ts                 # Cliente de Vapi.ai
│   └── fraud-score.ts          # Lógica de cálculo Fraud Risk Score
├── public/                     # Assets estáticos
├── CLAUDE.md                   # Este archivo — NO modificar sin permiso
├── package.json
└── .env.local                  # Variables de entorno (NO commitear)
```

---

## 5. Variables de Entorno Requeridas

Crear `.env.local` en la raíz con estas variables:

```env
# Google Sheets
GOOGLE_SHEETS_ID=1PREnTQ2ExycKZ2J_mq-GIL9P7PgqO61i3Te9IB2qQv0
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# n8n
N8N_WEBHOOK_BASE=https://talentscout.app.n8n.cloud/webhook

# Vapi.ai (entrevista de voz)
VAPI_API_KEY=tu-vapi-api-key
VAPI_ASSISTANT_ID=tu-assistant-id-de-talentscout
VAPI_WEBHOOK_SECRET=tu-webhook-secret

# App
NEXT_PUBLIC_APP_NAME=TalentScout AI
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

⚠️ NUNCA commitear `.env.local`. Está en `.gitignore`.

---

## 6. Schema de Google Sheets — interview_sessions

### Datos base del candidato
| Columna | Tipo | Descripción |
|---|---|---|
| session_id | string | UUID único por sesión |
| candidate_phone | string | Número WhatsApp en formato E.164 |
| candidate_name | string | Extraído del CV por Gemini |
| candidate_email | string | Extraído del CV |
| client_company | string | Empresa que subió el CV |
| status | string | pending / text_interview / voice_invited / voice_complete / complete / rejected_no_consent / rejected_disc / rejected_fraud |
| created_at | datetime | Timestamp de creación |
| updated_at | datetime | Último update |

### CV y consentimiento
| Columna | Tipo | Descripción |
|---|---|---|
| cv_summary | string | Resumen del CV generado por Gemini |
| cv_raw_text | string | Texto extraído del PDF del CV |
| cv_internal_flags | string | JSON de inconsistencias internas detectadas en el CV |
| consent_given | boolean | true si aceptó opt-in Ley 81 |
| consent_timestamp | datetime | Momento del consentimiento |

### Entrevista de texto DISC (Módulo 3-4)
| Columna | Tipo | Descripción |
|---|---|---|
| q1_response | string | Respuesta a pregunta DISC 1 |
| q1_response_time_sec | number | Segundos que tardó en responder |
| q2_response | string | Respuesta a pregunta DISC 2 |
| q2_response_time_sec | number | Segundos que tardó en responder |
| q3_response | string | Respuesta a pregunta DISC 3 |
| q3_response_time_sec | number | Segundos que tardó en responder |
| disc_profile | string | D / I / S / C — perfil predominante |
| disc_d_score | number | Porcentaje Dominante (0-100) |
| disc_i_score | number | Porcentaje Influyente (0-100) |
| disc_s_score | number | Porcentaje Estable (0-100) |
| disc_c_score | number | Porcentaje Concienzudo (0-100) |
| disc_insights | string | Análisis laboral generado por Gemini (máx 150 palabras) |
| text_authenticity_score | number | Score 0-100 (100 = totalmente auténtico, sin IA detectada) |

### Entrevista de voz Vapi (Módulos 5-6)
| Columna | Tipo | Descripción |
|---|---|---|
| vapi_call_id | string | ID de la llamada en Vapi.ai |
| vapi_call_link | string | Link enviado al candidato |
| voice_interview_duration_sec | number | Duración real de la llamada |
| voice_transcript | string | Transcripción completa de la entrevista |
| voice_authenticity_score | number | Score 0-100 de autenticidad vocal |
| voice_hesitation_flags | string | JSON de momentos de hesitación detectados |
| voice_disc_enrichment | string | JSON de enriquecimiento DISC desde la entrevista de voz |

### Fraud Risk Score consolidado (Módulo 7)
| Columna | Tipo | Descripción |
|---|---|---|
| fraud_risk_score | number | Score 0-100 (0 = sin riesgo, 100 = alto riesgo) |
| fraud_risk_label | string | VERIFIED / CAUTION / HIGH_RISK |
| fraud_risk_breakdown | string | JSON con el desglose de cada componente del score |

---

## 7. Reglas Críticas del Proyecto

### Seguridad y Compliance
- **Ley 81 de Panamá**: OBLIGATORIO obtener consentimiento explícito por WhatsApp antes de cualquier interacción con el candidato. Si no hay consentimiento, el flujo termina y se registra en Sheets con status "rejected_no_consent".
- **Consentimiento de grabación de voz**: Antes de iniciar la entrevista de voz, Vapi debe informar al candidato que la llamada será grabada y transcrita. El candidato debe confirmar para continuar.
- **Sin scraping de LinkedIn**: Solo se aceptan CVs en PDF subidos manualmente.
- **Anti-alucinación**: Todos los datos extraídos del CV por Gemini deben citarse textualmente o marcarse como "inferido". Nunca inventar datos del candidato.
- **Fraud Risk Score es orientativo**: El reporte debe incluir disclaimer explícito de que el score es una herramienta de apoyo a la decisión, no una conclusión definitiva. La empresa cliente es responsable de la decisión final de contratación.

### Desarrollo
- Siempre usar **pnpm**, no npm.
- Tailwind v4: la configuración es en `app/globals.css` con `@import "tailwindcss"`, no en `tailwind.config.js`.
- Los workflows de n8n se entregan como **JSON completo importable**, no como instrucciones paso a paso.
- Antes de modificar cualquier workflow en n8n, exportar el actual como backup.
- Los cambios al frontend se validan con `pnpm build` antes de commitear.

### Git
- Branch principal: `main`
- Commits en español o inglés, formato: `feat:`, `fix:`, `chore:`
- No hacer push directo a main en features grandes — crear rama y PR.

---

## 8. Módulos Pendientes — Especificaciones

### Módulo 4: Análisis DISC + Autenticidad de Texto

**Input:** Las respuestas de texto del candidato + timestamps de respuesta
**Proceso:**
1. Gemini analiza respuestas según metodología DISC
2. Genera scores D/I/S/C en porcentajes (deben sumar 100%)
3. Analiza tiempo de respuesta: respuestas > 5 min en preguntas simples = flag
4. Detecta patrones de texto generado por IA (vocabulario demasiado formal, estructura perfecta, ausencia de errores naturales)
5. Si disc_score >= threshold → trigger Módulo 5 (invitar a voz)

**Output JSON esperado:**
```json
{
  "session_id": "uuid",
  "disc_profile": "D",
  "disc_d_score": 45,
  "disc_i_score": 30,
  "disc_s_score": 15,
  "disc_c_score": 10,
  "disc_insights": "El candidato muestra...",
  "text_authenticity_score": 82,
  "authenticity_flags": ["response_time_q2_suspicious"],
  "proceed_to_voice": true,
  "analysis_timestamp": "2026-06-30T10:00:00Z"
}
```

**Prompt base para Gemini (Módulo 4):**
```
Eres un experto en psicometría DISC y detección de respuestas generadas por IA.
Analiza las siguientes respuestas de un candidato.

CV Summary: {cv_summary}
Respuesta 1 (tiempo: {q1_time}s): {q1_response}
Respuesta 2 (tiempo: {q2_time}s): {q2_response}
Respuesta 3 (tiempo: {q3_time}s): {q3_response}

Tarea 1 — Perfil DISC: Determina el perfil predominante con scores que sumen exactamente 100.
Tarea 2 — Autenticidad: Evalúa si las respuestas parecen escritas por una persona real
  (considera vocabulario, errores naturales, especificidad de detalles, tiempo de respuesta).
  Score 0-100 donde 100 = completamente auténtico.

Responde ÚNICAMENTE con JSON válido. Sin texto adicional. Sin markdown.
Esquema exacto:
{
  "disc_profile": "D|I|S|C",
  "disc_d_score": 0-100,
  "disc_i_score": 0-100,
  "disc_s_score": 0-100,
  "disc_c_score": 0-100,
  "disc_insights": "string máx 150 palabras",
  "text_authenticity_score": 0-100,
  "authenticity_flags": ["array de flags detectados o vacío"],
  "proceed_to_voice": true|false
}
```

---

### Módulo 5: Entrevista de Voz con Vapi.ai

**Input:** session_id + candidate_phone + disc_insights del Módulo 4
**Proceso:**
1. n8n genera link de llamada Vapi para esta sesión
2. Twilio envía link por WhatsApp al candidato
3. Mensaje: *"Tu entrevista inicial fue muy bien. El siguiente paso es una breve entrevista de voz de 10-15 minutos. Puedes hacerla desde tu navegador, sin descargar nada: [LINK]. La llamada será grabada y transcrita. Al iniciar, confirma que aceptas la grabación."*
4. Candidato completa la llamada
5. Vapi envía webhook a n8n con transcripción completa

**Configuración del Agente Vapi:**
```json
{
  "name": "TalentScout AI Interviewer",
  "voice": "spanish-female-professional",
  "firstMessage": "Hola {candidate_name}, soy el asistente de TalentScout AI. Antes de comenzar, quiero informarte que esta llamada será grabada y transcrita para el proceso de evaluación. ¿Confirmas que aceptas continuar?",
  "systemPrompt": "Eres un entrevistador profesional de recursos humanos. Tu objetivo es profundizar en la experiencia real del candidato. Haz preguntas específicas que requieran memoria episódica: nombres de personas, fechas concretas, situaciones específicas. No aceptes respuestas genéricas — siempre pide un ejemplo concreto. Mantén un tono amable y profesional. La entrevista debe durar entre 10 y 15 minutos.",
  "questions": [
    "Háblame de tu experiencia en {last_company}. ¿Cómo se llamaba tu supervisor directo y cómo era trabajar con él/ella?",
    "Cuéntame de un proyecto específico del que estés orgulloso/a. Dame detalles: fechas, equipo, resultados concretos.",
    "¿Hubo algún conflicto con un compañero o cliente en ese período? ¿Qué pasó exactamente y cómo lo resolviste?",
    "Basándome en tu CV, pasaste de {role_before} a {role_after}. ¿Qué hiciste concretamente para lograr ese avance?"
  ]
}
```

---

### Módulo 6: Análisis de Transcripción + Voice Fraud Detection

**Input:** Transcripción de Vapi + datos del CV + análisis DISC
**Proceso:**
1. Gemini analiza la transcripción completa
2. Detecta hesitaciones ante preguntas de fechas/empresas
3. Cruza nombres y fechas mencionados en la voz vs. el CV
4. Detecta cambios de historia en preguntas de seguimiento
5. Evalúa coherencia entre perfil DISC de texto y comportamiento en voz

**Prompt base para Gemini (Módulo 6):**
```
Eres un experto en análisis forense de entrevistas de trabajo.
Analiza la siguiente transcripción de entrevista de voz.

CV del candidato: {cv_raw_text}
Transcripción: {voice_transcript}
Perfil DISC previo: {disc_profile} — {disc_insights}

Detecta:
1. Inconsistencias entre lo que dice y lo que está en el CV (fechas, cargos, nombres de empresas)
2. Hesitaciones o evasiones ante preguntas específicas (busca "[pausa]", "eh", "mmm", cambios de tema)
3. Detalles que suenan inventados vs. memorias reales (las memorias reales tienen detalles específicos e imperfectos)
4. Coherencia del perfil DISC: ¿su comportamiento vocal coincide con el perfil {disc_profile}?

Responde ÚNICAMENTE con JSON válido:
{
  "voice_authenticity_score": 0-100,
  "voice_hesitation_flags": [{"timestamp": "mm:ss", "context": "descripción"}],
  "cv_voice_discrepancies": [{"field": "campo", "cv_value": "x", "voice_value": "y"}],
  "disc_voice_coherence": true|false,
  "voice_insights": "string máx 200 palabras"
}
```

---

### Módulo 7: Fraud Risk Score Consolidado

**Input:** Outputs de Módulos 1, 4 y 6
**Fórmula de cálculo:**
```
fraud_risk_score = 100 - weighted_average([
  cv_internal_consistency  × 0.25,   // Módulo 1
  text_authenticity_score  × 0.30,   // Módulo 4
  voice_authenticity_score × 0.45    // Módulo 6 (mayor peso por ser más difícil de falsificar)
])
```

**Clasificación:**
- 0–25 → `VERIFIED` 🟢
- 26–60 → `CAUTION` 🟡
- 61–100 → `HIGH_RISK` 🔴

---

### Módulo 8: Reporte Final Consolidado

**Output JSON completo:**
```json
{
  "session_id": "uuid",
  "candidate": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "cv_summary": "string"
  },
  "disc": {
    "profile": "D",
    "d_score": 45, "i_score": 30, "s_score": 15, "c_score": 10,
    "insights": "string"
  },
  "fraud_assessment": {
    "risk_score": 18,
    "risk_label": "VERIFIED",
    "breakdown": {
      "cv_consistency": 90,
      "text_authenticity": 85,
      "voice_authenticity": 78
    },
    "disclaimer": "Este score es una herramienta de apoyo. La decisión final de contratación es responsabilidad de la empresa."
  },
  "voice_interview": {
    "duration_seconds": 720,
    "transcript_summary": "string",
    "key_flags": []
  },
  "recommendation": "PROCEED" | "REVIEW" | "DISCARD",
  "generated_at": "2026-06-30T10:00:00Z"
}
```

---

## 9. Preguntas DISC del Sistema (Módulo 3 — Texto)

Las preguntas son dinámicas — el sistema hace follow-up basado en la respuesta anterior. Estas son las preguntas base:

**Pregunta 1 (Orientación a resultados):**
*"Cuéntame de una situación específica en tu trabajo donde tuviste que resolver un problema difícil. ¿Qué pasó exactamente y qué hiciste?"*
→ Follow-up si respuesta genérica: *"¿Puedes darme más detalles? ¿Cómo se llamaba el proyecto o el cliente?"*

**Pregunta 2 (Trabajo en equipo):**
*"¿Cómo prefieres trabajar — solo con autonomía total, o coordinando con otros? Dame un ejemplo real de tu última experiencia."*
→ Follow-up si respuesta genérica: *"Interesante. ¿Quiénes eran las personas con las que trabajabas en ese equipo?"*

**Pregunta 3 (Manejo de cambio):**
*"Cuéntame de una vez que tu jefe cambió las prioridades de golpe. ¿Qué pasó y cómo reaccionaste?"*
→ Follow-up si respuesta genérica: *"¿Recuerdas aproximadamente cuándo fue eso y en qué empresa?"*

---

## 10. Workflow n8n — Estado Actual

- **Nombre en n8n:** TalentScout AI v7
- **Módulos 1-3:** ✅ Implementados y funcionando
- **Módulo 4:** ❌ Pendiente
- **Módulo 5:** ❌ Pendiente (requiere cuenta Vapi.ai)
- **Módulo 6:** ❌ Pendiente
- **Módulo 7:** ❌ Pendiente
- **Módulo 8:** ❌ Pendiente

**Al modificar el workflow:**
1. Exportar v7 actual como backup (`TalentScout_v7_backup_FECHA.json`)
2. Implementar cambios
3. Probar con número de prueba antes de activar en producción
4. Documentar cambios en este archivo

---

## 11. Deploy

- **Target:** Vercel (ya configurado con `@vercel/analytics`)
- **Comando build:** `pnpm build`
- **Variables de entorno:** Configurar en Vercel Dashboard, no en código
- **Dominio objetivo:** Por definir — registrar en Namecheap o similar

---

## 12. Stack de Costos Operativos (referencia)

| Servicio | Plan | Costo/mes |
|---|---|---|
| Claude Max (Claude Code) | Max | ~$100 |
| n8n Cloud | Starter | ~$24 |
| Vapi.ai | Pay-per-use | ~$0.05-0.10/min de llamada |
| Twilio WhatsApp | Pay-per-use | ~$0.005/mensaje |
| Google Sheets | Free | $0 |
| Vercel | Hobby/Pro | $0–$20 |
| Gemini API | Pay-per-use | ~$0.00015/1K tokens |

---

## 13. Próximas Sesiones — Prioridades

1. **Sesión 1 (post 30/06):** Módulo 4 — Análisis DISC + autenticidad de texto en n8n
2. **Sesión 2:** Módulo 5 — Configurar agente Vapi + integración con n8n via webhook
3. **Sesión 3:** Módulo 6 — Análisis de transcripción Gemini
4. **Sesión 4:** Módulos 7 y 8 — Fraud Score + Reporte Final
5. **Sesión 5:** Conectar Dashboard a Google Sheets (API routes Next.js)
6. **Sesión 6:** Deploy en Vercel + prueba end-to-end completa
7. **Sesión 7:** Onboarding de primera empresa piloto

---

*Última actualización: junio 2026*
*Sistema: 8 módulos — internacional, sin dependencia de registros locales*
*Mantenido por: Claude Code + Salo Bardayan*
