# Checks por módulo — TalentScout AI

Referencia detallada de qué verificar en cada módulo del pipeline. Cargar solo cuando se esté
trabajando o probando el módulo correspondiente.

## Módulo 1 — Ingesta de CV
- El PDF se recibe y Gemini extrae los campos base (nombre, email, teléfono, empresas, cargos,
  fechas, educación).
- `cv_internal_flags` detecta inconsistencias internas (fechas solapadas, progresión irreal).
- Anti-alucinación: datos citados textualmente o marcados como "inferido". Nunca inventar.
- Se persiste en Google Sheets (`interview_sessions`) con `status = pending`.

## Módulo 2 — Consentimiento (Ley 81)
- Twilio envía opt-in. Sin "SÍ" explícito => `status = rejected_no_consent` y el flujo termina.
- `consent_given` y `consent_timestamp` quedan registrados.
- **Crítico**: ningún módulo posterior debe ejecutarse sin `consent_given = true`.

## Módulo 3 — Entrevista de texto DISC
- 3 preguntas dinámicas con follow-up si la respuesta es genérica (anti-ChatGPT).
- Se registran respuestas y `q*_response_time_sec` por timestamp de WhatsApp.
- Sesión persistida por `session_id`.

## Módulo 4 — Análisis DISC + autenticidad de texto
- `disc_d_score + disc_i_score + disc_s_score + disc_c_score == 100`.
- `text_authenticity_score` en 0-100.
- Salida JSON válida y estricta (sin markdown), con `proceed_to_voice` booleano.
- Tiempo de respuesta > 5 min en pregunta simple => flag de autenticidad.

## Módulo 5 — Entrevista de voz (Vapi)
- El agente informa que la llamada se graba y transcribe, y pide confirmación (compliance).
- Link enviado por WhatsApp; el candidato lo abre en navegador (sin app).
- Vapi envía webhook a n8n con la transcripción al finalizar.
- Bloqueado hasta que exista cuenta Vapi.ai configurada.

## Módulo 6 — Análisis de transcripción + voice fraud
- `voice_authenticity_score` en 0-100.
- Detecta hesitaciones, discrepancias CV↔voz (fechas, cargos, empresas), cambios de historia.
- Salida JSON estricta con `voice_hesitation_flags` y `cv_voice_discrepancies`.

## Módulo 7 — Fraud Risk Score consolidado
- Fórmula: `fraud_risk_score = 100 - (0.25·cv + 0.30·texto + 0.45·voz)`.
- Umbrales: 0-25 VERIFIED · 26-60 CAUTION · 61-100 HIGH_RISK.
- El peso mayor es voz (0.45) por ser lo más difícil de falsificar.

## Módulo 8 — Reporte final
- JSON completo con `candidate`, `disc`, `fraud_assessment` (con `disclaimer` obligatorio),
  `voice_interview`, `recommendation` ∈ {PROCEED, REVIEW, DISCARD}.
- `status => complete`. Se actualiza Sheets y se notifica a la empresa cliente.
- Disclaimer explícito: el score es apoyo a la decisión, no conclusión definitiva.

## Dashboard (este repo)
- Aislamiento de datos entre empresas (companyId del JWT, no query param).
- Rutas protegidas (`/admin/*`, `/portal/*`) redirigen a login sin sesión.
- `pnpm build` limpio (Tailwind v4, TS estricto). `.env.local` nunca commiteado.
