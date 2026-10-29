import type { FastifyPluginAsync } from "fastify";
import {
  clienteSchema,
  type ClienteEntrada,
} from "@distribuidora/tipos-compartidos";
import {
  crearCliente,
  listarClientes,
} from "../repositorios/clientes.repositorio";

export const rutasClientes: FastifyPluginAsync = async (servidor) => {
  servidor.get("/api/clientes", async (_solicitud, respuesta) => {
    try {
      const clientes = await listarClientes();
      return respuesta.status(200).send(clientes);
    } catch (error) {
      servidor.log.error(error);
      const mensaje =
        error instanceof Error ? error.message : "Error al obtener clientes.";
      return respuesta.status(500).send({ mensaje });
    }
  });

  servidor.post("/api/clientes", async (solicitud, respuesta) => {
    try {
      const entrada: ClienteEntrada = clienteSchema.parse(solicitud.body);
      const resultado = await crearCliente(entrada);
      return respuesta.status(201).send(resultado);
    } catch (error) {
      servidor.log.error(error);
      const mensaje =
        error instanceof Error ? error.message : "Error al registrar cliente.";
      return respuesta.status(400).send({ mensaje });
    }
  });
};
