import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import {
  obtenerHistorialCompras,
  obtenerLotes,
  registrarCompra,
} from "../repositorios/compras.repositorio.js";
import { prepararCompra } from "../servicios/compras.servicio.js";

export async function rutasCompras(servidor: FastifyInstance): Promise<void> {
  servidor.get("/api/compras", async () => obtenerHistorialCompras());

  servidor.get("/api/lotes", async () => obtenerLotes());

  servidor.post("/api/compras", async (request, reply) => {
    try {
      const { entrada, montoTotal } = prepararCompra(request.body);
      const facturaId = await registrarCompra(entrada);
      return reply.code(201).send({ id: facturaId, montoTotal });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          mensaje: "Los datos de la compra no son válidos",
          errores: error.issues,
        });
      }
      throw error;
    }
  });
}
