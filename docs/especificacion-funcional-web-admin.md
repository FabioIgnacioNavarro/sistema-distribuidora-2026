# 📋 Especificación Funcional — Sistema de Gestión Distribuidora
**Versión:** Cuasi-Final | **Fecha:** Agosto 2026 | **Autor:** Fabio + Equipo

---

## 1. PANTALLA DE BIENVENIDA / DASHBOARD

### Mensaje Personalizado
> Bienvenido de nuevo, Fabio.
> - Tenés **x** nuevos pedidos por revisar.

---

## 2. MÓDULO: VENTAS (2 subpantallas)

### 2.1 Resúmenes Financieros
Pantalla donde se ven los costes de funcionamiento sumados a las ganancias netas.

#### Tarjetas KPI
| Métrica | Período |
| :--- | :--- |
| Ganancias netas esta semana | Ventas esta semana |
| Ganancias netas este mes | Ventas este mes |
| Ganancias netas este año | Ventas este año |

#### Gráficos
- **Gráfico de torta de gastos:** Por categoría, filtrable por semana, mes y año.
- **Gráfico de torta de relevancia de vendedores:** Sobre pedidos/ganancias de la distribuidora, filtrable por mes y año.
- **Gráfico de montaña (rentabilidad):** Muestra ganancias brutas (`PrecioVenta − Costo`) y netas (`− comisiones`), filtrable por semana, mes y año.
- **Gráfico de montaña (volumen):** Muestra cantidad de ventas, filtrable por semana, mes y año.

### 2.2 Historial de Pedidos
Tabla con totalidad de pedidos entregados, sus detalles y ganancia final.

#### Filtros
- Desde x fecha / Hasta x fecha
- Por Vendedor
- Por Cliente
- Por Repartidor
- Ordenar por antigüedad (ascendente y descendente)

#### Tabla Principal
| Columna |
| :--- |
| IdPedido \| IdRutaReparto \| FechaYHora (pedido) \| FechaYHora (entrega) \| Cliente \| DirecciónEntrega \| Vendedor \| Repartidor \| GananciaTotal \| Botón de detalle |

#### Detalle del Pedido/Remito

**Cabecera:**
IdPedido, IdRutaReparto, FechaYHora (pedido), FechaYHora (entrega), Cliente, DirecciónEntrega, Vendedor, Repartidor

**Items del pedido** (cada entrada es un producto; dentro de cada producto se muestran los lotes involucrados en la venta):

```text
NombreProducto | Categoría
    └─ IdLote_1 | CostoUnitario | Cantidad | Markup | Renta | PrecioVenta | ComisiónVendedor (10% o 0%) | GananciaNetaPorUnidad_1 | GananciaNetaTotal_1
    └─ IdLote_2 | CostoUnitario | Cantidad | Markup | Renta | PrecioVenta | ComisiónVendedor (10% o 0%) | GananciaNetaPorUnidad_2 | GananciaNetaTotal_2

GananciaTotalPedido
```

---

## 3. MÓDULO: COMPRAS (2 subpantallas)

### 3.1 Registrar Nueva Compra
Pantalla tipo CRUD para cargar datos de factura.

#### Cabecera de Factura
Fecha | Proveedor | SucursalProveedor

#### Items de Factura (uno por producto)
| Producto | Categoría | Cantidad | CostoUnitario | Subtotal (se calcula solo) |
| :--- | :--- | :--- | :--- | :--- |
| Producto1 | ... | ... | ... | ... |
| Producto2 | ... | ... | ... | ... |
| **Total** | | | | **(se calcula solo)** |

#### Comportamiento al Confirmar Compra
Al presionar "Confirmar compra":
1. Se crea un lote en stock con los productos de la factura.
2. Aumenta el stock de los productos cargados en la base de datos.
3. Si los productos nunca se cargaron antes, no tendrán precio de venta definido en la lista de precios.
4. Al registro de compra se le asigna un IdFactura.

### 3.2 Historial de Compras
Tabla con todos los remitos de compra cargados y sus respectivos lotes creados.

#### Tabla Principal
| Columna |
| :--- |
| IdFactura \| FechaCarga \| NombreLoteCreado \| Proveedor \| SucursalProveedor \| CostoTotal \| Botón de detalle de factura |

#### Detalle de Factura

**Cabecera:**
IdFactura | FechaCarga | NombreLoteCreado | Proveedor | SucursalProveedor

**Items:**
| Producto | Categoría | Cantidad | CostoUnitario | Subtotal |
| :--- | :--- | :--- | :--- | :--- |
| Producto1 | ... | ... | ... | ... |
| Producto2 | ... | ... | ... | ... |
| **Total** | | | | |

---

## 4. MÓDULO: LISTA DE PRECIOS

Una sola tabla donde se ven todos los productos en stock y se definen markup y precio de venta.

### Filtros
- Por Categoría
- Ordenar por Markup (asc y desc)
- Buscar por coincidencia de nombre
- Ordenar por Cantidad en Stock (asc y desc)

### Subtabla de Comisión de Vendedores
| Campo | Valor |
| :--- | :--- |
| PorcentajeComisión (%) | 10% inicial, editable por el Administrador |

