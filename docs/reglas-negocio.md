# Reglas de Negocio — Sistema de Gestión Distribuidora V1

## Compras y Stock

**Compra de productos:** El dueño compra productos para sumar al stock a mayoristas. Éstas compras no sólo suman al stock de un producto específico sino que se discriminan por "lote". Una factura de un proveedor crea un "lote". Ej: "1503-Carrefour-15-08-2026".

**Lotes:** Los lotes contendrán: los datos del proveedor, fecha, monto total. Cada detalle de compra tendrá: nombre del producto, cantidad, precio unitario. El descuento de stock al vender sigue siempre FIFO (lote más antiguo primero). Esta lógica es automática.

**Control de stock:** Cada tipo de producto tiene una cantidad en stock, nombre, código de producto (SKU), y categoría. La vista **Stock de productos** muestra una fila por producto con el stock consolidado y un desplegable con los lotes que lo componen. La vista **Lotes** es un listado independiente con una fila por lote y sus datos de compra (factura, proveedor, costo, cantidades y vencimiento). La lista de precios muestra un único total por producto.

**Validación de stock:** Al intentar confirmar un pedido, si el stock disponible es insuficiente, la app muestra error bloqueante y no permite confirmar. No se permite stock negativo en V1.

**Ajustes de inventario:** El Administrador puede realizar ajustes de stock manuales (merma, daño, corrección de inventario) con motivo obligatorio. Los ajustes negativos afectan al lote más antiguo disponible (FIFO).

**Reinicio de fábrica para pruebas:** En desarrollo, el Administrador puede borrar compras/facturas, lotes, pedidos y sus líneas, cobranzas, rutas y entregas, ajustes de inventario y auditoría. El stock almacenado de los productos vuelve a cero. Se conservan productos, categorías, clientes, usuarios y configuración. La función solo se habilita con `HABILITAR_REINICIO_DE_FABRICA=true` fuera de producción; la API exige confirmación explícita. No es una operación disponible en producción.

**Descuento de stock:** El stock se descuenta de los lotes (FIFO) en el momento que el pedido pasa a estado "Preparado", no al crearse. Esto evita bloquear stock innecesariamente si el pedido se cancela antes de prepararse.

## Ventas y Rentabilidad

**Cálculo de rentabilidad:** El cálculo se realiza en base al Excel proveído por el dueño. Fórmulas: Renta = Precio Venta − Costo Promedio Ponderado; Comisión = Porcentaje de comisión vigente × Precio Venta (solo ventas de vendedores); YO (Ganancia Neta) = Renta − Comisión. El porcentaje de comisión es configurable por el Administrador y comienza en 10%.

**Lista de precios:** Constará de una lista de productos disponibles en stock con: nombre del producto, categoría, cant. en stock, precio de venta, markup, renta unitaria, comisión (10% por defecto), ganancia neta (renta-comisión). El precio de venta, el markup y el porcentaje de comisión son editables manualmente por el Administrador.

**Precios al momento de venta vs precios actuales:** El precio de venta se congela (snapshot) al momento de crear cada línea de pedido. Cambios posteriores en la lista de precios NO afectan pedidos ya existentes, ni siquiera si están en estado "Pendiente de preparar".

**Ventas realizadas por el dueño:** Cuando el Administrador registra una venta manualmente (no desde app de vendedor), el campo "vendido_por_dueno" se marca como verdadero y NO se calcula comisión. La ganancia neta es igual a la renta completa.

**Resumen de rentabilidad:** La aplicación del administrador tendrá una sección dentro del módulo Ventas que englobe datos globales: cuánto ganó con sus operaciones en los últimos días, semanas y meses. Incluye ventas totales, ganancia neta total, comisiones pagadas, productos más/menos rentables.

**Comisiones:** Los vendedores ganan el porcentaje de comisión vigente de las ventas realizadas por ellos mismos. El valor inicial es 10% y puede ser modificado por el Administrador. La comisión se calcula sobre el precio de venta congelado al momento del pedido.

**Historial de comisiones:** Las ventas históricas importadas pueden conservar un porcentaje distinto al vigente actualmente. El porcentaje aplicado a cada venta debe quedar congelado en el pedido o en sus líneas de venta y no recalcularse cuando el Administrador modifique la configuración.

## Pedidos y Estados

