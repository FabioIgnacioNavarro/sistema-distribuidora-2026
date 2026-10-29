import { z } from "zod";

export const porcentajeSchema = z.number().min(0).max(100);

export const clienteSchema = z.object({
  id: z.string().uuid().optional(),
  codigoCliente: z.string().trim().min(1).max(40).optional(),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(160),
  telefono: z.string().trim().max(40).nullable().optional(),
  direccion: z.string().trim().max(240).nullable().optional(),
  tipoCliente: z.enum(["minorista", "mayorista"]).default("minorista"),
  notas: z.string().trim().max(1000).nullable().optional(),
});

export const nuevoClientePedidoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del cliente es obligatorio").max(160),
  direccion: z.string().trim().max(240).nullable().optional(),
  telefono: z.string().trim().max(40).nullable().optional(),
  tipoCliente: z.enum(["minorista", "mayorista"]).default("minorista"),
});

export const condicionPagoPedidoSchema = z.enum([
  "contado",
  "cuenta_corriente_7",
  "cuenta_corriente_14",
  "cuenta_corriente_30",
]);

export const medioAcreditacionPagoSchema = z.enum([
  "efectivo",
  "transferencia",
]);

export const lineaPedidoEntradaSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  precioVentaUnitario: z.number().nonnegative("El precio no puede ser negativo"),
});

export const crearPedidoSchema = z
  .object({
    clienteId: z.string().uuid().nullable().optional(),
    nuevoCliente: nuevoClientePedidoSchema.nullable().optional(),
    vendedorId: z.string().uuid().nullable().optional(),
    vendidoPorDueno: z.boolean().default(true),
    condicionPago: condicionPagoPedidoSchema,
    medioPagoContado: medioAcreditacionPagoSchema.optional(),
    notas: z.string().trim().max(1000).nullable().optional(),
    lineas: z
      .array(lineaPedidoEntradaSchema)
      .min(1, "El pedido debe contener al menos un producto"),
  })
  .superRefine((pedido, ctx) => {
    if (!pedido.clienteId && !pedido.nuevoCliente) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Debe seleccionar un cliente existente o completar los datos del nuevo cliente.",
      });
    }
    if (pedido.clienteId && pedido.nuevoCliente) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No puede especificar cliente existente y nuevo cliente al mismo tiempo.",
      });
    }
  });

export const clienteItemSchema = z.object({
  id: z.string().uuid(),
  codigoCliente: z.string().nullable(),
  nombre: z.string(),
  direccion: z.string().nullable(),
  telefono: z.string().nullable(),
  tipoCliente: z.string(),
  cantidadPedidos: z.number().int().nonnegative(),
  saldoPendiente: z.number(),
  totalComprado: z.number(),
});

export const lineaPedidoDetalleSchema = z.object({
  id: z.string().uuid(),
  productoId: z.string().uuid(),
  productoNombre: z.string(),
  cantidad: z.number().int(),
  precioVentaUnitario: z.number(),
  subtotal: z.number(),
});

export const pedidoHistorialItemSchema = z.object({
  id: z.string().uuid(),
  numeroPedido: z.number().int().nullable(),
  fechaEmision: z.string(),
  clienteId: z.string().uuid(),
  clienteNombre: z.string(),
  clienteDireccion: z.string().nullable(),
  clienteTelefono: z.string().nullable(),
  vendedorNombre: z.string().nullable(),
  vendidoPorDueno: z.boolean(),
  condicionPago: z.string(),
  fechaVencimiento: z.string().nullable(),
  importeTotal: z.number(),
  importeCobrado: z.number(),
  saldoPendiente: z.number(),
  estadoCobro: z.enum([
    "sin_cobrar",
    "cobrado_parcialmente",
    "cobrado_totalmente",
  ]),
  estado: z.enum([
    "pendiente_preparar",
    "preparado",
    "entregado",
    "cancelado",
  ]),
  lineas: z.array(lineaPedidoDetalleSchema),
});

export const crearPedidoRespuestaSchema = z.object({
  id: z.string().uuid(),
  numeroPedido: z.number().int().nullable(),
});

export const crearClienteRespuestaSchema = z.object({
  id: z.string().uuid(),
  codigoCliente: z.string().nullable(),
});

export const asignacionLoteSchema = z.object({
  loteId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  costoUnitario: z.number().nonnegative(),
});

export const importacionVentaHistoricaSchema = z.object({
  fecha: z.coerce.date(),
  numeroPedido: z.coerce.number().int().positive(),
  codigoCliente: z.string().trim().min(1),
  codigoArticulo: z.string().trim().min(1),
  descripcionArticulo: z.string().trim().min(1),
  cantidad: z.coerce.number().int().positive(),
  totalVendido: z.coerce.number().nonnegative(),
  comisionRenglon: z.coerce.number().nonnegative(),
  gananciaRenglon: z.coerce.number().nonnegative(),
  porcentajeComisionOriginal: porcentajeSchema.optional(),
});

export const configuracionComisionSchema = z.object({
  porcentaje: porcentajeSchema,
  actualizadoPor: z.string().uuid().nullable().optional(),
});

export type ClienteEntrada = z.infer<typeof clienteSchema>;
export type NuevoClientePedidoEntrada = z.infer<typeof nuevoClientePedidoSchema>;
export type CondicionPagoPedido = z.infer<typeof condicionPagoPedidoSchema>;
export type MedioAcreditacionPago = z.infer<typeof medioAcreditacionPagoSchema>;
export type LineaPedidoEntrada = z.infer<typeof lineaPedidoEntradaSchema>;
export type CrearPedidoEntrada = z.infer<typeof crearPedidoSchema>;
export type ClienteItem = z.infer<typeof clienteItemSchema>;
export type LineaPedidoDetalle = z.infer<typeof lineaPedidoDetalleSchema>;
export type PedidoHistorialItem = z.infer<typeof pedidoHistorialItemSchema>;
export type CrearPedidoRespuesta = z.infer<typeof crearPedidoRespuestaSchema>;
export type CrearClienteRespuesta = z.infer<typeof crearClienteRespuestaSchema>;
export type AsignacionLote = z.infer<typeof asignacionLoteSchema>;
export type VentaHistoricaEntrada = z.infer<
  typeof importacionVentaHistoricaSchema
>;
export type ConfiguracionComisionEntrada = z.infer<
  typeof configuracionComisionSchema
>;
