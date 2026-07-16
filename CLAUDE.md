import { getCandidates } from "@/lib/sheets";
import { Metrics, CandidateTable } from "@/components/ui";
import type { Candidate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  let candidates: Candidate[] = [];
  let error = "";
  try {
    candidates = await getCandidates();
  } catch (e) {
    error = (e as Error).message;
  }

  const empresas = new Set(candidates.map((c) => c.client_company).filter(Boolean)).size;

  return (
    <>
      <div className="page-title">Todos los candidatos</div>
      <div className="page-sub">{empresas} empresa(s) · {candidates.length} candidato(s)</div>
      {error ? (
        <div className="card">
          <div className="empty">
            No se pudieron cargar los datos.<br />
            <span style={{ fontSize: 13 }}>{error}</span>
          </div>
        </div>
      ) : (
        <>
          <Metrics candidates={candidates} />
          <CandidateTable candidates={candidates} basePath="/admin/candidato" showCompany />
        </>
      )}
    </>
  );
}
