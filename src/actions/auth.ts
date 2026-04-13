"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { SignUpSchema, SignInSchema } from "@/lib/validations";

export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function signUp(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["Email already in use"] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "CUSTOMER" },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect("/merchants");
}

export async function signIn(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { merchant: true },
  });

  if (!user || !user.passwordHash) {
    return { errors: { email: ["Invalid email or password"] } };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { errors: { email: ["Invalid email or password"] } };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    merchantId: user.merchant?.id,
  });

  if (user.role === "PLATFORM_ADMIN") {
    redirect("/admin");
  } else if (user.role === "MERCHANT") {
    redirect("/merchant/dashboard");
  } else {
    redirect("/merchants");
  }
}

export async function signOut() {
  await deleteSession();
  redirect("/auth/signin");
}
