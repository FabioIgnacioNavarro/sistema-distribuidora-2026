export interface RegistroRentabilidad {
  fecha: string | Date;
  importeTotal: number;
  importeComision: number;
  gananciaTotal: number;
}

export interface ResumenRentabilidadMensual {
  mes: string;
  importeTotalFacturado: number;
  importeTotalComision: number;
  importeTotalRenta: number;
}

export function agruparRentabilidadMensual(
  registros: readonly RegistroRentabilidad[],
): ResumenRentabilidadMensual[] {
  const agrupados = new Map<string, ResumenRentabilidadMensual>();
  for (const registro of registros) {
    const fecha = new Date(registro.fecha);
    if (Number.isNaN(fecha.getTime())) throw new Error('Fecha de rentabilidad inválida');
    const mes = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
    const actual = agrupados.get(mes) ?? {
      mes,
      importeTotalFacturado: 0,
      importeTotalComision: 0,
      importeTotalRenta: 0,
    };
    actual.importeTotalFacturado += registro.importeTotal;
    actual.importeTotalComision += registro.importeComision;
    actual.importeTotalRenta += registro.gananciaTotal;
    agrupados.set(mes, actual);
  }
  return [...agrupados.values()].sort((a, b) => a.mes.localeCompare(b.mes));
}
