// app/(protected)/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get("auth_token")?.value;
  if (!token) {
    redirect("/login");
  }
  // Optional: verify(token) here with 'jose' using AUTH_SECRET env if you want SSR verification too.
  return <>{children}</>;
}
