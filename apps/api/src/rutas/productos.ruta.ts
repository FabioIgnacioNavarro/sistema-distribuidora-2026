import type { FastifyInstance } from "fastify";
import {
  obtenerProductos,
  obtenerStockDesdeLotes,
} from "../repositorios/productos.repositorio.js";
import { aplicarStockDeLotes } from "../servicios/inventario.servicio.js";

export async function rutasProductos(servidor: FastifyInstance) {
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
