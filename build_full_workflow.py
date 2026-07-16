import { redirect } from "next/navigation";
import { getEmpresaSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getEmpresaSession();
  if (!session) redirect("/portal/login");

  return (
    <div>
      <div className="topbar">
        <div className="brand">
          TalentScout <span>AI</span> · {session.companyName}
        </div>
        <div className="right">
          <LogoutButton redirectTo="/portal/login" />
        </div>
      </div>
      <div className="container">{children}</div>
    </div>
  );
}
