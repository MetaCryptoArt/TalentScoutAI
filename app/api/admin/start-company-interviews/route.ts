// Admin: INICIA la entrevista (envía el WhatsApp de opt-in) a TODOS los candidatos cargados de una
// empresa, de una sola vez. Pensado para cuando el reclutador (cliente) subió CVs y tú quieres activar
// las entrevistas por él. Solo admin. Envía SOLO a candidatos con teléfono y en estado "cv_loaded"/""
// (los que ya se iniciaron o no tienen teléfono se saltan). Usa el mismo webhook de n8n que
// /api/start-interview y deja cada candidato en estado "pending".
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getCandidates } from "@/lib/sheets";
import { updateCandidateStatus } from "@/lib/sheets-write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (s?: string) => (s || "").trim().toLowerCase();
const MAX = 300; // tope de seguridad por llamada

export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const company = String(body.company || "").trim();
  if (!company) return NextResponse.json({ error: "Falta la empresa." }, { status: 400 });

  const url = process.env.N8N_START_INTERVIEW_URL;
  if (!url) {
    return NextResponse.json(
      { error: "El inicio de entrevista aún no está configurado (falta el webhook de n8n)." },
      { status: 503 }
    );
  }

  let all;
  try { all = await getCandidates(); }
  catch (e) { return NextResponse.json({ error: "No se pudieron leer los candidatos: " + (e as Error).message }, { status: 500 }); }

  const target = norm(company);
  const list = all.filter((c) => norm(c.client_company) === target);

  const startable = (s: string) => { const x = norm(s); return x === "" || x === "cv_loaded"; };

  let sent = 0, alreadyStarted = 0, noPhone = 0, failed = 0, capped = 0;
  const failures: { name: string; error: string }[] = [];

  for (const c of list) {
    if (!startable(c.status)) { alreadyStarted++; continue; }
    const phone = (c.candidate_phone || "").replace(/[^\d]/g, "");
    if (!phone) { noPhone++; continue; }
    if (sent >= MAX) { capped++; continue; }

    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: c.session_id,
          phone,
          name: c.candidate_name || "",
          email: c.candidate_email || "",
          client_company: c.client_company || "",
          lang: (c.lang === "en" ? "en" : "es"),
        }),
      });
      if (!r.ok) {
        failed++;
        failures.push({ name: c.candidate_name || c.session_id, error: "n8n " + r.status });
        continue;
      }
      // Deja el estado en 'pending' (igual que /api/start-interview) para que n8n procese el "SÍ".
      try { await updateCandidateStatus(c.session_id, "pending"); } catch { /* no bloquea */ }
      sent++;
    } catch (e) {
      failed++;
      failures.push({ name: c.candidate_name || c.session_id, error: (e as Error).message });
    }
  }

  return NextResponse.json({
    ok: true,
    company,
    total: list.length,
    sent,
    alreadyStarted,
    noPhone,
    failed,
    capped,
    failures: failures.slice(0, 10),
  });
}
