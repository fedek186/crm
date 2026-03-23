"use server";

import { redirect } from "next/navigation";
import { clearAuthCookies, getOptionalAuthContext, setAuthCookies } from "@/app/lib/auth";
import { type AuthActionState } from "@/app/lib/auth.types";
import { createSupabaseServerClient, isAdminUser } from "@/app/lib/supabase";

function getFieldValue(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = getFieldValue(formData, "email");
  const password = getFieldValue(formData, "password");

  if (!email || !password) {
    return {
      error: "Completá email y contraseña.",
      success: false,
    };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    return {
      error:
        error?.message === "Invalid login credentials"
          ? "Email o contraseña inválidos."
          : "No se pudo iniciar sesión. Revisá tus credenciales e intentá nuevamente.",
      success: false,
    };
  }

  if (!isAdminUser(data.user)) {
    return {
      error: "Tu usuario no tiene permisos de administrador.",
      success: false,
    };
  }

  await setAuthCookies(data.session);

  redirect("/");
}

export async function signOut(): Promise<void> {
  const authContext = await getOptionalAuthContext();

  if (authContext?.refreshToken) {
    const supabase = createSupabaseServerClient();

    try {
      await supabase.auth.setSession({
        access_token: authContext.accessToken,
        refresh_token: authContext.refreshToken,
      });
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out from Supabase:", error);
    }
  }

  await clearAuthCookies();

  redirect("/login");
}
