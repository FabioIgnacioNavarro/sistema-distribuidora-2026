import {
  compraHistorialSchema,
  loteDetalleSchema,
  productoInventarioSchema,
  registrarCompraRespuestaSchema,
  registrarCompraSchema,
  type CompraHistorial,
  type LoteDetalle,
  type ProductoInventario,
  type RegistrarCompraEntrada,
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
