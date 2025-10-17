// app/(protected)/layout.tsx
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // En tu Next actual, cookies() devuelve una Promise => hay que await
  const cookieStore = await cookies();
  // Usa el mismo nombre que setea el backend (login.py): "yarbis_session"
  const token = cookieStore.get("yarbis_session")?.value;

  if (!token) {
    redirect("/login");
  }

  return <>{children}</>;
}
