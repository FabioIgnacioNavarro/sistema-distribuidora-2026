import { z } from "zod";

export const productoInventarioSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  nombre: z.string(),
  categoria: z.string(),
  precioVenta: z.number(),
  markupPct: z.number(),
  markupRealMin: z.number().nullable(),
  markupRealMax: z.number().nullable(),
  cantidadLotesActivos: z.number().int().nonnegative(),
  stockTotal: z.number().int(),
  estaActivo: z.boolean(),
});

export const loteDetalleSchema = z.object({
  id: z.string().uuid(),
  facturaCompraId: z.string().uuid().nullable(),
  productoId: z.string().uuid(),
  codigoLote: z.string(),
  cantidadOriginal: z.number().int(),
  cantidadRestante: z.number().int(),
  costoUnitario: z.number(),
  fechaVencimiento: z.string().nullable(),
  recibidoEn: z.string(),
  productoSku: z.string(),
  productoNombre: z.string(),
  proveedor: z.string().nullable(),
  numeroFactura: z.string().nullable(),
});

export interface ProductoInventario {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  markupPct: number;
  markupRealMin: number | null;
  markupRealMax: number | null;
  cantidadLotesActivos: number;
  stockTotal: number;
  estaActivo: boolean;
}

export interface LoteInventario {
  id: string;
  facturaCompraId: string | null;
  productoId: string;
  codigoLote: string;
  cantidadOriginal: number;
  cantidadRestante: number;
  costoUnitario: number;
  fechaVencimiento: string | null;
  recibidoEn: string;
}

export interface LoteDetalle extends LoteInventario {
  productoSku: string;
  productoNombre: string;
  proveedor: string | null;
  numeroFactura: string | null;
}

export interface StockLoteResumen {
  productoId: string;
  cantidadRestante: number;
}
