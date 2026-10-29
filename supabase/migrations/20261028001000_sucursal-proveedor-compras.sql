begin;

create or replace function public.registrar_compra_con_sucursal(
  p_nro_factura text,
  p_proveedor text,
  p_sucursal_proveedor text,
  p_fecha_compra date,
  p_notas text,
  p_lineas jsonb
)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_factura_id uuid;
begin
  v_factura_id := public.registrar_compra(p_nro_factura, p_proveedor, p_fecha_compra, p_notas, p_lineas);
  update public.facturas_compra
  set sucursal_proveedor = nullif(trim(p_sucursal_proveedor), '')
  where id = v_factura_id;
  return v_factura_id;
end;
$$;

revoke all on function public.registrar_compra_con_sucursal(text, text, text, date, text, jsonb) from public, anon, authenticated;
grant execute on function public.registrar_compra_con_sucursal(text, text, text, date, text, jsonb) to service_role;
notify pgrst, 'reload schema';
commit;
