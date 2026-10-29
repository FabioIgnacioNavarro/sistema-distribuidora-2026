import type { FastifyPluginAsync } from "fastify";
import {
  crearPedidoSchema,
  type CrearPedidoEntrada,
} from "@distribuidora/tipos-compartidos";
import { crearPedido, listarPedidos } from "../repositorios/pedidos.repositorio";

export const rutasPedidos: FastifyPluginAsync = async (servidor) => {
  servidor.get("/api/pedidos", async (_solicitud, respuesta) => {
    try {
      const pedidos = await listarPedidos();
      return respuesta.status(200).send(pedidos);
    } catch (error) {
      servidor.log.error(error);
      const mensaje =
        error instanceof Error ? error.message : "Error al obtener pedidos.";
      return respuesta.status(500).send({ mensaje });
    }
  });

  servidor.post("/api/pedidos", async (solicitud, respuesta) => {
    try {
      const entrada: CrearPedidoEntrada = crearPedidoSchema.parse(
        solicitud.body,
      );
      const resultado = await crearPedido(entrada);
      return respuesta.status(201).send(resultado);
    } catch (error) {
      servidor.log.error(error);
      const mensaje =
        error instanceof Error ? error.message : "Error al registrar el pedido.";
      return respuesta.status(400).send({ mensaje });
    }
  });
};
