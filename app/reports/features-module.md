# Features Module — Reporte de Implementación

## Objetivo

Construir un módulo de analytics que permita visualizar el uso de features del producto
(actualmente: **Dividir Gastos** y **Cuotas**) a lo largo del tiempo, con dos dimensiones
de análisis (usuarios únicos / cantidad de transacciones) y un breakdown paginado por día.

---

## Arquitectura general

```
app/
├── lib/
│   └── features.config.ts          ← Registro centralizado de features (tipos + config)
├── services/
│   └── features.service.ts         ← Acceso a datos (Supabase, queries en tiempo real)
├── api/
│   └── features/
│       ├── chart/route.ts          ← GET /api/features/chart
│       └── breakdown/route.ts      ← GET /api/features/breakdown
├── components/
│   └── features/
│       ├── FeatureChart.tsx        ← Gráfico interactivo (Client Component)
│       ├── FeatureBreakdown.tsx    ← Tabla paginada (Client Component)
│       └── FeaturesView.tsx        ← Coordinador de estado compartido (Client Component)
└── features/
    └── page.tsx                    ← Página principal (Server Component)
```

---

## Archivos creados — descripción y lógica esperada

---

### 1. `app/lib/features.config.ts`

**Rol:** Registro centralizado de features. Es el único lugar del código que define qué features
existen y cómo se llaman. Al agregar una nueva feature solo hay que agregar un objeto en
`FEATURE_REGISTRY`.

**Tipos clave:**
- `FeatureId`: union de IDs válidos (`"split_expenses" | "installments"`)
- `FeatureSource`: tabla de Supabase de origen (`"transaction_splits" | "installment_plans"`)
- `FeatureConfig`: objeto completo de configuración de una feature (id, label, color, source)
- `FeatureDimension`: `"users"` o `"count"`
- `ChartPoint`: `{ date: string; value: number }` — un punto del gráfico

**Funciones exportadas:**
- `getFeatureById(id)` — busca una feature por su ID
- `isValidFeatureId(id)` — type guard para validar que un string es un FeatureId
- `isValidDimension(dim)` — type guard para validar la dimensión

---

### 2. `app/services/features.service.ts`

**Rol:** Toda la lógica de acceso a datos. Hace queries a Supabase usando
`createAuthenticatedSupabaseClient()`. NO usa joins PostgREST (`!inner`) porque
dependen de nombres de FK que pueden no matchear. En cambio, usa un enfoque de
**dos pasos**: primero fetcha la tabla fuente, luego enriquece con queries `.in("id", [...])`.

**Tablas involucradas:**

| Feature | Tabla fuente | Tabla de enriquecimiento |
|---|---|---|
| Dividir Gastos | `transaction_splits` | `transactions`, `users`, `categories` |
| Cuotas | `installment_plans` | `users`, `transactions` (para categoría) |

**Lógica de `transaction_splits`:**
1. Filtrar por `transaction_id IS NOT NULL` y `deleted_at IS NULL`
2. Filtrar por `created_at >= startDate`
3. Batch-fetch de `transactions` via `.in("id", transactionIds)` → obtiene `user_id`, `created_at`, `description`, `category_id`
4. Batch-fetch de `users` via `.in("id", userIds)` → obtiene `email`
5. Batch-fetch de `categories` via `.in("id", categoryIds)` → obtiene `name`, `emoji`

**Lógica de `installment_plans`:**
1. Filtrar por `created_at >= startDate`
2. Batch-fetch de `users` via `.in("id", userIds)`
3. Para categorías: query a `transactions` donde `installment_plan_id IN (planIds)` → toma la primera categoría encontrada por plan

**Agregación (chart data):**
- `"users"`: COUNT(DISTINCT user_id) por día → `Map<day, Set<userId>>` → `.size`
- `"count"`: COUNT(*) por día → `Map<day, count>`

**Tipos exportados:**
- `BreakdownUserRow`: `{ email, txCount }`
- `BreakdownCountRow`: `{ email, description, categoryName, categoryEmoji }`
- `BreakdownResult`: union de ambos con `dimension` y `totalCount`

