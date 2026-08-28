// Vista de ADMIN "Actividad de clientes": ¿de verdad están USANDO TalentScout, no solo registrados?
// Cruza la hoja `companies` (estado de prueba + último ingreso) con `interview_sessions` (uso real:
// CVs subidos, entrevistas iniciadas/completadas, última actividad) y muestra una etiqueta de salud.
// Presentacional (server component): usa tokens --d-* del panel admin (oscuro).
import type { Candidate } from "@/lib/types";
import type { StoredCompany } from "@/lib/companies-store";
import type { CrmLead } from "@/lib/crm-store";
import { isRealCustomer } from "@/lib/real-customers";
import StartCompanyInterviews from "./StartCompanyInterviews";

const AV = ["#6366f1", "#0891b2", "#db2777", "#ea580c", "#16a34a", "#7c3aed"];
function col(name: string) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV[h % AV.length]; }
const norm = (s?: string) => (s || "").trim().toLowerCase();

function parseDate(iso?: string): number {
  if (!iso) return 0;
  const d = new Date(String(iso).replace(" ", "T"));
  const ms = d.getTime();
  return isNaN(ms) ? 0 : ms;
}
function ago(iso?: string): string {
  const ms = parseDate(iso);
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return "hace <1 h";
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

type Health = { label: string; color: string; bg: string };
function health(cvs: number, interviews: number, lastMs: number): Health {
  const red = { color: "#fca5a5", bg: "rgba(239,68,68,.14)" };
  const amber = { color: "#fbbf24", bg: "rgba(245,158,11,.16)" };
  const green = { color: "#22c55e", bg: "rgba(34,197,94,.14)" };
  if (cvs === 0) return { label: "Registrado · sin usar", ...red };
  if (interviews === 0) return { label: "Subió CVs · sin entrevistar", ...amber };
  const staleDays = lastMs ? (Date.now() - lastMs) / 86400000 : 99;
  if (staleDays > 5) return { label: "Activo · enfriándose", ...amber };
  return { label: "Activo", ...green };
}

export default function ClientActivity({
  companies, candidates, leads = [],
}: { companies: StoredCompany[]; candidates: Candidate[]; leads?: CrmLead[] }) {
  // Agrupa candidatos por empresa (normalizado por nombre).
  const byCo = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const k = norm(c.client_company);
    if (!k) continue;
    (byCo.get(k) || byCo.set(k, []).get(k)!).push(c);
  }

  type Row = {
    name: string; email: string; plan: string; status: string; trialEnds: string; lastLogin: string;
    cvs: number; interviews: number; reports: number; lastMs: number;
  };
  const started = (s: string) => { const x = norm(s); return !!x && x !== "cv_loaded"; };
  const hasReport = (c: Candidate) => !!(c.fraud_risk_label || c.disc_profile) || norm(c.status) === "complete";

  // Unión de 3 fuentes: empresas provisionadas (`companies`) + `client_company` de los candidatos
  // (`interview_sessions`) + leads del CRM (`crm_leads`) en etapa de prueba/cliente. Así el cliente
  // aparece aunque solo esté en el CRM (que es donde cae al registrarse la prueba) y no en `companies`.
  const byName = new Map<string, StoredCompany>();
  for (const co of companies) { const k = norm(co.name); if (k) byName.set(k, co); }

  // Leads que representan un cliente real (no prospectos fríos).
  const CLIENT_STAGES = new Set(["prueba", "propuesta", "ganado"]);
  const byLead = new Map<string, CrmLead>();
  for (const l of leads) {
    if (!CLIENT_STAGES.has(norm(l.stage))) continue;
    const k = norm(l.company) || norm(l.email);
    if (k && !byLead.has(k)) byLead.set(k, l);
  }

  // Nombres que NO son clientes reales y NO deben aparecer aquí ni en los KPIs:
  //  • "demo": la cuenta de demostración (semilla).
  //  • "carga manual": los CVs que sube el ADMIN desde el panel (sin empresa cliente asignada).
  //  • cualquier empresa que no pase isRealCustomer (cuentas de prueba del dueño por correo).
  const EXCLUDED = new Set<string>(["demo", "carga manual"]);
  for (const co of companies) { if (!isRealCustomer(co)) { const k = norm(co.name); if (k) EXCLUDED.add(k); } }
  const excluded = (k: string) => !k || EXCLUDED.has(k);

  const names = new Set<string>();
  for (const co of companies) {
    const k = norm(co.name);
    if (!excluded(k) && norm(co.status) !== "disabled") names.add(k);
  }
  for (const k of byCo.keys()) { if (!excluded(k)) names.add(k); }
  for (const k of byLead.keys()) { if (!excluded(k)) names.add(k); }

  const rows: Row[] = Array.from(names).map((k) => {
    const co = byName.get(k);
    const lead = byLead.get(k);
    const list = byCo.get(k) || [];
    const interviews = list.filter((c) => started(c.status)).length;
    const reports = list.filter(hasReport).length;
    const lastMs = list.reduce((m, c) => Math.max(m, parseDate(c.updated_at), parseDate(c.created_at)), 0);
    const status = co
      ? (norm(co.status) || "active")
      : lead
        ? (norm(lead.stage) === "ganado" ? "active" : "trial")
        : "sinficha";
    return {
      name: co?.name || lead?.company || list[0]?.client_company || k,
      email: co?.email || lead?.email || "",
      plan: co?.plan || lead?.plan || "—",
      status,
      trialEnds: co?.trialEnds || "", lastLogin: co?.lastLogin || "",
      cvs: list.length, interviews, reports, lastMs,
    };
  });

  // Ordena: los que menos usan primero (para que saltes a activarlos), luego por CVs.
  rows.sort((a, b) => (a.cvs - b.cvs) || (a.interviews - b.interviews));

  const trialCount = rows.filter((r) => r.status === "trial").length;
  const usingCount = rows.filter((r) => r.interviews > 0).length;
  const idleCount = rows.filter((r) => r.cvs === 0).length;

  const daysLeft = (iso: string) => {
    const ms = parseDate(iso);
    if (!ms) return null;
    return Math.max(0, Math.ceil((ms - Date.now()) / 86400000));
  };

  const Stat = ({ n, l, acc }: { n: number | string; l: string; acc?: string }) => (
    <div className="stat" style={{ ["--acc" as string]: acc || "var(--d-green)" }}>
      <div className="lbl">{l}</div><div className="num">{n}</div>
    </div>
  );

  return (
    <div>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Stat n={rows.length} l="Clientes" />
        <Stat n={trialCount} l="En prueba" acc="var(--d-blue)" />
        <Stat n={usingCount} l="Usando de verdad" />
        <Stat n={idleCount} l="Registrados sin usar" acc="var(--d-red)" />
      </div>

      <div className="panel" style={{ marginTop: 16, overflowX: "auto" }}>
        <div className="dsec" style={{ padding: "14px 16px 4px", fontSize: 12.5, color: "var(--d-faint)" }}>
          <b style={{ color: "var(--d-text)", fontSize: 14 }}>Actividad de clientes</b> · ¿están usando la herramienta, no solo registrados?
        </div>
        {rows.length === 0 ? (
          <div className="empty">Aún no hay clientes provisionados en la hoja.</div>
        ) : (
          <table>
            <thead><tr>
              <th>Empresa</th><th>Plan</th><th>Estado</th><th>Último ingreso</th>
              <th>CVs</th><th>Entrevistas</th><th>Reportes</th><th>Última actividad</th><th>Salud</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const h = health(r.cvs, r.interviews, r.lastMs);
                const dl = r.status === "trial" ? daysLeft(r.trialEnds) : null;
                return (
                  <tr key={r.name}>
                    <td>
                      <div className="cand">
                        <div className="ini" style={{ background: col(r.name) }}>{r.name.slice(0, 2).toUpperCase()}</div>
                        <div><b>{r.name}</b>{r.email ? <small style={{ display: "block", color: "var(--d-faint)", fontSize: 11.5 }}>{r.email}</small> : null}</div>
                      </div>
                    </td>
                    <td style={{ textTransform: "capitalize", color: "var(--d-muted)", fontSize: 13 }}>{r.plan}</td>
                    <td style={{ fontSize: 13 }}>
                      {r.status === "trial"
                        ? <span style={{ color: "var(--d-blue)" }}>Prueba{dl !== null ? ` · ${dl} d` : ""}</span>
                        : r.status === "sinficha"
                          ? <span style={{ color: "var(--d-faint)" }} title="Aparece por sus candidatos, pero sin fila en 'companies'">Sin ficha</span>
                          : <span style={{ color: "var(--d-green)" }}>Activa</span>}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--d-muted)" }}>{ago(r.lastLogin)}</td>
                    <td><b style={{ fontSize: 15 }}>{r.cvs}</b></td>
                    <td><b style={{ fontSize: 15, color: r.interviews ? "var(--d-green)" : "var(--d-faint)" }}>{r.interviews}</b></td>
                    <td><b style={{ fontSize: 15, color: r.reports ? "var(--d-text)" : "var(--d-faint)" }}>{r.reports}</b></td>
                    <td style={{ fontSize: 13, color: "var(--d-muted)" }}>{r.lastMs ? ago(new Date(r.lastMs).toISOString()) : "—"}</td>
                    <td><span style={{ fontSize: 12, fontWeight: 700, color: h.color, background: h.bg, padding: "5px 11px", borderRadius: 20, whiteSpace: "nowrap" }}>{h.label}</span></td>
                    <td><StartCompanyInterviews company={r.name} pending={Math.max(0, r.cvs - r.interviews)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ color: "var(--d-faint)", fontSize: 12, marginTop: 12, padding: "0 4px" }}>
        Una entrevista cuenta desde que el candidato pasa de "CV subido". "Reportes" = candidatos ya evaluados (DISC / Fraud Score). Los datos se actualizan al recargar.
      </div>
    </div>
  );
}
