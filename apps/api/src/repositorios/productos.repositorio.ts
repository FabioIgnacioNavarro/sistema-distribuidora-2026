import { supabase } from "../lib/supabase";
import type {
  ProductoInventario,
  StockLoteResumen,
} from "@distribuidora/tipos-compartidos";

export async function obtenerProductos(params?: {
  categoria_id?: string;
  busqueda?: string;
  solo_activos?: boolean;
}): Promise<ProductoInventario[]> {
  let query = supabase.from("productos").select("*, categorias(nombre)");

  if (params?.categoria_id) {
    query = query.eq("categoria_id", params.categoria_id);
  }

  if (params?.busqueda) {
    query = query.or(
      `nombre.ilike.%${params.busqueda}%,sku.ilike.%${params.busqueda}%`,
    );
  }

  if (params?.solo_activos !== false) {
    query = query.eq("esta_activo", true);
  }

  query = query.order("nombre", { ascending: true });

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []).map((producto) => ({
    id: producto.id,
    sku: producto.sku,
    nombre: producto.nombre,
    categoria: producto.categorias?.nombre ?? "Sin categoría",
    precioVenta: Number(producto.precio_venta),
    markupPct: Number(producto.markup_pct),
    stockTotal: producto.stock_total,
    estaActivo: producto.esta_activo ?? true,
  }));
}

export async function obtenerStockDesdeLotes(): Promise<StockLoteResumen[]> {
  const tamañoPagina = 1000;
  const resumen: StockLoteResumen[] = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from("lotes")
      .select("producto_id, cantidad_restante")
      .order("id", { ascending: true })
      .range(desde, desde + tamañoPagina - 1);

    if (error) throw new Error(error.message);
    const lotes = data ?? [];
    resumen.push(
      ...lotes.flatMap((lote) =>
        lote.producto_id
          ? [
              {
                productoId: lote.producto_id,
                cantidadRestante: lote.cantidad_restante,
              },
            ]
          : [],
      ),
    );

    if (lotes.length < tamañoPagina) return resumen;
    desde += tamañoPagina;
  }
}
