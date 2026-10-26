import type { LineaPedido } from './pedido.tipos';

export interface RemitoCliente {
  codigoCliente: string | null;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
}

export interface RemitoLinea {
  productoId: string;
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importeTotal: number;
  lotes: LineaPedido['asignaciones'];
}

export interface RemitoPreview {
  numeroPedido: number | null;
  numeroRemito: string | null;
  fechaEmision: string;
  cliente: RemitoCliente;
  condicionPago: string | null;
  lineas: RemitoLinea[];
  totalPedido: number;
}
