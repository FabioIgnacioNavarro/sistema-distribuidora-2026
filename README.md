# Fontana Distribuciones — Sistema de Gestión 2026

Sistema integral de gestión comercial, logística y operativa para una distribuidora de productos de consumo masivo (almacenes, kioscos y comercios de proximidad).

El proyecto está diseñado bajo una arquitectura de **Monorepo TypeScript** unificado con soporte para panel de administración web, aplicación móvil offline-first para preventistas y repartidores, y una API backend conectada a Supabase.

---

## 🏛️ Arquitectura del Sistema

El repositorio utiliza **pnpm** como gestor de paquetes exclusivo y **Turborepo** para orquestar la compilación, ejecución y verificación de tipos de todas las aplicaciones y librerías compartidas.

### Estructura del Monorepo

```text
sistema-distribuidora-2026/
├── apps/
│   ├── admin/                 # Panel web administrativo (React + Vite + Tailwind CSS)
│   ├── api/                   # Backend REST (Fastify + Supabase Service Role + Zod)
│   └── movil/                 # App móvil vendedores y logística (React Native + Expo)
├── packages/
│   ├── tipos-compartidos/     # Interfaces TypeScript, esquemas Zod y tipos de Supabase
│   └── utilidades/            # Funciones puras de cálculo, validación y formato
├── docs/                      # Reglas de negocio, glosario y ADRs (decisiones de arquitectura)
├── supabase/
│   └── migrations/            # Migraciones SQL versionadas (DDL, funciones, triggers, RLS)
├── .env.example               # Plantilla de variables de entorno
├── pnpm-workspace.yaml        # Configuración de workspaces de pnpm
└── turbo.json                 # Pipelines y caché de Turborepo
```

### Arquitectura Backend (apps/api)

La API sigue una arquitectura de capas estricta y desacoplada:

1. **Rutas (`src/rutas/`):** Definen los endpoints Fastify, parsean y validan los parámetros de entrada con schemas Zod compartidos y devuelven respuestas HTTP estandarizadas.
2. **Servicios (`src/servicios/`):** Contienen la lógica de negocio pura del dominio (FIFO, cálculo de rentabilidad, importaciones, auditorías). **Nunca importan `@supabase/supabase-js` directamente.**
3. **Repositorios (`src/repositorios/`):** Encapsulan el acceso a la base de datos Supabase, ejecución de transacciones y funciones de base de datos.

### Panel Administrativo Web (apps/admin)

Estructurado en módulos y páginas independientes (`src/paginas/`):
- **Panel de inicio (`inicio/`):** Métricas operativas y accesos rápidos.
- **Lista de precios (`precios/`):** Visualización de markups deseados y reales, edición de precios y cálculo dinámico de renta.
- **Stock de productos (`stock/`):** Inventario consolidado con visualización desplegable de lotes asociados.
- **Lotes (`lotes/`):** Vista dedicada para control de compras, proveedores, vencimientos y remanentes con indicadores visuales de criticidad.
- **Registrar compra (`compras/`):** Ingreso de facturas de compra, creación ágil de nuevos productos en línea y cálculo de subtotales.
- **Historial de compras (`compras/`):** Auditoría y consulta de compras registradas.
- **Clientes (`clientes/`):** Gestión de cartera de clientes comerciales.

---

## 🔌 Servicios y Dependencias Externas

| Servicio / Dependencia | Uso en el Sistema |
|---|---|
| **PostgreSQL (Supabase)** | Base de datos relacional principal, funciones almacenadas PL/pgSQL, triggers y migraciones versionadas. |
| **Supabase Auth & RLS** | Autenticación y políticas de seguridad por fila (Row Level Security) para aislar datos sensibles. |
| **Fastify** | Servidor HTTP de alto rendimiento para el backend REST. |
| **Zod** | Validación exhaustiva de contratos de entrada y salida entre frontend y backend. |
| **React 18 & Vite** | SPA rápida para la administración interna de la empresa. |
| **Tailwind CSS v4** | Motor de estilos utilitarios para el panel web administrativo. |
| **React Native & Expo** | Aplicación móvil multiplataforma (Android e iOS). |
| **WatermelonDB** | Base de datos local SQLite para soporte offline-first en la app móvil. |
| **Turborepo** | Orquestación de compilaciones concurrentes y caché de tareas del monorepo. |

---

## 📋 Reglas de Negocio Clave

Todas las implementaciones deben respetar rigurosamente las reglas documentadas en [`docs/reglas-negocio.md`](./docs/reglas-negocio.md):

1. **Idioma y Dominio en Español:** Todos los identificadores (variables, funciones, tablas de base de datos, rutas y tipos) se redactan en español. El inglés se reserva únicamente para palabras clave del lenguaje o librerías externas.
2. **Control por Lotes y FIFO Obligatorio:** Cada compra a proveedor genera un lote discriminado por fecha, proveedor y costo unitario. Al confirmar la preparación de un pedido, el stock se descuenta automáticamente siguiendo **First-In, First-Out (el lote más antiguo primero)**.
3. **Stock Negativo Bloqueado:** No se permite confirmar pedidos ni registrar egresos si la cantidad disponible es menor a la requerida.
4. **Snapshot de Precios de Venta:** Al generar una línea de pedido, el precio de venta y las condiciones comerciales se congelan. Cambios posteriores en la lista de precios no modifican pedidos existentes.
5. **Comisiones y Rentabilidad:**
   - La comisión de venta (por defecto 10%) es configurable por el Administrador.
   - Si la venta la realiza el dueño (`vendido_por_dueno = true`), la ganancia neta es el 100% de la renta y no se liquida comisión.
