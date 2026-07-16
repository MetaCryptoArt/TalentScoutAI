---
name: talentscout-token-optimizer
description: >-
  Disciplina de eficiencia y ahorro de tokens/contexto al trabajar en el proyecto TalentScout AI.
  Úsala SIEMPRE que trabajes en TalentScout AI (dashboard Next.js, workflows n8n, módulos 1-8,
  billing portal, o cualquier archivo del repo talentscout-ai-dashboard), y en general cuando
  una tarea implique leer muchos archivos, explorar el código, editar código de forma repetitiva,
  o cuando el contexto se esté llenando. Enseña a cargar contexto una sola vez y barato, delegar
  lecturas pesadas a subagentes, hacer lecturas dirigidas, agrupar tool calls, y usar la memoria
  del proyecto en lugar de re-derivar. Si dudas si aplica, aplícala: casi todo el trabajo de
  TalentScout se beneficia de esto.
---

# TalentScout AI — Optimizador de tokens y contexto

## Por qué existe esta skill

El contexto es un recurso finito y caro. En un proyecto largo como TalentScout AI, la diferencia
entre un agente barato-y-rápido y uno caro-y-lento no está en el modelo: está en la **higiene de
contexto**. Cada archivo grande que metes al contexto "por si acaso", cada re-lectura de algo que
ya leíste, cada volcado de un JSON de 500 líneas para mirar un campo, se paga en tokens y en
latencia — y además ensucia tu razonamiento con ruido. Esta skill es el conjunto de hábitos que
mantienen el trabajo afilado sin sacrificar calidad.

La regla mental: **trae al contexto solo lo que vas a usar para la decisión que tienes enfrente.**
Todo lo demás se resume, se delega, o se deja en disco.

## Las 9 prácticas núcleo

### 1. Carga el contexto una sola vez, y barato
Al empezar cualquier trabajo de TalentScout, lee `CLAUDE.md` y `docs/STATE.md` una vez — eso te da
el 90% del contexto que necesitas. No vuelvas a leer archivos que ya están en tu contexto de este
turno; el harness ya los tiene. Para dudas puntuales sobre el proyecto, usa `project_search` (RAG)
en vez de re-leer documentos completos: te devuelve el fragmento exacto en vez de 500 líneas.

### 2. Delega la exploración pesada a subagentes
Cuando responder implica barrer muchos archivos ("¿dónde se calcula el fraud score?", "¿qué
componentes usan MetricCard?"), lanza un subagente `Explore` o `general-purpose`. El subagente
quema *su* contexto leyendo, y te devuelve solo la conclusión — no el volcado de archivos. Tú te
quedas con la respuesta, no con el ruido. Esto es lo más impactante de toda la skill.

### 3. Lecturas dirigidas, no lecturas totales
Cuando sí necesites leer directo: usa `Grep` para localizar el símbolo, luego `Read` con `offset`
y `limit` sobre el rango relevante. Leer un archivo de 800 líneas entero para tocar una función de
20 líneas es desperdicio. La excepción legítima: archivos que vas a editar en varios puntos, o
cuya lógica completa necesitas entender.

### 4. Agrupa tool calls independientes en un solo turno
Si vas a hacer varias operaciones que no dependen una de otra (leer 3 archivos, correr 2 checks),
emítelas juntas en el mismo turno. Menos round-trips = menos overhead de contexto y más velocidad.

### 5. Guiones deterministas para trabajo repetitivo
Si te encuentras haciendo la misma transformación a mano varias veces (renombrar, reformatear,
validar 7 registros de empresa), escribe un script corto y córrelo. Un script se ejecuta sin
cargar su salida intermedia al contexto y es reutilizable. No edites a mano lo que un bucle hace
mejor.

### 6. No vuelques archivos grandes al usuario
Cuando produzcas un archivo (código, reporte, JSON de workflow), **entrégalo con SendUserFile** —
no lo pegues en el chat. Pegar 300 líneas de código en la respuesta gasta tokens de salida y el
usuario igual prefiere el archivo descargable. Resume en una línea qué hiciste.

### 7. Usa la memoria del proyecto en vez de re-derivar
Decisiones, esquemas, convenciones y estado viven en `docs/STATE.md`, `docs/LEARNINGS.md`,
`CLAUDE.md` y los docs del proyecto Claude. Antes de re-analizar algo desde cero, revisa si ya
está registrado. Después de descubrir algo durable, escríbelo ahí (ver skill `talentscout-orchestrator`).

### 8. Escribe código de forma incremental
Para archivos largos: crea el esqueleto y ve poblándolo con `Edit` sección por sección. No
regeneres el archivo completo por un cambio pequeño — es más lento, más caro, y más propenso a
romper lo que ya funcionaba.

### 9. Respuestas magras
No re-expliques lo que ya está en un archivo que entregaste. No narres cada paso ("ahora voy
a..."). El usuario ve la lista de tareas y los archivos. Di el resultado y lo que sigue, en pocas
frases.

## Heurística de presupuesto (regla de oro)

Antes de una acción cara, pregúntate: *¿esto me acerca a una decisión concreta, o lo estoy
trayendo "por si acaso"?* Si es "por si acaso", no lo traigas — lo puedes buscar cuando lo
necesites. En trabajo de barrido amplio (auditorías, migraciones, "revisa todo el repo"),
delega a subagentes o a un Workflow en lugar de leerlo todo tú: mantienes tu contexto limpio para
la síntesis, que es donde aportas valor.

## Señales de que estás desperdiciando contexto (corrige al verlas)

- Leíste el mismo archivo dos veces en la misma sesión.
- Volcaste un archivo entero y solo usaste 10 líneas.
- Pegaste código largo en la respuesta en vez de entregar el archivo.
- Hiciste 5 turnos secuenciales de un solo tool call cada uno que pudieron ir juntos.
- Re-analizaste algo que ya estaba en STATE.md / LEARNINGS.md.

## Qué NO sacrificar por ahorrar tokens

El ahorro nunca justifica bajar la calidad ni saltarse verificación. No omitas leer un archivo que
*sí* necesitas entender para no romperlo. No adivines el contenido de un archivo para ahorrarte un
Read. La meta es eliminar el desperdicio, no la diligencia. Ahorrar tokens rompiendo el build es
el peor negocio posible.
