import Fastify from "fastify";
import { rutasProductos } from "./rutas/productos.ruta.js";
import { rutasCompras } from "./rutas/compras.ruta.js";

const servidor = Fastify({ logger: true });

servidor.register(rutasProductos);
servidor.register(rutasCompras);

servidor.get("/api/salud", async () => ({
  estado: "ok",
  timestamp: new Date().toISOString(),
}));

const iniciar = async () => {
  try {
    await servidor.listen({ port: 3000, host: "0.0.0.0" });
    servidor.log.info("Servidor corriendo en http://localhost:3000");
  } catch (err) {
    servidor.log.error(err);
    process.exit(1);
  }
};

iniciar();
