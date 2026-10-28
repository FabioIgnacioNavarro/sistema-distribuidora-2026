import { z } from "zod";

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD");

export const lineaCompraSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  costoUnitario: z.number().nonnegative(),
  fechaVencimiento: fechaSchema.nullable().optional(),
});

export const registrarCompraSchema = z.object({
  nroFactura: z.string().trim().min(1).max(100),
  proveedor: z.string().trim().min(1).max(200),
  fechaCompra: fechaSchema,
  notas: z.string().trim().max(1000).nullable().optional(),
  lineas: z.array(lineaCompraSchema).min(1),
});

export type RegistrarCompraEntrada = z.infer<typeof registrarCompraSchema>;

export interface CompraRegistrada {
  id: string;
}

export interface CompraHistorial {
  id: string;
  nroFactura: string;
  proveedor: string;
  fechaCompra: string;
  montoTotal: number;
  creadoEn: string | null;
  lineas: Array<{
    id: string;
    productoId: string | null;
    sku: string | null;
    nombreProducto: string | null;
    cantidad: number;
    costoUnitario: number;
    subtotal: number | null;
    fechaVencimiento: string | null;
  }>;
}

export const compraHistorialSchema = z.object({
  id: z.string().uuid(),
  nroFactura: z.string(),
  proveedor: z.string(),
  fechaCompra: fechaSchema,
  montoTotal: z.number(),
  creadoEn: z.string().nullable(),
  lineas: z.array(
    z.object({
      id: z.string().uuid(),
      productoId: z.string().uuid().nullable(),
      sku: z.string().nullable(),
      nombreProducto: z.string().nullable(),
      cantidad: z.number().int(),
      costoUnitario: z.number(),
      subtotal: z.number().nullable(),
      fechaVencimiento: fechaSchema.nullable(),
    }),
  ),
});

export const registrarCompraRespuestaSchema = z.object({
  id: z.string().uuid(),
  montoTotal: z.number().nonnegative(),
});
