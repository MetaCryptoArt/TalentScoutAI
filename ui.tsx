"use client";

export default function LogoutButton({ redirectTo }: { redirectTo: string }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = redirectTo;
  }
  return (
    <button className="logout" onClick={logout}>
      Cerrar sesión
    </button>
  );
}
