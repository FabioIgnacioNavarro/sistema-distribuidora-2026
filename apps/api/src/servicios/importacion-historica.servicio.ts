import { importacionVentaHistoricaSchema, type VentaHistoricaEntrada } from '@distribuidora/tipos-compartidos';

export interface VentaHistoricaNormalizada extends VentaHistoricaEntrada {
  porcentajeComisionAplicado: number;
}

export function normalizarVentaHistorica(
  entradaSinValidar: unknown,
  porcentajePorDefecto = 8,
): VentaHistoricaNormalizada {
  const entrada = importacionVentaHistoricaSchema.parse(entradaSinValidar);
  return {
    ...entrada,
    porcentajeComisionAplicado: entrada.porcentajeComisionOriginal ?? porcentajePorDefecto,
  };
}
