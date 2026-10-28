# ADR-013: Condiciones de pago y cobranzas separadas del estado de entrega

## Estado

Aceptado

## Contexto

Un pedido puede emitirse con contado, transferencia, tarjeta o cuenta corriente con vencimiento. La entrega y el cobro no necesariamente ocurren al mismo tiempo, y una cuenta corriente puede pagarse en varias partes.

## Decisión

El pedido conservará una condición de pago y, cuando corresponda, una fecha de vencimiento. El estado logístico (`pendiente_preparar`, `preparado`, `entregado`, `cancelado`) será independiente del estado de cobro (`sin_cobrar`, `cobrado_parcialmente`, `cobrado_totalmente`).

Las cobranzas se modelarán como registros propios asociados al pedido. Cada registro conservará importe, fecha, medio de pago, persona registrante y observación. El saldo y el estado de cobro se derivarán de la suma de cobranzas confirmadas contra el total congelado del pedido.

La cobranza no modifica la ganancia del pedido. La ganancia se calcula por la diferencia entre precio de venta, costos de lotes y comisiones al registrar la operación; el importe cobrado y el saldo pendiente representan liquidez, no rentabilidad.

## Consecuencias

- El vendedor debe seleccionar la condición al crear el pedido y verla en el remito.
- El Administrador puede registrar cobranzas parciales y consultar su historial.
- La ganancia permanece visible y estable aunque el pedido esté sin cobrar o cobrado parcialmente.
- Ventas y rentabilidad puede mostrar cobrado contra pendiente en un gráfico de torta.
- Pedidos y Entrega de pedidos mostrarán ambos estados sin mezclarlos.
- Las condiciones desactivadas no afectan pedidos históricos.
- Toda cobranza queda auditada y no se elimina físicamente.
