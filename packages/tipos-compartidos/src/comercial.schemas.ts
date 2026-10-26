import { z } from 'zod';

export const porcentajeSchema = z.number().min(0).max(100);

export const clienteSchema = z.object({
  id: z.string().uuid().optional(),
  codigoCliente: z.string().trim().min(1).max(40).optional(),
  nombre: z.string().trim().min(1).max(160),
  telefono: z.string().trim().max(40).nullable().optional(),
  direccion: z.string().trim().max(240).nullable().optional(),
  tipoCliente: z.enum(['minorista', 'mayorista']).default('minorista'),
  notas: z.string().trim().max(1000).nullable().optional(),
});

export const lineaPedidoEntradaSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  precioVentaUnitario: z.number().nonnegative(),
});

export const crearPedidoSchema = z.object({
  clienteId: z.string().uuid(),
  vendedorId: z.string().uuid().nullable().optional(),
  vendidoPorDueno: z.boolean().default(false),
  condicionPago: z.string().trim().max(120).nullable().optional(),
  notas: z.string().trim().max(1000).nullable().optional(),
  lineas: z.array(lineaPedidoEntradaSchema).min(1),
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
export type LineaPedidoEntrada = z.infer<typeof lineaPedidoEntradaSchema>;
export type CrearPedidoEntrada = z.infer<typeof crearPedidoSchema>;
export type AsignacionLote = z.infer<typeof asignacionLoteSchema>;
export type VentaHistoricaEntrada = z.infer<typeof importacionVentaHistoricaSchema>;
export type ConfiguracionComisionEntrada = z.infer<typeof configuracionComisionSchema>;
