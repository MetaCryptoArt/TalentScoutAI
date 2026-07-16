import Link from "next/link";
import type { Candidate } from "@/lib/types";

export function FraudBadge({ label }: { label: string }) {
  const l = (label || "").toUpperCase();
  if (l === "VERIFIED") return <span className="badge badge-verified">VERIFIED</span>;
  if (l === "CAUTION") return <span className="badge badge-caution">CAUTION</span>;
  if (l === "HIGH_RISK" || l === "HIGH RISK") return <span className="badge badge-risk">HIGH RISK</span>;
  return <span className="badge badge-neutral">—</span>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  text_interview: "Entrevista texto",
  text_interview_complete: "Texto completo",
  voice_invited: "Invitado a voz",
  voice_sent: "Link de voz enviado",
  voice_complete: "Voz completa",
  complete: "Completo",
  rejected_no_consent: "Sin consentimiento",
  rejected_disc: "Rechazado (DISC)",
  rejected_fraud: "Rechazado (fraude)",
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status || "—";
  return <span className="badge badge-neutral">{label}</span>;
}

const DISC_META: [keyof Candidate, string, string][] = [
  ["disc_d_score", "D", "#dc2626"],
  ["disc_i_score", "I", "#d97706"],
  ["disc_s_score", "S", "#16a34a"],
  ["disc_c_score", "C", "#2563eb"],
];

export function DiscBars({ c }: { c: Candidate }) {
  const has = c.disc_d_score || c.disc_i_score || c.disc_s_score || c.disc_c_score;
  if (!has) return <span style={{ color: "var(--muted)", fontSize: 13 }}>Pendiente</span>;
  return (
    <div className="disc">
      {DISC_META.map(([key, letter, color]) => {
        const val = Number(c[key] || 0);
        return (
          <div className="disc-row" key={letter}>
            <strong style={{ color }}>{letter}</strong>
            <div className="disc-track">
              <div className="disc-fill" style={{ width: `${val}%`, background: color }} />
            </div>
            <span>{val}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function Metrics({ candidates }: { candidates: Candidate[] }) {
  const total = candidates.length;
  const completos = candidates.filter((c) => c.status === "complete").length;
  const verified = candidates.filter((c) => (c.fraud_risk_label || "").toUpperCase() === "VERIFIED").length;
  const riesgo = candidates.filter((c) => (c.fraud_risk_label || "").toUpperCase().includes("RISK")).length;
  const M = [
    { label: "Candidatos", value: total },
    { label: "Completos", value: completos },
    { label: "Verificados", value: verified },
    { label: "Alto riesgo", value: riesgo },
  ];
  return (
    <div className="metrics">
      {M.map((m) => (
        <div className="metric" key={m.label}>
          <div className="label">{m.label}</div>
          <div className="value">{m.value}</div>
        </div>
      ))}
    </div>
  );
}

export function CandidateTable({
  candidates,
  basePath,
  showCompany = false,
}: {
  candidates: Candidate[];
  basePath: string;
  showCompany?: boolean;
}) {
  if (candidates.length === 0) {
    return <div className="card"><div className="empty">Aún no hay candidatos procesados.</div></div>;
  }
  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>Candidato</th>
            {showCompany && <th>Empresa</th>}
            <th>DISC</th>
            <th>Autenticidad</th>
            <th>Fraud Risk</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.session_id}>
              <td>
                <Link href={`${basePath}/${c.session_id}`} style={{ color: "var(--blue)", fontWeight: 600 }}>
                  {c.candidate_name || "(sin nombre)"}
                </Link>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{c.candidate_email}</div>
              </td>
              {showCompany && <td>{c.client_company}</td>}
              <td>{c.disc_profile ? <strong>{c.disc_profile}</strong> : "—"}</td>
              <td>{c.text_authenticity_score ? `${c.text_authenticity_score}%` : "—"}</td>
              <td>
                {c.fraud_risk_score ? <span style={{ marginRight: 8 }}>{c.fraud_risk_score}</span> : null}
                <FraudBadge label={c.fraud_risk_label} />
              </td>
              <td><StatusBadge status={c.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
