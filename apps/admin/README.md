# Admin web

Aplicación web de administración de Fontana Distribuciones. Está hecha con React y Vite y consume la API Fastify del monorepo.

## Desarrollo local

1. Configurá `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el `.env` raíz o en `apps/api/.env`. La clave `SERVICE_ROLE` solo se usa en la API; nunca se copia al admin.
2. En una terminal, desde la raíz, iniciá la API:

   ```bash
   pnpm --filter @distribuidora/api dev
   ```

3. En otra terminal, iniciá Vite:

   ```bash
   pnpm --filter @distribuidora/admin dev
   ```

En desarrollo Vite reenvía `/api` a `http://localhost:3000`. Para otro entorno, el admin admite `VITE_API_URL`.

## Compras

El registro de compras guarda la factura, sus renglones, los lotes y el incremento de stock mediante una única función transaccional de base de datos. La migración correspondiente está en [`20261028000300_registro-atomico-compras.sql`](../../supabase/migrations/20261028000300_registro-atomico-compras.sql). Luego de revisar y fusionar el PR, se aplica junto con las demás migraciones usando `pnpm exec supabase db push --linked`.

La API actual es para desarrollo local. Antes de publicarla hay que añadir autenticación y autorización por rol; hoy usa la clave de servicio para acceder a Supabase.

La maqueta visual de referencia está en [`prototipo-web`](../../prototipo-web/README.md).
