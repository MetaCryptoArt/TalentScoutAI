import { DiscBars, FraudBadge, StatusBadge } from "./ui";
import type { Candidate } from "@/lib/types";

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span>{v || "—"}</span>
    </div>
  );
}

export default function CandidateDetail({ c }: { c: Candidate }) {
  let flags: string[] = [];
  try {
    flags = JSON.parse(c.cv_internal_flags || "[]");
  } catch {
    flags = [];
  }

  return (
    <>
      <div className="page-title">{c.candidate_name || "(sin nombre)"}</div>
      <div className="page-sub">
        {c.candidate_email} · {c.candidate_phone} · {c.client_company}
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="label">Estado</div>
          <div style={{ marginTop: 8 }}><StatusBadge status={c.status} /></div>
        </div>
        <div className="metric">
          <div className="label">Fraud Risk</div>
          <div className="value">{c.fraud_risk_score || "—"}</div>
          <div style={{ marginTop: 4 }}><FraudBadge label={c.fraud_risk_label} /></div>
        </div>
        <div className="metric">
          <div className="label">Autenticidad texto</div>
          <div className="value">{c.text_authenticity_score ? `${c.text_authenticity_score}%` : "—"}</div>
        </div>
        <div className="metric">
          <div className="label">Autenticidad voz</div>
          <div className="value">{c.voice_authenticity_score ? `${c.voice_authenticity_score}%` : "—"}</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card" style={{ padding: 20 }}>
          <h3 className="section-title">Perfil DISC {c.disc_profile ? `· ${c.disc_profile}` : ""}</h3>
          <DiscBars c={c} />
          {c.disc_insights && (
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--text)" }}>{c.disc_insights}</p>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 className="section-title">Resumen del CV</h3>
          <p style={{ fontSize: 14 }}>{c.cv_summary || "—"}</p>
          {flags.length > 0 && (
            <>
              <h3 className="section-title" style={{ marginTop: 16 }}>Inconsistencias detectadas</h3>
              <ul style={{ fontSize: 13, color: "var(--red)", paddingLeft: 18 }}>
                {flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3 className="section-title">Respuestas de la entrevista de texto</h3>
        <KV k="Pregunta 1" v={c.q1_response} />
        <KV k="Pregunta 2" v={c.q2_response} />
        <KV k="Pregunta 3" v={c.q3_response} />
      </div>

      {c.voice_transcript && (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <h3 className="section-title">Transcripción de voz</h3>
          <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{c.voice_transcript}</p>
        </div>
      )}

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3 className="section-title">Recomendación</h3>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>{c.recommendation || "Pendiente"}</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          El Fraud Risk Score es una herramienta de apoyo a la decisión, no una conclusión
          definitiva. La decisión final de contratación es responsabilidad de la empresa.
        </p>
      </div>
    </>
  );
}
