// Botón (admin) para iniciar la entrevista de TODOS los candidatos cargados de una empresa (envía el
// WhatsApp de opt-in). Llama a /api/admin/start-company-interviews. Muestra confirmación y un resumen.
"use client";
import { useState } from "react";

type Result = {
  total: number; sent: number; alreadyStarted: number; noPhone: number; failed: number; capped: number;
  failures?: { name: string; error: string }[];
};

export default function StartCompanyInterviews({ company, pending }: { company: string; pending: number }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [res, setRes] = useState<Result | null>(null);
  const [msg, setMsg] = useState("");

  async function run() {
    if (state === "sending") return;
    const n = pending > 0 ? pending : 0;
    const ok = window.confirm(
      `Se enviará el WhatsApp de inicio de entrevista a los candidatos cargados de "${company}"` +
      (n ? ` (≈${n} sin iniciar)` : "") +
      `.\n\nSolo se envía a quienes tengan teléfono y aún no se hayan iniciado. ¿Continuar?`
    );
    if (!ok) return;
    setState("sending"); setMsg(""); setRes(null);
    try {
      const r = await fetch("/api/admin/start-company-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setState("error"); setMsg(j.error || "No se pudo activar."); return; }
      setRes(j as Result); setState("done");
    } catch {
      setState("error"); setMsg("Error de conexión. Intenta de nuevo.");
    }
  }

  if (state === "done" && res) {
    return (
      <div style={{ fontSize: 12, lineHeight: 1.5 }}>
        <div style={{ color: "#22c55e", fontWeight: 700 }}>✓ {res.sent} enviado{res.sent === 1 ? "" : "s"}</div>
        <div style={{ color: "var(--d-faint)" }}>
          {res.alreadyStarted ? `${res.alreadyStarted} ya iniciados · ` : ""}
          {res.noPhone ? `${res.noPhone} sin teléfono · ` : ""}
          {res.failed ? `${res.failed} con error` : ""}
          {!res.alreadyStarted && !res.noPhone && !res.failed ? "todos ok" : ""}
        </div>
        {res.failed && res.failures && res.failures.length ? (
          <div style={{ color: "#fca5a5", marginTop: 3 }} title={res.failures.map((f) => f.name + ": " + f.error).join("\n")}>
            {res.failures[0].name}: {res.failures[0].error}{res.failures.length > 1 ? "…" : ""}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <button
        type="button"
        onClick={run}
        disabled={state === "sending" || pending <= 0}
        title={pending <= 0 ? "No hay CVs sin iniciar" : "Enviar WhatsApp a los candidatos cargados"}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: pending > 0 ? "var(--tone-green, #22c55e)" : "var(--d-bg2, #1a2233)",
          color: pending > 0 ? "#04160b" : "var(--d-faint, #5b6577)",
          border: "1px solid " + (pending > 0 ? "transparent" : "var(--d-border2, #243149)"),
          borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700,
          cursor: state === "sending" || pending <= 0 ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>
        {state === "sending" ? "Enviando…" : "Activar entrevistas"}
      </button>
      {state === "error" && <small style={{ color: "#fca5a5", fontSize: 11, maxWidth: 200 }}>{msg}</small>}
    </div>
  );
}
