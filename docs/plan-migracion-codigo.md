# Plan de migración de código a partir de la planilla histórica

Este documento define los cambios necesarios para implementar el sistema profesional sin abandonar el modelo de lotes e inventario separado.

## Modelo recomendado para pedidos

La planilla y la vista del dueño necesitan una línea por producto, aunque un producto pueda consumirse desde varios lotes. El modelo recomendado es:

```text
pedidos
  └─ lineas_pedido                 una fila por producto solicitado
       └─ asignaciones_lote_pedido una fila por lote consumido
```

`lineas_pedido` debe contener `pedido_id`, `producto_id`, `cantidad`, `precio_venta_unitario`, `subtotal` y los valores comerciales congelados.

`asignaciones_lote_pedido` debe contener `linea_pedido_id`, `lote_id`, `cantidad`, `costo_lote_unitario`, `renta_por_unidad`, `comision_por_unidad`, `ganancia_neta_por_unidad` y sus subtotales.

La tabla actual `items_pedido` mezcla ambos conceptos porque contiene `lote_id`. Se recomienda crear `lineas_pedido` como tabla padre y mantener `items_pedido` como tabla de asignaciones de lote durante la migración. La interfaz agrupa las asignaciones por producto.

## Cambios de base de datos

Agregar mediante una migración:

```sql
ALTER TABLE clientes ADD COLUMN codigo_cliente text;
ALTER TABLE pedidos ADD COLUMN numero_pedido bigint;
ALTER TABLE pedidos ADD COLUMN porcentaje_comision_aplicado numeric;
ALTER TABLE pedidos ADD COLUMN condicion_pago text;
ALTER TABLE pedidos ADD COLUMN numero_remito text;
ALTER TABLE facturas_compra ADD COLUMN sucursal_proveedor text;
```

Después de revisar duplicados existentes, agregar restricciones `UNIQUE` para `clientes.codigo_cliente` y `pedidos.numero_pedido`.

No agregar `costo_unitario` a `productos`: el costo pertenece a `lotes`.

## Cambios en tipos compartidos

En `packages/tipos-compartidos/src/` crear o actualizar:

- `cliente.tipo.ts`: código visible y datos comerciales.
- `pedido.tipo.ts`: número de pedido, porcentaje aplicado, condición de pago y remito.
- `linea-pedido.tipo.ts`: línea única por producto.
- `asignacion-lote-pedido.tipo.ts`: detalle FIFO por lote.
- `importacion-historica.schema.ts`: schemas Zod para filas de clientes, inventario y ventas.
- `remito.tipo.ts`: datos de previsualización e impresión.

## Cambios en servicios del backend

Crear servicios en `apps/api/src/servicios/`:

1. `pedidos.servicio.ts`: crear una línea por producto y congelar precio/comisión.
2. `fifo-lotes.servicio.ts`: distribuir una línea entre lotes al preparar.
3. `remitos.servicio.ts`: agrupar datos del pedido y generar la previsualización.
4. `importacion-historica.servicio.ts`: validar e importar registros antiguos conservando sus importes.
5. `rentabilidad.servicio.ts`: calcular resúmenes mensuales desde pedidos entregados.

Los servicios no deben importar Supabase directamente; deben depender de repositorios.

## Cambios en repositorios y rutas

Crear repositorios para clientes, pedidos, líneas, asignaciones de lote, remitos e importaciones. Agregar rutas para previsualizar remitos, confirmar pedidos, obtener el detalle agrupado por producto y lote, importar históricos y obtener rentabilidad mensual.

## Cambios en el admin web

En `apps/admin/src/paginas/` implementar primero:

1. Historial de pedidos con una fila por producto y desplegable de lotes.
2. Detalle de pedido con importe total antes de ganancia total.
3. Selector de columnas del historial.
4. Vista de rentabilidad mensual con importe facturado, comisión y renta.
5. Previsualización e impresión del remito.

## Cambios en la app móvil

En `apps/movil/src/pantallas/vendedor/` guardar el pedido localmente, mostrar la previsualización antes de confirmar, sincronizarlo y mostrar el número de pedido y remito generado.

## Importación de la planilla

La importación debe tratar la comisión de la planilla como histórica. Si una fila histórica tiene 8%, se conserva 8%; no se transforma automáticamente a 10%. Los pedidos nuevos usan el porcentaje configurado vigente.

El inventario histórico no debe cargarse directamente como `stock_total` sin lotes. Debe convertirse en lotes iniciales o cargarse mediante una operación explícita de saldo inicial, manteniendo separados producto, stock y lote.
