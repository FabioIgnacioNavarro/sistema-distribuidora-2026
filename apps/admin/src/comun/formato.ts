export const REGISTROS_POR_PAGINA = 20;

export const dinero = (valor: number): string =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });

export const porcentaje = (valor: number): string =>
  `${valor.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;

export const fechaVisible = (valor: string): string =>
  new Date(`${valor.slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR");

export const fechaHoy = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

export const idFacturaVisible = (numero: number): string =>
  `F-${String(numero).padStart(4, "0")}`;
