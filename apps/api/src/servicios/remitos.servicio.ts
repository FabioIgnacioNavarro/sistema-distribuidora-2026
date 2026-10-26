import type { Pedido, RemitoCliente, RemitoLinea, RemitoPreview } from '@distribuidora/tipos-compartidos';

interface ProductoRemito {
  id: string;
  sku: string;
  descripcion: string;
}

export function construirPrevisualizacionRemito(
  pedido: Pedido,
  cliente: RemitoCliente,
  productos: readonly ProductoRemito[],
  fechaEmision = new Date().toISOString().slice(0, 10),
  condicionPago: string | null = null,
): RemitoPreview {
  const porId = new Map(productos.map((producto) => [producto.id, producto]));
  const lineas: RemitoLinea[] = pedido.lineas.map((linea) => {
    const producto = porId.get(linea.productoId);
    if (!producto) throw new Error(`Producto no encontrado: ${linea.productoId}`);
    return {
      productoId: producto.id,
      sku: producto.sku,
      descripcion: producto.descripcion,
      cantidad: linea.cantidad,
      precioUnitario: linea.precioVentaUnitario,
      importeTotal: linea.subtotal,
      lotes: linea.asignaciones,
    };
  });
  return {
    numeroPedido: pedido.numeroPedido,
    numeroRemito: null,
    fechaEmision,
    cliente,
    condicionPago,
    lineas,
    totalPedido: lineas.reduce((total, linea) => total + linea.importeTotal, 0),
  };
}
