import { NextResponse } from "next/server";
import { ADMIN_COOKIE, EMPRESA_COOKIE } from "@/lib/jwt";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(EMPRESA_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
