# Guías y Reglas para Agentes de IA (AI Guidelines)

Este archivo contiene el contexto del proyecto y las reglas estrictas que cualquier agente de Inteligencia Artificial debe seguir antes de proponer, ejecutar o modificar código en este proyecto.

## 1. Resumen del Proyecto
Este proyecto es un **CRM (Customer Relationship Management)** desarrollado para una aplicación financiera/Fintech. Su propósito principal es:
- **Gestionar usuarios**: Visualizar y administrar perfiles de usuarios de la aplicación.
- **Monitorear actividad**: Analizar transacciones (diarias, semanales y mensuales) y uso de integraciones como Mercado Pago (MP).
- **Seguimiento comercial (Contactos)**: Registrar, actualizar y seguir el estado de la comunicación con cada usuario (estados: `contacted`, `talking`, `finalizando`) con objetivos claros de negocio (ej. `activation`, `increase_trans`, `MP`).

## 2. Stack Tecnológico Principal
- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript (`strict` mode obligatorio)
- **Estilos**: Tailwind CSS v4 + UI Components con DaisyUI
- **Base de Datos / ORM**: PostgreSQL administrado a través de **Prisma ORM** (`@prisma/client`) y co-existencia con el cliente de **Supabase** (`@supabase/supabase-js`).

## 3. Estructura de Carpetas Clave (Modular y Ordenada)

La arquitectura sigue los patrones de Next.js App Router. Priorizá siempre una estructura modular y ordenada, evitando mezclar responsabilidades:

- `/app`: directorio principal de ruteo.

  - `/app/actions/`: **Server Actions**. Funciones asíncronas para mutaciones de datos invocadas desde la UI o componentes del servidor.
  - `/app/components/`: **Componentes UI reutilizables**. Componentes de React enfocados en presentación e interacción.
  - `/app/lib/`: **Infraestructura compartida**. Inicialización de clientes, configuración y utilidades base del proyecto.
  - `/app/utils/`: **Helpers puros**. Funciones auxiliares reutilizables sin dependencia de React ni de la UI.
  - `/app/hooks/`: **Custom hooks reutilizables**. Lógica compartida del lado cliente, solo cuando sea necesaria interactividad.
  - `/app/services/`: **Capa de servicios**. Acceso a datos, lógica de negocio reutilizable, integraciones externas y consultas complejas.
  - `/app/api/`: **Route Handlers / Endpoints HTTP**. Solo cuando sea necesario exponer rutas API.
  - `/app/styles/`: **Estilos globales**. Configuración y estilos compartidos, evitando mezclar estilos con lógica.

---

## 4. REGLAS ESTRICTAS PARA AGENTES DE IA AL CODIFICAR

Cada vez que un Agente de IA interactúe con este repositorio, **DEBE CUMPLIR** las siguientes reglas y buenas prácticas:

1. **Tipado Estricto Obligatorio (TypeScript)**:
   - Usa **siempre** TypeScript para aprovechar el tipado estricto, detectar errores temprano y escribir código más seguro, mantenible y escalable.
   - NO utilizar `any`. Si no conoces el tipo, debes definir la interface basándote en el `schema.prisma`.
   - Aprovechar los tipos autogenerados de Prisma importándolos de `@prisma/client`.

2. **Entender el App Router de Next.js**:
   - Respetar la convención de `Server Components` por defecto en `/app`.
   - Utilizar directivas `"use client"` **únicamente** cuando se necesite interactividad en el navegador (hooks, eventos).

3. **Arquitectura Limpia en API Routes y Capa de Datos**:
   - **Rutas Livianas**: Cuando trabajes con API routes (o en su defecto Server Actions), mantenelas livianas. La lógica de negocio compleja **debe vivir en módulos separados o en los archivos de `/services`**, nunca encapsulada directamente dentro de la ruta o el action.
   - **Manejo Claro de Errores**: Implementa siempre un manejo claro de errores en la capa externa (controladores/rutas). Devuelve los status codes correctos HTTP (200, 400, 404, 500) junto con mensajes de error útiles o tipados legibles desde el lado del cliente.
   - **Middleware y Reutilización**: Reutilizá middleware (ej. Next.js Middleware) para manejar validaciones complejas, autenticación u otras preocupaciones comunes transversales a la aplicación.

4. **Optimización de Performance (Frontend y Backend)**:
   - **Lazy Loading y Code Splitting**: Optimiza la performance aplicando code splitting y carga diferida (lazy loading). Utiliza *Dynamic Imports* de Next.js (`next/dynamic`) especialmente en **componentes pesados de UI** (gráficos, modales grandes) o que no sean críticos para el "First Meaningful Paint".
   - Esto reduce drásticamente el tamaño del bundle inicial y mejora sustancialmente la experiencia del usuario (UX).

5. **Manejo de Base de Datos y Comandos**:
   - Si se requiere modificar campos de la BD: 
     1. Modificar `prisma/schema.prisma`.
     2. Ejecutar (o dar instrucciones al usuario para ejecutar): `npx prisma format` y luego `npx prisma db push` o `npx prisma migrate dev`.
     3. Ejecutar: `npx prisma generate` para actualizar los tipos.

6. **Contexto Antes de Editar**:
   - Antes de modificar código, **siempre lee** los componentes o servicios implicados. No asumas que la funcionalidad existe sin verificar primero explorando los archivos.

*Nota para el Agente: Estas prácticas (Next.js App Router, TS estricto, rutas ligeras y optimización de bundle) son requerimientos mandatorios del proyecto.*
