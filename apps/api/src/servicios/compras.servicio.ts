import {
  registrarCompraSchema,
  type RegistrarCompraEntrada,
} from "@distribuidora/tipos-compartidos";

export interface CompraPreparada {
  entrada: RegistrarCompraEntrada;
  montoTotal: number;
}

export function prepararCompra(entradaSinValidar: unknown): CompraPreparada {
  const entrada = registrarCompraSchema.parse(entradaSinValidar);
  const montoTotal = entrada.lineas.reduce(
    (total, linea) => total + linea.cantidad * linea.costoUnitario,
    0,
  );

  return { entrada, montoTotal };
}
