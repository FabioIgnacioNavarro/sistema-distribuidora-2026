# Glosario del Dominio — Sistema Distribuidora

| Término | Definición Técnica | NO confundir con |
|---------|-------------------|------------------|
| Lote | Compra específica de un producto con costo unitario propio. Código: {nro_factura}-{proveedor}-{fecha} | Stock total, inventario general |
| Renta / Renta Unitaria | Ganancia bruta por unidad = Precio Venta − Costo Promedio Ponderado | Ganancia neta, margen porcentual |
| YO / Ganancia Neta | Renta − Comisión del vendedor. Lo que realmente gana el dueño | Renta, utilidad bruta |
| Markup | Porcentaje sobre costo aplicado para definir precio. Ej: costo `$`100 + markup 30% = precio `$`130 | Margen sobre venta (es distinto numéricamente) |
| FIFO | First In, First Out. Estrategia fija: lote más antiguo (recibido_en ASC) se descuenta primero | LIFO, costo promedio, selección manual |
| Pedido | Solicitud de productos emitida por vendedor o admin. Tiene 4 estados posibles | Venta confirmada, factura de compra, entrega |
| Condición de Pago | Forma y plazo acordado para pagar un pedido: contado, transferencia, tarjeta o cuenta corriente | Estado de cobro |
| Estado de Cobro | Estado derivado del importe cobrado respecto del total: Sin cobrar, Cobrado parcialmente o Cobrado totalmente | Estado de entrega |
| Cobranza | Registro de un pago aplicado a un pedido, con importe, fecha, medio, usuario y observación | Condición de pago |
| Saldo Pendiente | Importe total del pedido menos la suma de cobranzas confirmadas | Ganancia neta, deuda histórica no asociada |
| Estado de Entrega | Estado logístico del pedido: Pendiente de preparar, Preparado, Entregado o Cancelado | Estado de cobro |
| Hoja de Ruta | Agrupación de pedidos preparados asignados a chofer + vehículo en fecha específica | Entrega individual, pedido único |
| Vendido por Dueño | Flag booleano en pedido. true = NO se calcula comisión, ganancia neta = renta completa | Venta normal de vendedor |
| Pendiente de Preparar | Estado inicial. Stock NO descontado aún. Puede cancelarse sin impacto en inventario | Preparado, En ruta |
| Preparado | Estado donde stock YA fue descontado de lotes FIFO. Puede asignarse a ruta | Pendiente, Entregado |
| Snapshot | Valor congelado al momento de un evento (precio venta, costo lote). No cambia después | Valor actual, valor en tiempo real |
| Persona | Única entidad de identidad. Abarca roles: admin, vendedor, chofer, logistica | Usuario (no existe como entidad separada) |
