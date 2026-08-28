// middleware.ts — Middleware de Next.js (reconstruido).
// El archivo anterior se corrompió: se llenó con el TEXTO de una skill en vez de código, y eso
// rompía TODO el build de Vercel (por eso no se desplegaba nada nuevo).
//
// La autenticación del sistema NO depende de este archivo: el login y el aislamiento por empresa se
// validan en los layouts y en las rutas del servidor (getAdminSession / getEmpresaSession + redirect).
// Por eso este middleware queda en modo "no interviene" (matcher vacío): build limpio y sin cambiar
// el comportamiento del sistema.
import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

// matcher vacío = el middleware no se ejecuta en ninguna ruta.
export const config = {
  matcher: [],
};
