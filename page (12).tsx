import Link from "next/link";
import { getCandidateBySession } from "@/lib/sheets";
import CandidateDetail from "@/components/CandidateDetail";
import type { Candidate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCandidate({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  let c: Candidate | null = null;
  let error = "";
  try {
    c = await getCandidateBySession(sessionId);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <Link className="back" href="/admin">← Volver a candidatos</Link>
      {error ? (
        <div className="card"><div className="empty">{error}</div></div>
      ) : c ? (
        <CandidateDetail c={c} />
      ) : (
        <div className="card"><div className="empty">Candidato no encontrado.</div></div>
      )}
    </>
  );
}
