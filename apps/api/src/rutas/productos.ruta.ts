import { FastifyInstance } from 'fastify';
import { obtenerProductos } from '../repositorios/productos.repositorio.js';

export async function rutasProductos(servidor: FastifyInstance) {
  servidor.get('/api/productos', async (request) => {
    const { categoria_id, busqueda, solo_activos } = request.query as {
      categoria_id?: string;
      busqueda?: string;
      solo_activos?: string;
    };

    const productos = await obtenerProductos({
      categoria_id,
      busqueda,
      solo_activos: solo_activos !== 'false',
    });

    return productos;
  });
}