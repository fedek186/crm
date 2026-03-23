import LoginForm from "@/app/components/auth/LoginForm";
import { redirectAuthenticatedAdminFromLogin } from "@/app/lib/auth";

export default async function LoginPage() {
  await redirectAuthenticatedAdminFromLogin();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-lux-bg px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(241,111,132,0.18),_transparent_32%),radial-gradient(circle_at_right,_rgba(43,120,228,0.12),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.03),_transparent_45%)]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between border-b border-white/10 px-8 py-10 md:border-b-0 md:border-r md:px-12 md:py-14">
          <div className="space-y-6">
            <span className="inline-flex w-fit rounded-full border border-lux-gold/30 bg-lux-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-lux-gold">
              Admin Access
            </span>

            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Panel interno para operar el CRM con permisos de administrador.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-white/70 md:text-base">
                El acceso queda restringido a usuarios autenticados con `app_metadata.is_admin =
                true` en Supabase Auth.
              </p>
            </div>
          </div>

          <div className="grid gap-3 pt-8 text-sm text-white/65">
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
              Middleware protegiendo rutas privadas y refrescando sesión.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
              Server Actions para login y logout con cookies `httpOnly`.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
              Servicios Prisma validados antes de ejecutar queries.
            </div>
          </div>
        </section>

        <section className="flex items-center px-8 py-10 md:px-12 md:py-14">
          <div className="w-full">
            <div className="mb-8 space-y-2">
              <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
              <p className="text-sm text-white/65">
                Usá tu cuenta administradora de Supabase para entrar al CRM.
              </p>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
