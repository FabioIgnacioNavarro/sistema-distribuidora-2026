import type { AsignacionLote, LoteDisponible } from '@distribuidora/tipos-compartidos';

export class StockInsuficienteError extends Error {
  constructor(productoId: string, solicitado: number, disponible: number) {
    super(`Stock insuficiente para ${productoId}: solicitado ${solicitado}, disponible ${disponible}`);
    this.name = 'StockInsuficienteError';
  }
}

export function asignarLotesFifo(
  lotes: readonly LoteDisponible[],
  cantidadSolicitada: number,
): AsignacionLote[] {
  if (!Number.isInteger(cantidadSolicitada) || cantidadSolicitada <= 0) {
    throw new Error('La cantidad solicitada debe ser un entero positivo');
  }

  const ordenados = [...lotes].sort(
    (a, b) => new Date(a.recibidoEn).getTime() - new Date(b.recibidoEn).getTime(),
  );
  const disponible = ordenados.reduce((total, lote) => total + lote.cantidadRestante, 0);
  if (disponible < cantidadSolicitada) {
    throw new StockInsuficienteError(lotes[0]?.productoId ?? 'desconocido', cantidadSolicitada, disponible);
  }

  let pendiente = cantidadSolicitada;
  const asignaciones: AsignacionLote[] = [];
  for (const lote of ordenados) {
    if (pendiente === 0) break;
    const cantidad = Math.min(pendiente, lote.cantidadRestante);
    if (cantidad > 0) {
      asignaciones.push({ loteId: lote.id, cantidad, costoUnitario: lote.costoUnitario });
      pendiente -= cantidad;
    }
  }
  return asignaciones;
}
