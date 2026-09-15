"use server";

import { redirect } from "next/navigation";
import {
  clearSession,
  createSession,
  getSafeRedirectPath,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function login(formData: FormData) {
  const password = String(formData.get("password") || "");
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!configuredPassword || password !== configuredPassword) {
    redirect(`/login?error=1&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const preferredName = process.env.ADMIN_USER_NAME?.trim();
  const userSelect = { id: true, name: true, role: true } as const;
  const adminUser = preferredName
    ? (await prisma.user.findFirst({
        where: { name: preferredName, role: "admin" },
        select: userSelect,
      })) ??
      (await prisma.user.findFirst({
        where: { role: "admin" },
        orderBy: { id: "asc" },
        select: userSelect,
      }))
    : await prisma.user.findFirst({
        where: { role: "admin" },
        orderBy: { id: "asc" },
        select: userSelect,
      });

  if (!adminUser || adminUser.role !== "admin") {
    redirect(`/login?error=1&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  await createSession({
    id: adminUser.id,
    name: adminUser.name,
    role: "admin",
  });
  redirect(redirectTo);
}

export async function logout() {
  await clearSession();
  redirect("/games");
}
