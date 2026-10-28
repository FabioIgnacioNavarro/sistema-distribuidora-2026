import {
  confirmacionReinicioSchema,
  type ConfirmacionReinicio,
} from "@distribuidora/tipos-compartidos";

export function validarConfirmacionReinicio(
  entradaSinValidar: unknown,
): ConfirmacionReinicio {
  return confirmacionReinicioSchema.parse(entradaSinValidar);
}

export function reinicioHabilitado(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.HABILITAR_REINICIO_DE_FABRICA === "true"
  );
}
