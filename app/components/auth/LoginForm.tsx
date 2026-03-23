"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth.actions";
import { initialAuthActionState } from "@/app/lib/auth.types";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="label px-0" htmlFor="email">
          <span className="label-text text-sm font-semibold text-white">Email</span>
        </label>
        <input
          autoComplete="email"
          className="input input-bordered h-12 w-full border-lux-hover/40 bg-lux-surface/80 text-white placeholder:text-lux-muted/60"
          id="email"
          name="email"
          placeholder="admin@empresa.com"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label className="label px-0" htmlFor="password">
          <span className="label-text text-sm font-semibold text-white">Contraseña</span>
        </label>
        <input
          autoComplete="current-password"
          className="input input-bordered h-12 w-full border-lux-hover/40 bg-lux-surface/80 text-white placeholder:text-lux-muted/60"
          id="password"
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <div aria-live="polite" className="alert alert-error border-0 text-sm">
          <span>{state.error}</span>
        </div>
      ) : null}

      <button
        className="btn h-12 w-full border-0 bg-lux-gold text-lux-bg"
        disabled={isPending}
        type="submit"
      >
        {isPending ? <span className="loading loading-spinner loading-sm" aria-hidden="true" /> : null}
        {isPending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
