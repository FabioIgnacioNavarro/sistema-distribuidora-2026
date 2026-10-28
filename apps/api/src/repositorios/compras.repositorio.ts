import type {
  CompraHistorial,
  LoteDetalle,
  RegistrarCompraEntrada,
} from "@distribuidora/tipos-compartidos";
import { supabase } from "../lib/supabase";

interface RespuestaRpcCompra {
  rpc: (
    nombre: "registrar_compra",
    argumentos: {
      p_nro_factura: string;
      p_proveedor: string;
      p_fecha_compra: string;
      p_notas: string | null;
      p_lineas: Array<{
        productoId: string | null;
        nuevoProducto: {
          nombre: string;
          categoriaCodigo: string;
          subcategoriaCodigo: string | null;
        } | null;
        cantidad: number;
        costoUnitario: number;
        fechaVencimiento: string | null;
      }>;
    },
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
}

export async function registrarCompra(
  entrada: RegistrarCompraEntrada,
): Promise<string> {
  // El tipo Database es generado y aún no incluye la función de esta migración.
  const clienteRpc = supabase as unknown as RespuestaRpcCompra;
  const { data, error } = await clienteRpc.rpc("registrar_compra", {
    p_nro_factura: entrada.nroFactura,
    p_proveedor: entrada.proveedor,
    p_fecha_compra: entrada.fechaCompra,
    p_notas: entrada.notas ?? null,
    p_lineas: entrada.lineas.map((linea) => ({
      productoId: linea.productoId ?? null,
      nuevoProducto: linea.nuevoProducto ?? null,
      cantidad: linea.cantidad,
      costoUnitario: linea.costoUnitario,
      fechaVencimiento: linea.fechaVencimiento ?? null,
    })),
  });

  if (error) throw new Error(error.message);
  if (!data)
    throw new Error(
      "La base de datos no devolvió el identificador de la factura.",
    );
  return data;
}

export async function obtenerHistorialCompras(): Promise<CompraHistorial[]> {
  const { data, error } = await supabase
    .from("facturas_compra")
    .select(
      "id, nro_factura, proveedor, fecha_compra, monto_total, creado_en, items_factura_compra(id, producto_id, cantidad, costo_unitario, subtotal, fecha_vencimiento, productos(sku, nombre))",
    )
    .order("fecha_compra", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((factura) => ({
    id: factura.id,
    nroFactura: factura.nro_factura,
    proveedor: factura.proveedor,
    fechaCompra: factura.fecha_compra,
    montoTotal: Number(factura.monto_total ?? 0),
    creadoEn: factura.creado_en,
    lineas: factura.items_factura_compra.map((linea) => ({
      id: linea.id,
      productoId: linea.producto_id,
      sku: linea.productos?.sku ?? null,
      nombreProducto: linea.productos?.nombre ?? null,
      cantidad: linea.cantidad,
      costoUnitario: Number(linea.costo_unitario),
      subtotal: linea.subtotal === null ? null : Number(linea.subtotal),
      fechaVencimiento: linea.fecha_vencimiento,
    })),
  }));
}

export async function obtenerLotes(): Promise<LoteDetalle[]> {
  const { data, error } = await supabase
    .from("lotes")
    .select(
      "id, factura_compra_id, producto_id, codigo_lote, cantidad_original, cantidad_restante, costo_unitario, fecha_vencimiento, recibido_en, productos(sku, nombre), facturas_compra(nro_factura, proveedor)",
    )
    .order("recibido_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((lote) => {
    if (!lote.producto_id || !lote.productos) return [];
    return [
      {
        id: lote.id,
        facturaCompraId: lote.factura_compra_id,
        productoId: lote.producto_id,
        codigoLote: lote.codigo_lote,
        cantidadOriginal: lote.cantidad_original,
        cantidadRestante: lote.cantidad_restante,
        costoUnitario: Number(lote.costo_unitario),
        fechaVencimiento: lote.fecha_vencimiento,
        recibidoEn: lote.recibido_en ?? "",
        productoSku: lote.productos.sku,
        productoNombre: lote.productos.nombre,
        proveedor: lote.facturas_compra?.proveedor ?? null,
        numeroFactura: lote.facturas_compra?.nro_factura ?? null,
      },
    ];
  });
}
