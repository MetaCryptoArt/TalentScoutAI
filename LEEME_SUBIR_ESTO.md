# Botón "Activar entrevistas" — subir estos 3 archivos al repo (Talent Scout AI)

Sube (reemplazando) EXACTAMENTE estos 3 archivos en estas rutas del repo. Respeta las carpetas.

1. components/ClientActivity.tsx                          (REEMPLAZAR — trae la columna "Acciones" + el filtro de solo clientes reales)
2. components/StartCompanyInterviews.tsx                  (el botón)
3. app/api/admin/start-company-interviews/route.ts        (el endpoint)

Luego: commit a main + push → esperar "Ready" en Vercel → recargar con Ctrl+F5.

En "Admin → Actividad de clientes" debe aparecer la columna **Acciones** con el botón verde
**"Activar entrevistas"** (activo en empresas con CVs sin iniciar, como Leiro).

## Si AÚN no aparece la columna "Acciones"
Entonces el archivo no se está reemplazando de verdad en el repo (un copy/paste que no tomó, o se
subió a otra rama). La forma 100% segura: conecta la carpeta del repo a Cowork con el selector de
carpetas del app de escritorio y avísame — yo escribo los archivos directo y confirmo qué había.