**Vendedores:** Los vendedores podrán emitir pedidos desde su app móvil hacia el backend del sistema, donde aparecerá en el visualizador de pedidos del área de logística. El pedido emitido contendrá: datos del cliente (nombre/razón social, teléfono, dirección), datos del vendedor (nombre, código de usuario), y los detalles del pedido (producto, cantidad, precio de venta).

**Condición y plazo de pago:** Al emitir un pedido, el vendedor debe seleccionar una condición de pago. Las opciones iniciales son: cuenta corriente a 7 días, cuenta corriente a 14 días, cuenta corriente a 30 días, transferencia, contado y tarjeta. La condición seleccionada se guarda en el pedido y aparece en la previsualización e impresión del remito. Las condiciones deben ser configurables por el Administrador, sin modificar retrospectivamente los pedidos ya emitidos.

**Fecha de vencimiento:** Para condiciones a cuenta corriente, el sistema calcula y conserva la fecha de vencimiento a partir de la fecha de emisión del pedido. Para contado, transferencia y tarjeta, el pedido no requiere una fecha de vencimiento futura, pero sí conserva la condición elegida y el estado de cobro.

**Estado de cobro:** El cobro se gestiona de forma independiente al estado logístico. Un pedido puede estar `sin_cobrar`, `cobrado_parcialmente` o `cobrado_totalmente`. El estado se deriva del total del pedido y de la suma de cobranzas confirmadas; nunca se modifica manualmente sin registrar el movimiento correspondiente. Una cobranza no puede superar el saldo pendiente.

**Ganancia independiente de la cobranza:** La ganancia del pedido se calcula al registrar la operación comercial: importe total menos costos de los lotes utilizados y comisiones aplicables. La ganancia no se reduce ni queda condicionada por el estado de cobro. `ImporteTotalPedido`, `GananciaTotalPedido`, `ImporteCobrado` y `SaldoPendiente` son datos distintos: el saldo pendiente indica dinero aún no ingresado, no una pérdida ni una disminución de la rentabilidad calculada.

**Historial de cobranzas:** Un pedido puede tener varias cobranzas. Cada cobranza conserva importe, fecha, medio de pago, observación y persona que la registró. El Administrador puede consultar un mini historial de cobranzas dentro del detalle del pedido y registrar pagos parciales o cancelar una cobranza según las reglas de auditoría. Las cobranzas confirmadas quedan auditadas y no se eliminan físicamente.

**Clientes en la base de datos:** Al crear un pedido, el vendedor puede seleccionar un cliente existente o registrar uno nuevo en el momento. Los clientes nuevos se guardan automáticamente en la base de datos para futuras ventas.

**Identificadores comerciales:** Clientes y pedidos tienen un identificador técnico interno y un código visible para el negocio. El código visible del cliente se conserva durante toda su vida útil. El número visible del pedido se utiliza en remitos, historial y comunicación con el cliente.

**Líneas de pedido y lotes:** Cada pedido contiene una sola línea comercial por producto y cantidad solicitada. Al preparar el pedido, esa línea puede distribuirse entre uno o más lotes mediante asignaciones FIFO. La vista del Administrador muestra el producto como una fila desplegable y sus lotes como filas hijas; no se duplican líneas comerciales por cada lote.

**Estado de los pedidos:** Los pedidos tienen 4 estados: Pendiente de preparar, Preparado, Entregado, Cancelado. Transiciones válidas: Pendiente → Preparado, Pendiente → Cancelado, Preparado → Entregado, Preparado → Cancelado (con observación obligatoria). No se permiten retrocesos de estado.

**Edición/cancelación de pedidos:** Admin y Logística pueden cambiar el estado de cualquier pedido. Pueden cancelar pedidos en estado "Pendiente de preparar" o "Preparado" con observación obligatoria. NO se pueden modificar productos/cantidades de un pedido existente; si hay error, se cancela el pedido y se crea uno nuevo corregido.

## Entrega y Logística

**Entrega:** Los pedidos son entregados en una "ruta de reparto". Esta constará de chofer, vehículo, y lista de los pedidos que están por ser entregados en esa ruta. Solo pedidos en estado "Preparado" pueden asignarse a una ruta.

**Datos de vehículos:** Cada vehículo tiene: placa/patente (identificador único), marca/modelo (opcional), estado (activo/inactivo). No se gestiona mantenimiento ni kilometraje en V1.

