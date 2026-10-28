import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import {
  actualizarProductoPreciosSchema,
  crearProductoSchema,
} from "@distribuidora/tipos-compartidos";
import {
  actualizarProductoPrecios,
  obtenerCostosLotesActivos,
  crearProducto,
  obtenerProductos,
  obtenerStockDesdeLotes,
} from "../repositorios/productos.repositorio.js";
import { aplicarStockDeLotes } from "../servicios/inventario.servicio.js";

export async function rutasProductos(servidor: FastifyInstance) {
  servidor.patch("/api/productos/:id/precios", async (request, reply) => {
    try {
      const entrada = actualizarProductoPreciosSchema.parse({
        ...(request.body as object),
        id: (request.params as { id: string }).id,
      });
      await actualizarProductoPrecios(entrada);
      return reply.send({ actualizado: true });
    } catch (error) {
      if (error instanceof ZodError)
        return reply
          .code(400)
          .send({
            mensaje: "Los precios no son válidos",
            errores: error.issues,
          });
      throw error;
    }
  });

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

    const productosConStock = aplicarStockDeLotes(productos, lotes);
    const costosPorProducto = new Map<string, number[]>();
    const lotesActivos = await obtenerCostosLotesActivos();
    for (const lote of lotesActivos) {
      const costos = costosPorProducto.get(lote.productoId) ?? [];
      costos.push(lote.costoUnitario);
      costosPorProducto.set(lote.productoId, costos);
    }
    return productosConStock.map((producto) => {
      const costos = costosPorProducto.get(producto.id) ?? [];
      if (!costos.length) return producto;
      const markups = costos.map((costo) =>
        costo === 0 ? 0 : ((producto.precioVenta - costo) / costo) * 100,
      );
      return {
        ...producto,
        markupRealMin: Math.min(...markups),
        markupRealMax: Math.max(...markups),
      };
    });
  });
}
