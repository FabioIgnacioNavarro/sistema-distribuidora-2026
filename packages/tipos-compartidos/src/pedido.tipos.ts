import type { AsignacionLote, CrearPedidoEntrada } from './comercial.schemas';

export interface LoteDisponible {
  id: string;
  productoId: string;
  codigoLote: string;
  cantidadRestante: number;
  costoUnitario: number;
  fechaVencimiento: string | null;
  recibidoEn: string;
}

export interface LineaPedido {
  id: string;
  pedidoId: string;
  productoId: string;
  cantidad: number;
  precioVentaUnitario: number;
  porcentajeComisionAplicado: number;
  subtotal: number;
  asignaciones: AsignacionLote[];
}

export interface Pedido {
  id: string;
  clienteId: string;
  vendedorId: string | null;
  numeroPedido: number | null;
  estado: 'pendiente_preparar' | 'preparado' | 'entregado' | 'cancelado';
  vendidoPorDueno: boolean;
  porcentajeComisionAplicado: number;
  total: number;
  lineas: LineaPedido[];
  creadoEn: string;
}

export interface BorradorPedido {
  entrada: CrearPedidoEntrada;
  porcentajeComisionAplicado: number;
  total: number;
  lineas: Array<{
    productoId: string;
    cantidad: number;
    precioVentaUnitario: number;
    subtotal: number;
  }>;
}
