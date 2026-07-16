import LoginForm from "@/components/LoginForm";

export default function PortalLogin() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          TalentScout <span>AI</span>
        </div>
        <div className="auth-sub">Portal de empresas — acceso RR.HH.</div>
        <LoginForm endpoint="/api/auth/empresa" redirectTo="/portal" />
        <div className="auth-note">
          ¿No tienes acceso aún? Contacta a tu ejecutivo de cuenta.
        </div>
      </div>
    </div>
  );
}
