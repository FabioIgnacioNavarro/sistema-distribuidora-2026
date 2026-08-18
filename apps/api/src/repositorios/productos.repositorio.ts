import { supabase } from '../lib/supabase';
import type { Producto } from '@distribuidora/tipos-compartidos';

export async function obtenerProductos(params?: {
  categoria_id?: string;
  busqueda?: string;
  solo_activos?: boolean;
}): Promise<Producto[]> {
  let query = supabase.from('productos').select('*');

  if (params?.categoria_id) {
    query = query.eq('categoria_id', params.categoria_id);
  }

  if (params?.busqueda) {
    query = query.or(`nombre.ilike.%${params.busqueda}%,sku.ilike.%${params.busqueda}%`);
  }

  if (params?.solo_activos !== false) {
    query = query.eq('esta_activo', true);
  }

  query = query.order('nombre', { ascending: true });

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data as Producto[];
}