### Datos de la Tabla
| Columna | Editable | Notas |
| :--- | :--- | :--- |
| IdProducto | No | |
| Producto | No | |
| Categoría | ✅ Sí | Modificable inline |
| CantidadStock | No | Viene de la base de datos |
| PrecioVenta | ✅ Sí | Modificable inline |
| MarkupDeseado* | ✅ Sí | Recordatorio, modificable inline |
| RangoDeMarkup** | No | Calculado en tiempo real |
| ComisiónVendedor*** | No | Calculado en tiempo real |
| Renta**** | No | Calculado en tiempo real |

#### Definiciones
- ***MarkupDeseado:** Utilizado como recordatorio.
- ****RangoDeMarkup:** Rango actual de markup basado en los lotes activos. Ejemplo: si PrecioVenta = $10 y los costos de lote 1 y lote 2 son $5 y $6 respectivamente, el RangoDeMarkup sería entre 67%-100% dependiendo del lote que se venda. La rentabilidad final de un pedido se ve en Ventas → Historial de Pedidos, donde se identifica qué lote se usó (generalmente el más viejo primero, FIFO).
- *****ComisiónVendedor:** Monto por producto que queda al vendedor. Se calcula como `PorcentajeComisión × PrecioVenta`; el porcentaje es configurable y comienza en 10%.
- ******Renta:** Ganancia por producto después de comisión y costo de compra: `PrecioVenta − CostoLote − ComisiónVendedor`. En caso de ser el dueño, simplemente mira cuánto ganaría observando el precio de venta. Funciona igual que RangoDeMarkup: contempla el costo de los lotes y muestra entre qué rango de rentabilidad operaría.

---

## 5. MÓDULO: STOCK (2 subpantallas)

### 5.1 Ver Stock de Productos
Tabla con productos en stock y los lotes que componen ese stock.

#### Filtros
- Por Categoría
- Ordenar por PrecioVenta (asc y desc)
- Ordenar por Cantidad en Stock (asc y desc)
- Buscar por coincidencia de nombre

#### Tabla con Filas Anidadas
```text
IdProducto | Producto | Categoría | CantidadStock | PrecioVenta
    └─ IdLoteProducto_1 | CantidadStock | FechaCompra
    └─ IdLoteProducto_2 | CantidadStock | FechaCompra
```

### 5.2 Ver Lotes
Tabla con todos los lotes creados por compras. Se pueden ver tanto activos como agotados mediante filtros.

#### Filtros
- Por Proveedor
- Ordenar por Fecha de carga (asc y desc)
- Mostrar desde x fecha a x fecha
- Mostrar Lotes vacíos

#### Tabla con Filas Anidadas
```text
IdLote | NombreLote | IdFacturaCompra | Proveedor | FechaCreacion | Estado (Activo/Agotado)
    └─ IdProducto_1 | Producto | Categoría | CantidadRestante/CantidadInicial | CostoUnitario | Subtotal
    └─ IdProducto_2 | Producto | Categoría | CantidadRestante/CantidadInicial | CostoUnitario | Subtotal
    └─ CostoTotal
```

---

## 6. MÓDULO: GASTOS (2 subpantallas)

### 6.1 Registrar Gastos
Formulario de carga para gastos de distintos tipos discriminados por categorías. Estos datos alimentan el resumen de gastos y la futura pantalla de rentabilidad general.

#### Campos del Formulario
- Concepto del gasto
- Categoría
- Observaciones (opcional)
- Fecha
- Monto

### 6.2 Ver Resumen de Gastos
Dos bloques principales: gráfico de torta arriba, tabla historial abajo.

#### Gráfico de Torta
- Basado en categorías y montos
- Discriminable por mes y por año

#### Tabla Historial

**Filtros:**
- Por Categoría
- Ordenar por antigüedad (asc y desc)
- Selector temporal: `[Este mes ▼] [Este año ▼] [Personalizado ▼]` → Desde: ____ Hasta: ____

**Columnas:**
| Fecha | Concepto | Categoría | Monto | Observaciones (ver detalles vía tooltip) |
| :--- | :--- | :--- | :--- | :--- |

---

## 7. MÓDULO: VENDEDORES (3 subpantallas)

### 7.1 Ver Lista de Vendedores
Tabla con todos los vendedores activos. Opción para mostrar inactivos.

#### Filtros
- Mostrar inactivos (toggle)

#### Tabla Principal
| Columna |
| :--- |
| CodVendedor \| NombreApellido \| FechaIngreso \| FechaEgreso \| TotalVentasRealizadas \| Estado (activo/inactivo) \| + Ver más detalles |

#### Detalle del Vendedor
**Datos fijos:**
CodVendedor, Nombre y Apellido, DNI, Número, Fecha de ingreso, Fecha de egreso (si hubiera)

**Bloques de ganancias** (suma de comisiones generadas en pedidos en los períodos mencionados):
- Ganancias [Este mes ▼]
- Ganancias [Este año ▼]
- Ganancias históricas

**Subtabla de ventas del vendedor:**
- Filtros: Por Cliente, Desde x fecha a x fecha
- Columnas: IdPedido | Cliente | Fecha | ComisiónTotalGanada

