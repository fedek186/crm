---
name: nueva-pantalla-supabase
description: Circuito estándar para crear una pantalla nueva que lea datos de Supabase. Define qué carpeta usar en cada capa y cómo se conectan entre sí.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash(npx tsc *)
---

# /nueva-pantalla-supabase

Guía para crear cualquier pantalla nueva que lea datos de Supabase en este CRM.
El argumento es el nombre o propósito de la pantalla: `$ARGUMENTS`

Antes de crear nada, leer `CLAUDE.md` y explorar si ya existe algún tipo, service
o componente reutilizable relacionado con lo que se va a construir.

---

## Circuito de capas

Siempre en este orden. Cada capa importa solo de la anterior.

```
app/lib/          →  app/services/      →  app/api/          →  app/components/   →  app/[ruta]/
Tipos y config       Lógica de datos       Endpoints HTTP        UI interactiva       Page entry
```

---

## Capa 1 — `app/lib/<nombre>.config.ts`

**Responsabilidad:** fuente única de verdad para tipos, constantes e IDs de la entidad.

- Definir todos los tipos TypeScript de la feature aquí.
- Exportar type guards (`isValid*`) para que las API routes puedan validar params.
- Los type guards deben derivarse de `const` arrays, no de strings hardcodeados duplicados.
- Cero `any`.

---

## Capa 2 — `app/services/<nombre>.service.ts`

**Responsabilidad:** toda la lógica de acceso a datos y de negocio. Nada más.

**Cliente Supabase:**
- Usar siempre `createServiceRoleSupabaseClient()` de `app/lib/supabase.ts`.
- Las tablas de negocio tienen RLS activo — el cliente autenticado del usuario
  no tiene permisos de lectura total. El service role bypasea RLS.
- La autenticación del admin ocurre en la capa de API, no aquí.

**Reglas de queries:**
- Antes de cada `.in("columna", ids)`: verificar que `ids.length > 0`.
  Si el array está vacío, retornar el early result directamente sin llamar a Supabase.
- Usar type predicates en `.filter()` para narrowing seguro:
  ```ts
  .filter((t): t is { id: string; user_id: string } =>
    typeof t.id === "string" && typeof t.user_id === "string"
  )
  ```
  Nunca `as string` sobre campos de Supabase sin verificar antes.
- Valores numéricos: `parseFloat(String(val))` + `isNaN()` antes de formatear.
  Nunca `Number(campo_supabase)` directo — puede producir `NaN` o `0` silencioso.

**Exports:**
- Las funciones de lectura (`get*`) se exportan para ser llamadas por las API routes.
- Las constantes compartidas con la UI (ej. `PAGE_SIZE`) se exportan desde aquí
  para que el componente las importe, evitando duplicación y posible desincronización.

---

## Capa 3 — `app/api/<nombre>/route.ts`

**Responsabilidad:** recibir el request HTTP, validar, delegar al service y responder.

**Auth — siempre primero:**
```ts
try {
  await assertAuthenticatedAdmin();
} catch {
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}
```

**Validación de params:**
- Usar los type guards exportados desde `app/lib/`.
- Fechas: validar con regex `/^\d{4}-\d{2}-\d{2}$/`.
- Números de página: `parseInt(..., 10)` + `isNaN` check.
  Nunca `Math.max(1, Number(...))` — `Math.max(1, NaN)` produce `NaN`, no `1`.
- Retornar 400 con mensaje descriptivo ante params inválidos.

**Lógica:**
- La route no contiene lógica de negocio. Solo valida, llama al service y devuelve.
- Nunca dejar endpoints de debugging (`/debug`, `/inspect`, etc.) en producción.

---

## Capa 4 — `app/components/<nombre>/`

**Responsabilidad:** renderizar los datos y gestionar la interacción del usuario.

**Directiva `"use client"`:**
- Solo en componentes que usen hooks o eventos del browser.
- Server Components por defecto cuando solo muestran datos.

**Fetches en Client Components:**
```ts
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then(...)
    .catch((e: unknown) => {
      if (e instanceof Error && e.name !== "AbortError") setError("...");
    });
  return () => controller.abort(); // evita race conditions al cambiar props
}, [deps]);
```

**Otros:**
- Los componentes no contienen lógica de negocio — solo presentan lo que reciben.
- Keys de React en listas: usar identificador estable, nunca solo el índice `i`.
- Constantes compartidas (como `PAGE_SIZE`) se importan desde el service, no se redefinen.
- Bloque de comentario al inicio de cada archivo (regla CLAUDE.md).

---

## Capa 5 — `app/<ruta>/page.tsx`

**Responsabilidad:** entry point de la ruta. Server Component.

```ts
export default async function MiPaginaPage() {
  await requireAuthenticatedAdminPage(); // redirige si no hay sesión de admin

  return (
    <PageShell>
      <PageHeader title="Título" subtitle="Descripción breve." />
      <MiVista />
    </PageShell>
  );
}
```

- Importar componentes pesados (Recharts, tablas grandes) con `next/dynamic` para
  no inflar el bundle inicial.
- Bloque de comentario al inicio del archivo (regla CLAUDE.md).

---

## Verificación final

1. `npx tsc --noEmit` → debe terminar con 0 errores.
2. Acceder a la ruta sin sesión de admin → debe redirigir (auth funcionando).
3. Acceder con sesión de admin → la pantalla muestra datos reales de Supabase.
4. Revisar Network tab: los endpoints responden con los status HTTP correctos.
