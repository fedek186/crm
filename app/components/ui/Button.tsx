/*
Este archivo provee el componente Button reutilizable del CRM.
Aplica los estilos primarios consistentes con el diseño del sistema (DaisyUI btn-primary)
y acepta variantes opcionales para adaptar su apariencia según el contexto.

Funciones exportadas:
- Button: botón genérico con estilos primarios del CRM, soporta variantes y className personalizado.
*/

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "outline" | "error";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidthMobile?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  ghost: "btn btn-ghost",
  outline: "btn btn-outline",
  error: "btn btn-error btn-outline",
};

export default function Button({
  variant = "primary",
  fullWidthMobile = false,
  className = "btn bg-lux-gold text-lux-bg hover:bg-lux-gold/90 transition-all shadow-[0_0_15px_rgba(241,111,132,0.12)] border-none flex-1 sm:flex-none",
  children,
  ...props
}: ButtonProps) {
  const base = variantClasses[variant];
  const responsive = fullWidthMobile ? "w-full sm:w-auto" : "";

  return (
    <button className={`${base} ${responsive} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
