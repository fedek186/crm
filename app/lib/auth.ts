import "server-only";

/* 
Este archivo maneja la lógica de autenticación del lado del servidor.
Incluye funciones para establecer y limpiar cookies de sesión, obtener el contexto de autenticación,
validar que el usuario sea un administrador y redirigir según su estado.

Elementos externos:
- cookies: módulo de Next.js para manejar cookies en el servidor.
- redirect: función de Next.js para redirigir al usuario.
- Session, SupabaseClient, User: tipos de Supabase para manejar la sesión y el usuario.
- AUTH_ACCESS_COOKIE_NAME, AUTH_REFRESH_COOKIE_NAME: constantes para los nombres de las cookies.
- createSupabaseServerClient: función para crear un cliente de Supabase en el servidor.
- isAdminUser: función para verificar si un usuario es administrador.

Funciones exportadas:
- setAuthCookies: establece las cookies de sesión.
- clearAuthCookies: limpia las cookies de sesión.
- getOptionalAuthContext: obtiene el contexto de autenticación.
- assertAuthenticatedAdmin: valida que el usuario sea un administrador autenticado.
- createAuthenticatedSupabaseClient: crea un cliente de Supabase autenticado.
- requireAuthenticatedAdminPage: valida que la página solo pueda ser vista por un administrador autenticado.
- redirectAuthenticatedAdminFromLogin: redirige al usuario si ya está autenticado.
*/

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_REFRESH_COOKIE_NAME,
  createSupabaseServerClient,
  isAdminUser,
} from "@/app/lib/supabase";

const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60;
const DEFAULT_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export type AuthContext = {
  accessToken: string;
  refreshToken: string | null;
  isAdmin: boolean;
  user: User;
};

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function setAuthCookies(session: Session): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_ACCESS_COOKIE_NAME,
    session.access_token,
    getCookieOptions(session.expires_in ?? DEFAULT_ACCESS_TOKEN_MAX_AGE)
  );
  cookieStore.set(
    AUTH_REFRESH_COOKIE_NAME,
    session.refresh_token,
    getCookieOptions(DEFAULT_REFRESH_TOKEN_MAX_AGE)
  );
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_ACCESS_COOKIE_NAME, "", {
    ...getCookieOptions(0),
    expires: new Date(0),
  });
  cookieStore.set(AUTH_REFRESH_COOKIE_NAME, "", {
    ...getCookieOptions(0),
    expires: new Date(0),
  });
}

export async function getOptionalAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_ACCESS_COOKIE_NAME)?.value ?? null;
  const refreshToken = cookieStore.get(AUTH_REFRESH_COOKIE_NAME)?.value ?? null;

  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    isAdmin: isAdminUser(data.user),
    user: data.user,
  };
}

export async function assertAuthenticatedAdmin(): Promise<AuthContext> {
  const authContext = await getOptionalAuthContext();

  if (!authContext) {
    throw new AuthorizationError("Debés iniciar sesión para continuar.");
  }

  if (!authContext.isAdmin) {
    throw new AuthorizationError("Tu usuario no tiene permisos de administrador.");
  }

  return authContext;
}

export async function createAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  const { accessToken } = await assertAuthenticatedAdmin();
  return createSupabaseServerClient(accessToken);
}

export async function requireAuthenticatedAdminPage(): Promise<AuthContext> {
  const authContext = await getOptionalAuthContext();

  if (!authContext?.isAdmin) {
    redirect("/login");
  }

  return authContext;
}

export async function redirectAuthenticatedAdminFromLogin(): Promise<void> {
  const authContext = await getOptionalAuthContext();

  if (authContext?.isAdmin) {
    redirect("/");
  }
}