## Usuarios y Permisos

**Usuarios:** El sistema tendrá 4 tipos de usuarios:

- **Administrador (dueño):** Acceso total a todos los módulos.
- **Vendedor:** Solo app móvil. Puede crear pedidos, ver su historial personal, actualizar catálogo/precios. No ve rentabilidad ni comisiones de otros vendedores.
- **Repartidor:** Solo app móvil. Ve rutas asignadas, confirma entregas. No ve precios, stock ni rentabilidad.
- **Logística:** Acceso web limitado a módulos Stock y Logística. Puede ver stock, ver lotes, cambiar estado de pedidos (Pendiente → Preparado → Entregado), crear/gestionar rutas de reparto. NO puede: modificar precios, ver rentabilidad/comisiones, gestionar productos/clientes/vendedores, cargar facturas de compra.

## Sincronización y Técnico

**Sincronización offline de app de vendedor:** La app móvil funciona sin conexión a internet. Los pedidos se guardan localmente y se sincronizan automáticamente cuando hay conexión. El catálogo de productos y precios se descarga al iniciar sesión y puede actualizarse manualmente con botón "Actualizar precios". Si hay conflicto de stock al sincronizar (producto vendido offline pero sin stock real al validar), el pedido pasa a estado "Revisión requerida" y notifica al Administrador.

**Filtros:** Las tablas de visualización de stock, lotes, ventas y compras, entre otras, tendrán filtros que facilitarán la búsqueda de datos.

**Historial y auditoría:** Todo cambio de estado de pedido, ajuste de stock, modificación de precio y carga/anulación de factura queda registrado con: usuario, fecha/hora, valor anterior y valor nuevo. Este historial es de solo lectura para Administrador.

**Remito:** Al guardar un pedido, el vendedor debe poder revisar una previsualización del remito antes de confirmarlo. El remito se genera agrupando las líneas del pedido por número de pedido y conserva el formato comercial definido para Fontana Distribuciones. La impresión/exportación utiliza los datos congelados del pedido y no los precios actuales.

## Estructura de Módulos (Admin Web)

- **Ventas**
  - Registrar ventas (nota de pedido) → genera Pedido con Estado "Pendiente de preparar"
  - Pedidos
  - Resumen de rentabilidad
- **Compras**
  - Registrar compras (factura → Lote)
  - Historial de compras
- **Lista de precios**
- **Stock**
  - Ver stock (productos)
  - Ver lotes (compras)
- **Vendedores**
  - Ver lista de vendedores
  - Cargar nuevo vendedor
  - Modificar datos de vendedor
- **Clientes**
  - Ver lista de clientes
  - Cargar nuevo cliente
  - Modificar datos de cliente
- **Logística**
  - Entrega de pedidos (Pendiente de preparar, Preparado, Entregado, Cancelado)
  - Cargar ruta de reparto
  - Lista de rutas de reparto actuales
  - Lista de vehículos
  - Lista de chóferes
  - Historial de rutas de reparto

## Decisiones Confirmadas (Resumen)

1. Stock negativo: **Bloqueado** en V1
2. Descuento de stock: **Al pasar a "Preparado"**, no al crear pedido
3. Edición de pedidos: **Solo cambio de estado + cancelación con observación**. No se editan items/cantidades; se cancela y recrea
4. Rol Logística: **Puede cambiar estados** de pedidos y gestionar rutas
5. Visibilidad de lotes: **NO en Lista de Precios**. SÍ en Stock → Lotes (detalle por lote con remanente). Resumen de rentabilidad vive en Ventas
6. La comisión vigente es configurable, comienza en 10% y cada pedido conserva el porcentaje realmente aplicado
7. La vista comercial agrupa un producto por pedido; las asignaciones FIFO a lotes se muestran como detalle hijo
8. El remito se previsualiza antes de confirmar y se puede imprimir con el formato comercial acordado
9. La condición de pago, el vencimiento y el estado de cobro se gestionan separados del estado logístico del pedido
10. Un pedido puede tener múltiples cobranzas y conserva el historial completo de esos movimientos

---

_Documento versión 1.0 — Última actualización: Agosto 2026_
_Los datos obligatorios por entidad se definirán en el Modelo Relacional (MR)._
