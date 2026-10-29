import {
  compraHistorialSchema,
  crearProductoRespuestaSchema,
  crearProductoSchema,
  actualizarProductoPreciosRespuestaSchema,
  actualizarProductoPreciosSchema,
  loteDetalleSchema,
  productoInventarioSchema,
  registrarCompraRespuestaSchema,
  registrarCompraSchema,
  confirmacionReinicioSchema,
  estadoReinicioSchema,
  respuestaReinicioSchema,
  clienteItemSchema,
  clienteSchema,
  crearClienteRespuestaSchema,
  pedidoHistorialItemSchema,
  crearPedidoSchema,
  crearPedidoRespuestaSchema,
  type CompraHistorial,
  type LoteDetalle,
  type ProductoInventario,
  type RegistrarCompraEntrada,
  type ClienteItem,
  type PedidoHistorialItem,
  type CrearClienteRespuesta,
  type CrearPedidoRespuesta,
} from "@distribuidora/tipos-compartidos";

const urlApi = import.meta.env.VITE_API_URL ?? "";

async function consultarApi(
  ruta: string,
  opciones?: RequestInit,
): Promise<unknown> {
  const respuesta = await fetch(`${urlApi}${ruta}`, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...opciones?.headers },
  });
  const contenido: unknown = await respuesta.json();
  if (!respuesta.ok) {
    if (
      typeof contenido === "object" &&
      contenido !== null &&
      "mensaje" in contenido &&
      typeof contenido.mensaje === "string"
    ) {
      throw new Error(contenido.mensaje);
    }
    throw new Error("No se pudo completar la solicitud.");
  }
  return contenido;
}

export async function obtenerProductos(): Promise<ProductoInventario[]> {
  return productoInventarioSchema
    .array()
    .parse(await consultarApi("/api/productos"));
}

export async function obtenerLotes(): Promise<LoteDetalle[]> {
  return loteDetalleSchema.array().parse(await consultarApi("/api/lotes"));
}

export async function obtenerCompras(): Promise<CompraHistorial[]> {
  return compraHistorialSchema
    .array()
    .parse(await consultarApi("/api/compras"));
}

export async function crearCompra(entradaSinValidar: unknown): Promise<string> {
  const entrada = registrarCompraSchema.parse(entradaSinValidar);
  const respuesta = registrarCompraRespuestaSchema.parse(
    await consultarApi("/api/compras", {
      method: "POST",
      body: JSON.stringify(entrada),
    }),
  );
  return respuesta.id;
}

export async function crearProducto(
  entradaSinValidar: unknown,
): Promise<string> {
  const entrada = crearProductoSchema.parse(entradaSinValidar);
  const respuesta = crearProductoRespuestaSchema.parse(
    await consultarApi("/api/productos", {
      method: "POST",
      body: JSON.stringify(entrada),
    }),
  );
  return respuesta.id;
}

export async function actualizarProductoPrecios(
  entradaSinValidar: unknown,
): Promise<void> {
  const entrada = actualizarProductoPreciosSchema.parse(entradaSinValidar);
  actualizarProductoPreciosRespuestaSchema.parse(
    await consultarApi(`/api/productos/${entrada.id}/precios`, {
      method: "PATCH",
      body: JSON.stringify({
        precioVenta: entrada.precioVenta,
        markupPct: entrada.markupPct,
      }),
    }),
  );
}

export async function obtenerEstadoReinicio(): Promise<boolean> {
  const respuesta = estadoReinicioSchema.parse(
    await consultarApi("/api/reinicio-fabrica/estado"),
  );
  return respuesta.habilitado;
}

export async function reiniciarDatosOperativos(
  entradaSinValidar: unknown,
): Promise<void> {
  const entrada = confirmacionReinicioSchema.parse(entradaSinValidar);
  respuestaReinicioSchema.parse(
    await consultarApi("/api/reinicio-fabrica", {
      method: "POST",
      body: JSON.stringify(entrada),
    }),
  );
}

export async function obtenerClientes(): Promise<ClienteItem[]> {
  return clienteItemSchema
    .array()
    .parse(await consultarApi("/api/clientes"));
}

export async function crearCliente(
  entradaSinValidar: unknown,
): Promise<CrearClienteRespuesta> {
  const entrada = clienteSchema.parse(entradaSinValidar);
  return crearClienteRespuestaSchema.parse(
    await consultarApi("/api/clientes", {
      method: "POST",
      body: JSON.stringify(entrada),
    }),
  );
}

export async function obtenerPedidos(): Promise<PedidoHistorialItem[]> {
  return pedidoHistorialItemSchema
    .array()
    .parse(await consultarApi("/api/pedidos"));
}

export async function crearPedido(
  entradaSinValidar: unknown,
): Promise<CrearPedidoRespuesta> {
  const entrada = crearPedidoSchema.parse(entradaSinValidar);
  return crearPedidoRespuestaSchema.parse(
    await consultarApi("/api/pedidos", {
      method: "POST",
      body: JSON.stringify(entrada),
    }),
  );
}

