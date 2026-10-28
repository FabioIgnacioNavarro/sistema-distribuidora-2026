import type { FastifyInstance } from "fastify";
import { crearProductoSchema } from "@distribuidora/tipos-compartidos";
import {
  crearProducto,
  obtenerProductos,
  obtenerStockDesdeLotes,
} from "../repositorios/productos.repositorio.js";
import { aplicarStockDeLotes } from "../servicios/inventario.servicio.js";

export async function rutasProductos(servidor: FastifyInstance) {
  servidor.post("/api/productos", async (request, reply) => {
    try {
      const entrada = crearProductoSchema.parse(request.body);
      const id = await crearProducto(entrada);
      return reply.code(201).send({ id });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ mensaje: error.message });
      }
      throw error;
    }
  });

  servidor.get("/api/productos", async (request) => {
    const { categoria_id, busqueda, solo_activos } = request.query as {
      categoria_id?: string;
      busqueda?: string;
      solo_activos?: string;
    };

    const [productos, lotes] = await Promise.all([
      obtenerProductos({
        categoria_id,
        busqueda,
        solo_activos: solo_activos !== "false",
      }),
      obtenerStockDesdeLotes(),
    ]);

    return aplicarStockDeLotes(productos, lotes);
  });
}
