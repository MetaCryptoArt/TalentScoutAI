# Activar entrevistas de una empresa (tú, sin pedírselo al cliente) — Talent Scout AI

## Qué hace
En **Admin → Actividad de clientes**, cada empresa (p. ej. **Leiro Assessment**) ahora tiene un botón
verde **"Activar entrevistas"** en la columna **Acciones**. Al pulsarlo, se envía el WhatsApp de inicio
de entrevista a **TODOS los candidatos que ese cliente cargó**, de una sola vez.

Seguro por diseño:
- Solo envía a candidatos **con teléfono** y en estado **"CV subido"** (los que ya se iniciaron o no
  tienen teléfono se **saltan**).
- Pide **confirmación** antes de enviar y muestra un **resumen** (enviados, ya iniciados, sin teléfono,
  con error).
- El botón se ve **apagado** si esa empresa no tiene CVs pendientes por iniciar.

## Cómo lo usarás (cuando Meta te quite las restricciones)
1. Entra a **Admin → Actividad de clientes**.
2. Busca la fila de **Leiro Assessment** (verás cuántos CVs subió).
3. Pulsa **"Activar entrevistas"** → confirma → se envían los WhatsApp a sus candidatos.
4. Revisa el resumen. Los que queden "con error" suelen ser por restricción de Meta o teléfono inválido;
   reintenta cuando Meta esté OK.

> ⚠️ Importante: esto solo funciona cuando tu número de WhatsApp esté **fuera de restricción** en Meta.
> Si Meta aún te limita, los envíos fallarán (el resumen lo indicará). Espera a que te levanten el límite.

## Archivos (copiar sobre el repo, respetando carpetas)
- `app/api/admin/start-company-interviews/route.ts`  (NUEVO — endpoint admin)
- `components/StartCompanyInterviews.tsx`  (NUEVO — el botón)
- `components/ClientActivity.tsx`  (MODIFICADO — agrega la columna "Acciones" con el botón;
  **incluye también** el arreglo anterior de mostrar solo clientes reales)

> Nota: este `ClientActivity.tsx` **reemplaza** al del ZIP anterior (el de "solo clientes reales"): ya
> trae los dos cambios juntos. Sube este.

## Alternativa (sin este cambio): uno por uno
Como admin ya puedes iniciar cualquier entrevista desde la **ficha del candidato** (botón "Iniciar
entrevista"). El botón por empresa solo lo hace más rápido para muchos CVs a la vez.
