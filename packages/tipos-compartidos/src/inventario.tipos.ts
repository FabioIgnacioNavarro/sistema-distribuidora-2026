import { z } from "zod";

export const productoInventarioSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  nombre: z.string(),
  categoria: z.string(),
  precioVenta: z.number(),
  markupPct: z.number(),
  stockTotal: z.number().int(),
  estaActivo: z.boolean(),
});

export const loteDetalleSchema = z.object({
  id: z.string().uuid(),
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
  stockTotal: number;
  estaActivo: boolean;
}

export interface LoteInventario {
  id: string;
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
