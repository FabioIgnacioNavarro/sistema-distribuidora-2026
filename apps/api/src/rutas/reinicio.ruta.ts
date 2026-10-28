import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import {
  estadoReinicioSchema,
  respuestaReinicioSchema,
} from "@distribuidora/tipos-compartidos";
import { reiniciarDatosOperativos } from "../repositorios/reinicio.repositorio.js";
import {
  reinicioHabilitado,
  validarConfirmacionReinicio,
} from "../servicios/reinicio.servicio.js";

export async function rutasReinicio(servidor: FastifyInstance): Promise<void> {
  servidor.get("/api/reinicio-fabrica/estado", async () =>
    estadoReinicioSchema.parse({ habilitado: reinicioHabilitado() }),
  );

  servidor.post("/api/reinicio-fabrica", async (request, reply) => {
    if (!reinicioHabilitado()) {
      return reply.code(403).send({
        mensaje: "El reinicio de fábrica no está habilitado en este entorno.",
      });
    }

    try {
      validarConfirmacionReinicio(request.body);
      await reiniciarDatosOperativos();
      return reply
        .code(200)
        .send(respuestaReinicioSchema.parse({ reiniciado: true }));
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          mensaje: "Escribí REINICIAR para confirmar la operación.",
          errores: error.issues,
        });
      }
      throw error;
    }
  });
}