**Funciones exportadas:**
- `getFeatureChartData(featureId, dimension, days)` → `ChartPoint[]`
- `getFeatureBreakdown(featureId, dimension, date, page)` → `BreakdownResult`

---

### 3. `app/api/features/chart/route.ts`

**Rol:** Endpoint `GET /api/features/chart`. Valida parámetros y delega al service.
Usa `assertAuthenticatedAdmin()` (NO `requireAuthenticatedAdminPage` que hace redirect).

**Query params esperados:**
- `featureId`: string — validado con `isValidFeatureId()`
- `dimension`: `"users"` | `"count"` — validado con `isValidDimension()`
- `days`: `7` | `14` | `30`

**Respuesta exitosa:**
```json
{ "data": [{ "date": "2024-01-01", "value": 5 }, ...] }
```

---

### 4. `app/api/features/breakdown/route.ts`

**Rol:** Endpoint `GET /api/features/breakdown`. Valida parámetros y delega al service.

**Query params esperados:**
- `featureId`, `dimension` — igual que chart
- `date`: formato `YYYY-MM-DD`
- `page`: número entero base 1

**Respuesta exitosa (dimension "users"):**
```json
{
  "dimension": "users",
  "items": [{ "email": "...", "txCount": 3 }],
  "totalCount": 12
}
```

**Respuesta exitosa (dimension "count"):**
```json
{
  "dimension": "count",
  "items": [{ "email": "...", "description": "...", "categoryName": "...", "categoryEmoji": "..." }],
  "totalCount": 45
}
```

---

### 5. `app/components/features/FeatureChart.tsx`

**Rol:** Client Component que renderiza el gráfico principal con Recharts (ComposedChart).
Hace `fetch` a `/api/features/chart` cada vez que cambia `featureId`, `dimension` o `days`.

**Estado interno:**
- `featureId`: feature seleccionada actualmente
- `dimension`: dimensión activa
- `days`: rango temporal (7, 14 o 30)
- `rawData`: `ChartPoint[]` recibidos de la API
- `loading` / `error`: estados de la petición

**Props:**
- `selectedDay: string | null` — día seleccionado externamente (viene del coordinador)
- `onDayClick(day)` — notifica al coordinador el día clickeado en el gráfico
- `onFeatureChange(id)` — notifica al coordinador el cambio de feature
- `onDimensionChange(dim)` — notifica al coordinador el cambio de dimensión

**Cálculo del promedio:** se recalcula en el cliente sobre `rawData` con `Array.reduce`
y se agrega al chartData como campo `avg` para que Recharts dibuje la línea de promedio.

**Click en barra:** el `onClick` del `ComposedChart` extrae `activePayload[0].payload.date`
y lo pasa al padre via `onDayClick`.

---

### 6. `app/components/features/FeatureBreakdown.tsx`

**Rol:** Client Component que muestra la tabla de detalle para el día seleccionado.
Hace `fetch` a `/api/features/breakdown` cada vez que cambia `featureId`, `dimension`,
`selectedDay` o `page`.

**Props:**
- `featureId`: la feature activa (espejada desde el coordinador)
- `dimension`: la dimensión activa (espejada desde el coordinador)
- `selectedDay`: el día seleccionado en el gráfico (null = no muestra tabla)

**Columnas dinámicas según dimensión:**
- `"users"`: Email | Registros del día
- `"count"`: Email | Categoría | Concepto

**Paginación:** 25 registros por página, botones Anterior / Siguiente.

---

### 7. `app/components/features/FeaturesView.tsx`

**Rol:** Client Component coordinador. Mantiene el estado compartido entre Chart y Breakdown
para evitar prop-drilling excesivo. Es el único componente que importa tanto FeatureChart
como FeatureBreakdown.

**Estado que coordina:**
- `selectedDay`: qué día se clickeó en el gráfico → se pasa al Breakdown
- `activeFeatureId`: qué feature está activa en el Chart → se espeja al Breakdown
- `activeDimension`: qué dimensión está activa en el Chart → se espeja al Breakdown

---

### 8. `app/features/page.tsx`

**Rol:** Server Component principal. Autentica con `requireAuthenticatedAdminPage()` y
monta `FeaturesView` con `next/dynamic` para lazy loading (Recharts es pesado).

---