### 7.2 Cargar Nuevo Vendedor
Formulario de alta:
- Nombre y apellido
- DNI
- Teléfono

> Al finalizar el registro se le asigna un código único de vendedor.

### 7.3 Modificar Datos de Vendedor
Mismo formulario de carga, habilitado para edición en caso de error. El código de vendedor también es modificable.

---

## 8. MÓDULO: CLIENTES (3 subpantallas)

### 8.1 Ver Lista de Clientes
Tabla con todos los clientes de la distribuidora.

#### Filtros
- Ordenar por Cantidad de pedidos (asc y desc)
- Por Antigüedad (asc y desc)
- Buscar por nombre/razón social

#### Tabla Principal
| Columna |
| :--- |
| CodCliente \| Nombre/RazónSocial \| Dirección \| Teléfono \| CantPedidos \| + Ver más detalles |

#### Detalle del Cliente
**Datos fijos:**
CodCliente | Nombre/RazónSocial | Dirección | Teléfono

**Subtabla de pedidos:**
| IdPedido | Fecha | Dirección | Vendedor | MontoPagadoPorCliente |
| :--- | :--- | :--- | :--- | :--- |

### 8.2 Cargar Nuevo Cliente
Formulario de alta:
- Nombre/Razón Social
- Dirección
- Teléfono

### 8.3 Modificar Datos de Cliente
Mismo formulario de carga, reutilizado para edición.

---

## 9. MÓDULO: LOGÍSTICA (5 subpantallas)

### 9.1 Lista de Pedidos
Tabla con todos los pedidos pendientes de preparar y entregar. Los entregados son accesibles por filtro.

#### Filtros
- Por Cliente
- Por Vendedor
- Por Estado: Pendiente a preparar / Pendiente a entregar / Entregado / Cancelado

#### Tabla Principal
| Columna |
| :--- |
| IdPedido \| Cliente \| Dirección \| FechaEmisión \| Vendedor \| Estado \| + Ver más detalles |

#### Detalle de Pedido
- Botón de imprimir remito
- **Cabecera:** IdPedido | Cliente | Dirección | FechaEmisión | Vendedor | Estado
- **Items:**

| Producto | Cantidad | PrecioVentaUnitario | Subtotal |
| :--- | :--- | :--- | :--- |
| Producto1 | ... | ... | ... |
| Producto2 | ... | ... | ... |
| **TotalPedido** | | | |

### 9.2 Cargar Ruta de Reparto
Formulario de asignación de pedidos a rutas.

#### Estructura del Formulario
```text
+ Asignar conductor ▼    + Asignar vehículo ▼

+ Sumar pedido listo para entregar ▼

(Visualización de pedidos en la lista:)
Orden | FechaEmisión | Vendedor | Nombre/RazónSocialCliente | Dirección | Teléfono | Importe total de pedido

TotalImportePedidos: $_____

[ Cargar nueva ruta ]
```

### 9.3 Ver Rutas de Reparto Actuales
Rutas que aún no finalizaron.

#### Tabla con Filas Anidadas
```text
IdRutaReparto | Conductor | Vehículo | CantPedidos | Fecha
    └─ IdPedido_1 | Cliente | Dirección | FechaEmisión | Vendedor | Estado (entregado/pendiente)
    └─ IdPedido_2 | Cliente | Dirección | FechaEmisión | Vendedor | Estado (entregado/pendiente)
```

### 9.4 Lista de Vehículos
- Botón: **+ Añadir vehículo nuevo**

| PatenteVehículo | Nombre | Tipo (Auto/Camioneta/Camión) | Estado (En reparto/Estacionado/Inactivo) | Modificar datos |
| :--- | :--- | :--- | :--- | :--- |

### 9.5 Lista de Choferes
- Botón: **+ Añadir chofer nuevo**

| CodChofer | NombreApellido | DNI | Teléfono | Estado (En reparto/Disponible/Inactivo) | Modificar datos |
| :--- | :--- | :--- | :--- | :--- |

### 9.6 Historial de Rutas de Reparto

#### Filtros
- Por Conductor
- Por Vehículo
- Ordenar por Antigüedad
- Desde x fecha a x fecha

#### Tabla con Filas Anidadas
```text
IdRutaReparto | Conductor | Vehículo | CantPedidos | Fecha
    └─ IdPedido_1 | Cliente | Dirección | FechaEmisión | Vendedor | Estado (entregado/pendiente)
    └─ IdPedido_2 | Cliente | Dirección | FechaEmisión | Vendedor | Estado (entregado/pendiente)
```

---

## ✅ Notas Transversales

- Todos los cálculos de Renta, ComisiónVendedor y RangoDeMarkup se realizan **en tiempo real**.
- Los campos CantidadStock vienen directamente de la base de datos.
- Las tablas con filas anidadas (Stock, Lotes, Detalle de Pedido, Rutas) deben tener jerarquía visual clara: fila padre en blanco/bold, filas hijas indentadas con fondo gris claro.
- Los tooltips se usan para observaciones largas y explicaciones de fórmulas.
- Todo el sistema está en **español**.
