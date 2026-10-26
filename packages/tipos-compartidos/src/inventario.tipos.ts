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