6. **Cobranzas Desacopladas de Logística:** El ciclo logístico del pedido (`Pendiente` → `Preparado` → `Entregado` o `Cancelado`) es independiente de su estado de cobro (`sin_cobrar`, `cobrado_parcialmente`, `cobrado_totalmente`).
7. **Inmutabilidad de Líneas de Pedido:** No se editan cantidades ni productos de un pedido ya emitido; si requiere correcciones, se cancela con motivo obligatorio y se emite uno nuevo.

---

## ⚙️ Variables de Entorno

Creá un archivo `.env` en la raíz del proyecto tomando como referencia el archivo [`.env.example`](./.env.example):

```bash
cp .env.example .env
```

### Variables requeridas:

| Variable | Tipo | Descripción |
|---|---|---|
| `SUPABASE_URL` | Pública / Servidor | URL base de tu proyecto en Supabase (ej. `https://xyz.supabase.co`). |
| `SUPABASE_ANON_KEY` | Pública | Llave pública anónima de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreto del Servidor** | Llave de administración para la API (`apps/api`). **NUNCA exponer en frontends ni subir al repositorio.** |
| `HABILITAR_REINICIO_DE_FABRICA` | Booleano (`true`/`false`) | Habilita la ruta destructiva de reinicio de datos operativos para testing. Debe ser `false` en producción. |
| `VITE_API_URL` | Opcional (Front) | URL de la API para el panel admin. En desarrollo local, Vite usa proxy automático a `http://localhost:3000`. |

---

## 🚀 Guía de Instalación y Cómo Probarlo

### Prerrequisitos

- **Node.js**: Versión 18 o superior (`node -v`).
- **pnpm**: Versión 9 exclusivamente (`pnpm -v`). *No utilizar npm ni yarn.*
- **Supabase CLI** (opcional, para desarrollo de base de datos local): `pnpm dlx supabase` o instalado globalmente.

### 1. Instalación de dependencias

Instalá todas las dependencias del monorepo desde la raíz:

```bash
pnpm install
```

### 2. Configurar la Base de Datos

Las migraciones de PostgreSQL residen en `supabase/migrations/`. Para aplicarlas sobre tu proyecto de Supabase:

```bash
# Si utilizás Supabase local con Docker:
pnpm dlx supabase start
pnpm dlx supabase db reset

# O si vinculás un proyecto remoto:
pnpm dlx supabase link --project-ref tu-project-ref
pnpm dlx supabase db push
```

### 3. Ejecución en Desarrollo

Podés ejecutar todos los servicios en simultáneo mediante Turborepo:

```bash
pnpm dev
```

O podés ejecutar únicamente la aplicación que necesites probar:

#### Probar la API Backend:
```bash
pnpm --filter @distribuidora/api dev
```
La API iniciará en `http://localhost:3000`. Podés verificar su estado en:
- `GET http://localhost:3000/api/salud` (Endpoint de salud)
- `GET http://localhost:3000/api/productos`
- `GET http://localhost:3000/api/lotes`
- `GET http://localhost:3000/api/compras`

#### Probar el Panel Web Admin:
```bash
pnpm --filter @distribuidora/admin dev
```
El panel web iniciará en `http://localhost:5173`. Las peticiones hacia `/api/*` se reenviarán automáticamente al backend local.

#### Probar la App Móvil:
```bash
pnpm --filter @distribuidora/movil start
```
Abrirá el menú de Expo para ejecutar la app en emulador Android, simulador iOS o en la aplicación Expo Go en tu dispositivo físico.

### 4. Verificación de Tipos y Compilación

Antes de crear un commit o abrir una Pull Request, verificá que no existan errores de TypeScript ni fallas de compilación:

```bash
# Validar tipos estáticos en todos los paquetes
pnpm check-types

# Probar la compilación para producción
pnpm build
```

---

## 🌿 Flujo de Trabajo y Metodología Git

Para mantener la calidad y trazabilidad del código:

1. **Ramas por Objetivo:** Nunca trabajar directamente en `main`. Crear ramas siguiendo la nomenclatura `tipo/descripcion-corta` (ejemplos: `feature/modulo-cobranzas`, `fix/calculo-fifo`, `refactor/modularizar-vistas-admin`, `docs/completar-readme`).
2. **Commits Atómicos:** Realizar commits pequeños y con mensajes descriptivos siguiendo el estándar [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(...)`: Nueva funcionalidad.
   - `fix(...)`: Corrección de errores.
   - `refactor(...)`: Reestructuración sin cambio de comportamiento visible.
   - `docs(...)`: Actualización de documentación.
   - `test(...)`: Incorporación o ajuste de pruebas.
3. **Pull Requests:** Cada rama se envía a GitHub y se integra a `main` a través de un Pull Request con descripción de cambios y guía de pruebas.
4. **Seguridad y Secretos:** Prohibido subir credenciales de base de datos, tokens o claves de rol de servicio (`service_role`). Las modificaciones en esquemas de base de datos se versionan estrictamente en `supabase/migrations/`.
