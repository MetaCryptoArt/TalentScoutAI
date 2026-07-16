---
name: talentscout-qa-simulator
description: >-
  Testing, monitoreo y simulación de extremo a extremo para TalentScout AI. Úsala SIEMPRE que
  vayas a validar, probar, monitorear o dar por terminado cualquier trabajo en TalentScout AI:
  después de editar código del dashboard, después de tocar un workflow n8n (módulos 1-8), antes de
  declarar "listo" una feature, o cuando el usuario pida pruebas, QA, detección de bugs,
  regresiones, health checks, o una "simulación real" de un candidato interactuando con el sistema.
  También aplica para verificar esquemas JSON de los módulos (DISC, voz, fraud score, reporte
  final), invariantes de scores, la máquina de estados de sesión, y el cumplimiento de Ley 81.
  Incluye un harness de simulación de candidato (honesto vs. fraudulento). Si acabas de cambiar
  algo en TalentScout, corre esta skill antes de cerrar.
---

# TalentScout AI — QA, monitoreo y simulación

## Por qué existe esta skill

TalentScout AI toma decisiones que afectan a personas reales (si un candidato avanza o se descarta)
y le factura a empresas clientes. Un bug silencioso aquí no es un pixel mal puesto: es un Fraud
Risk Score mal calculado, una empresa viendo datos de otra, o un candidato procesado sin
consentimiento (violación de Ley 81). Por eso el estándar es "primer nivel": nada se da por
terminado sin verificarse, y el sistema se prueba con **candidatos simulados de punta a punta**,
no solo revisando código en abstracto.

Esta skill te da: (1) qué verificar y cómo, (2) un harness ejecutable de simulación, y (3) cómo
montar monitoreo continuo.

## Regla de oro

**Nunca declares "listo" sin correr la verificación correspondiente.** Después de cambiar código,
corre el build y los checks. Después de tocar un módulo del pipeline, corre la simulación. Si algo
no se puede probar en vivo desde este entorno (n8n, Vapi, Sheets reales), dilo explícitamente y
prueba la parte determinista (esquemas, fórmulas, invariantes) — no simules que probaste algo que
no probaste.

## 1. El harness de simulación de candidato

`scripts/simulate_candidate.py` es el corazón de esta skill. Simula candidatos con distintos
perfiles (honesto, límite, fraudulento) y valida que el pipeline los clasifique como se espera,
verificando además todas las invariantes duras del sistema.

Córrelo así:
```bash
python scripts/simulate_candidate.py            # corre las 3 personas base + valida invariantes
python scripts/simulate_candidate.py --json      # salida en JSON para monitoreo
python scripts/simulate_candidate.py --report path/to/final_report.json   # valida un reporte real
```

Qué valida (parte determinista, sin depender de Gemini/n8n en vivo):
- **Fórmula del Fraud Risk Score** (Módulo 7): `100 - (0.25·cv + 0.30·texto + 0.45·voz)`.
- **Umbrales de clasificación**: 0-25 VERIFIED · 26-60 CAUTION · 61-100 HIGH_RISK.
- **Invariante DISC**: `d + i + s + c == 100`.
- **Rangos de score**: todo score 0-100.
- **Máquina de estados** de `status` (transiciones válidas).
- **Esquema del reporte final** (Módulo 8): campos obligatorios presentes y bien tipados.
- **Gate de Ley 81**: sin `consent_given=true` el candidato no puede pasar de `pending`.

Las personas viven en el propio script como fixtures y son el punto de partida para simulaciones
más ricas (ver sección 3). Cuando cambie la fórmula o los umbrales en el sistema real, actualiza
el script para que siga siendo la fuente de verdad de las pruebas.

## 2. Checklist de regresión tras cada cambio

Después de tocar **código del dashboard** (Next.js):
- `pnpm build` pasa sin errores (Tailwind v4, TS estricto).
- Typecheck limpio.
- Aislamiento de datos: una empresa NO puede ver datos de otra (el `companyId` viene del JWT, no
  de un query param manipulable). Esto es crítico — pruébalo explícitamente.
- Rutas protegidas: `/admin/*` y `/portal/*` redirigen a login sin sesión válida.

Después de tocar un **workflow n8n** (módulos):
- Exportar el workflow anterior como backup ANTES de cambiar (regla de CLAUDE.md).
- Validar el JSON de salida del módulo contra su esquema (usa el harness).
- Probar con un número/sesión de prueba, nunca directo en producción.

Ver `references/pipeline-checks.md` para el detalle por módulo.

## 3. Simulación "real" candidato ↔ TalentScout AI

La simulación completa recrea el viaje de un candidato por los 8 módulos. Como el flujo real usa
WhatsApp + voz + Gemini, la simulación de alto nivel se hace en dos capas:

**Capa determinista (siempre):** el harness del punto 1 valida que, dados unos scores de entrada,
el sistema produzca la clasificación y el reporte correctos. Rápido, barato, corre en cada cambio.

**Capa conversacional (cuando se pida "simulación real"):** actúa como un candidato sintético
respondiendo las preguntas DISC (§9 de CLAUDE.md) y la entrevista de voz (§8, Módulo 5), con una
persona definida (ej. "candidato honesto con 5 años de experiencia real" vs. "candidato que
infló su CV y titubea con fechas"). Genera las respuestas del candidato, pásalas por los prompts
de Gemini de los módulos 4 y 6, y verifica que:
- El candidato honesto obtenga authenticity alto y termine VERIFIED/PROCEED.
- El candidato fraudulento dispare `authenticity_flags`, discrepancias CV↔voz, y termine
  HIGH_RISK/DISCARD.
- Si el candidato no da consentimiento, el flujo termine en `rejected_no_consent`.

Documenta cada corrida de simulación (persona, entradas, salida esperada vs. real) para que sirva
de caso de regresión futuro.

## 4. Monitoreo continuo

"Constante" de forma honesta y sostenible: no un proceso corriendo 24/7 por su cuenta, sino
**checks disparados en los momentos correctos**:
- **En cada cambio**: el checklist de regresión (§2) + el harness (§1).
- **Programado** (cuando el sistema esté desplegado): una tarea programada (scheduled task) que
  corra un health check periódico — endpoints del dashboard responden, workflow n8n activo, Sheet
  accesible — y avise si algo se cae. Ofrécelo al usuario cuando haya algo desplegado que vigilar;
  antes de eso no hay nada en vivo que monitorear.

## 5. Formato para reportar un bug

Cuando detectes un bug, repórtalo así (claro y accionable, no un volcado):

```
BUG · [módulo/área] · [severidad: crítica/alta/media/baja]
Síntoma: qué se observa
Reproducción: pasos o entrada que lo dispara
Causa probable: tu mejor hipótesis
Impacto: a quién afecta (candidato / empresa cliente / admin / facturación)
Fix propuesto: qué cambiarías
```

Prioriza por impacto: aislamiento de datos entre empresas, cálculo de fraud score, y gate de
consentimiento son **críticos** — cualquier fallo ahí bloquea el release.

## Qué registrar al terminar

Tras una sesión de QA, anota en `docs/LEARNINGS.md` los bugs encontrados y su causa raíz — los
patrones de bug se repiten, y ese registro es lo que evita volver a caer en el mismo hoyo.
