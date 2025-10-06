// app/api/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const API = process.env.NEXT_PUBLIC_API!;
  const form = await req.formData();

  // Ajusta nombres si tu backend usa otros (username/password, etc.)
  const upstreamRes = await fetch(`${API}/_auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      usuario: String(form.get("usuario") ?? ""),
      password: String(form.get("password") ?? ""),
    }),
    // Si tu backend emite cookie de sesión, la capturamos abajo
    // (no hace falta credentials aquí: esto corre en server)
  });

  const bodyText = await upstreamRes.text();

  // Propaga cookies de sesión (si las hay)
  const res = new NextResponse(bodyText, { status: upstreamRes.status });
  const setCookie = upstreamRes.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);

  // Opcional: replica content-type si es HTML/JSON
  const ct = upstreamRes.headers.get("content-type");
  if (ct) res.headers.set("content-type", ct);

  return res;
}
