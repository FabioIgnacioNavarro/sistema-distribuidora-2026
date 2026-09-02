# Instrucciones para Agentes de IA (Codex / Cualquier LLM)

## CONTEXTO DEL PROYECTO
Sistema de gestión para distribuidora de consumo masivo. Monorepo TypeScript con pnpm + Turborepo.
- Backend: Fastify + Supabase
- Admin Web: React + Vite + Tailwind
- App Móvil: React Native + Expo + WatermelonDB
- Base de datos: PostgreSQL (Supabase Free Tier)
- TODO EL CÓDIGO EN ESPAÑOL (variables, funciones, archivos, tablas BD)

## REGLAS NO NEGOCIABLES
1. Idioma: Español para todos los identificadores del dominio. Inglés solo para keywords del lenguaje y librerías externas.
2. Gestor: pnpm exclusivamente. Nunca npm ni yarn.
3. Tipos: Siempre definir en packages/tipos-compartidos/src/. Las apps importan desde ahí, nunca definen tipos propios duplicados.
4. Validación: Zod para todos los inputs. Schemas compartidos en tipos-compartidos.
5. Arquitectura backend: Rutas → Servicios (lógica pura) → Repositorios (Supabase). Servicios NUNCA importan @supabase/supabase-js directamente.
6. Reglas de negocio: LEER docs/reglas-negocio.md ANTES de escribir cualquier lógica de dominio. No asumir comportamientos.
7. Stock negativo: BLOQUEADO. Validar antes de confirmar pedido.
8. FIFO: Obligatorio para descuento de lotes. Sin configuración ni alternativas.
9. Comisión: Porcentaje configurable por el Administrador, con 10% como valor inicial; se aplica sobre el precio de venta solo si vendido_por_dueno = false.
10. Snapshot: Precio de venta se congela en items_pedido al crear la línea. Cambios posteriores no afectan pedidos existentes.

## ESTRUCTURA DEL MONOREPO
- packages/tipos-compartidos/src/ → Interfaces + schemas Zod compartidos
- packages/utilidades/src/ → Funciones puras (cálculos, formatos, validaciones)
- apps/api/src/rutas/ → Endpoints Fastify
- apps/api/src/servicios/ → Lógica de negocio pura
- apps/api/src/repositorios/ → Acceso a Supabase
- apps/admin/src/paginas/ → Pantallas web admin (una carpeta por módulo)
- apps/movil/src/pantallas/vendedor/ → Pantallas app vendedor
- apps/movil/src/pantallas/repartidor/ → Pantallas app repartidor
- apps/movil/src/base-datos-local/ → Schema WatermelonDB
- docs/ → Reglas de negocio, glosario, decisiones de arquitectura

## CONVENCIONES DE NOMENCLATURA
- Archivos/carpetas: kebab-case español → fifo-lotes.servicio.ts
- Funciones/variables: camelCase español → obtenerCostoPromedio()
- Tipos/interfaces: PascalCase español → interface PedidoConItems {}
- Tablas/columnas BD: snake_case español → items_pedido, costo_lote_unitario
- Constantes: UPPER_SNAKE_CASE español → PORCENTAJE_COMISION_VENDEDOR

## ANTES DE GENERAR CÓDIGO
1. Leer docs/reglas-negocio.md si la tarea involucra lógica de dominio
2. Verificar si el tipo/schema ya existe en packages/tipos-compartidos/src/
3. Confirmar en qué capa va el código (ruta vs servicio vs repositorio vs componente)
4. Si hay duda sobre regla de negocio, PREGUNTAR antes de asumir
5. Usar schemas Zod existentes antes de crear nuevos

## PROHIBIDO
- console.log en producción
- any en TypeScript (usar unknown + type guards)
- fetch/axios fuera de repositorios o servicios-sync
- Componentes UI en packages/
- Calcular rentabilidad en frontend (siempre viene del backend)
- Editar items/cantidades de pedido existente (solo cancelar + recrear)
