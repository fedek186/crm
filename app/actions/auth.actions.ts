"use server";

/*
Este archivo define las Server Actions de autenticación del panel de administración.
Resuelve el inicio y cierre de sesión de administradores, valida credenciales y permisos,
administra las cookies de sesión y redirige al usuario según el resultado de la operación.

Elementos externos:
- redirect: redirige al usuario a la ruta correspondiente después del login o logout.
- clearAuthCookies: elimina las cookies de autenticación locales al cerrar sesión.
- getOptionalAuthContext: recupera la sesión actual desde cookies si existe.
- setAuthCookies: guarda en cookies la sesión autenticada luego del login.
- AuthActionState: tipa el estado de respuesta usado por la acción de login.
- createSupabaseServerClient: crea el cliente de Supabase para ejecutar operaciones de autenticación del lado servidor.
- isAdminUser: valida si el usuario autenticado tiene permisos de administrador.

Funciones exportadas:
- signIn: procesa el inicio de sesión, valida credenciales y permisos de administrador, guarda la sesión y redirige al panel principal.
- signOut: cierra la sesión actual en Supabase, limpia las cookies locales y redirige a la pantalla de login.
*/

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
