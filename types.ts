import { NextResponse } from "next/server";
import { signToken, ADMIN_COOKIE } from "@/lib/jwt";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }));
  const okEmail = process.env.ADMIN_EMAIL || "salo@talentscout.ai";
  const okPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (email !== okEmail || password !== okPassword) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
  const token = await signToken({ role: "admin", sub: "admin" });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
