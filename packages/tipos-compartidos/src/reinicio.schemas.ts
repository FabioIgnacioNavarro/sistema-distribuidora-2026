import { z } from "zod";

export const confirmacionReinicioSchema = z.object({
  confirmacion: z.literal("REINICIAR"),
});

export const estadoReinicioSchema = z.object({
  habilitado: z.boolean(),
});

export type ConfirmacionReinicio = z.infer<typeof confirmacionReinicioSchema>;
export type EstadoReinicio = z.infer<typeof estadoReinicioSchema>;

export const respuestaReinicioSchema = z.object({
  reiniciado: z.literal(true),
});
