import type {
  ProductoInventario,
  StockLoteResumen,
} from "@distribuidora/tipos-compartidos";

export function aplicarStockDeLotes(
  productos: ProductoInventario[],
  lotes: StockLoteResumen[],
): ProductoInventario[] {
  const cantidadesPorProducto = new Map<string, number>();
  for (const lote of lotes) {
    const cantidadActual = cantidadesPorProducto.get(lote.productoId) ?? 0;
    cantidadesPorProducto.set(
      lote.productoId,
      cantidadActual + lote.cantidadRestante,
    );
  }

  return productos.map((producto) => ({
    ...producto,
    stockTotal: cantidadesPorProducto.get(producto.id) ?? 0,
  }));
}
