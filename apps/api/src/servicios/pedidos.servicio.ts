import { crearPedidoSchema, type CrearPedidoEntrada, type BorradorPedido } from '@distribuidora/tipos-compartidos';

export function prepararBorradorPedido(
  entradaSinValidar: unknown,
  porcentajeVigente: number,
): BorradorPedido {
  const entrada: CrearPedidoEntrada = crearPedidoSchema.parse(entradaSinValidar);
  const porcentajeComisionAplicado = entrada.vendidoPorDueno ? 0 : porcentajeVigente;
  if (porcentajeComisionAplicado < 0 || porcentajeComisionAplicado > 100) {
    throw new Error('El porcentaje de comisión debe estar entre 0 y 100');
  }

  const lineas: BorradorPedido['lineas'] = entrada.lineas.map((linea) => ({
    productoId: String(linea.productoId),
    cantidad: Number(linea.cantidad),
    precioVentaUnitario: Number(linea.precioVentaUnitario),
    subtotal: Number(linea.cantidad) * Number(linea.precioVentaUnitario),
  }));
  return {
    entrada,
    porcentajeComisionAplicado,
    total: lineas.reduce((total, linea) => total + linea.subtotal, 0),
    lineas,
  };
}

export function consolidarLineasPedido(
  lineas: readonly CrearPedidoEntrada['lineas'][number][],
): CrearPedidoEntrada['lineas'] {
  const porProducto = new Map<string, CrearPedidoEntrada['lineas'][number]>();
  for (const linea of lineas) {
    const anterior = porProducto.get(linea.productoId);
    if (anterior) {
      porProducto.set(linea.productoId, {
        ...anterior,
        cantidad: anterior.cantidad + linea.cantidad,
      });
    } else {
      porProducto.set(linea.productoId, { ...linea });
    }
  }
  return [...porProducto.values()];
}
