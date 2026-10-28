-- Reinicio controlado de datos operativos para entornos de desarrollo.
-- Conserva catálogo, clientes, usuarios y configuración.
begin;

create or replace function public.reiniciar_datos_operativos()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  truncate table
    public.auditoria,
    public.cobranzas,
    public.entregas,
    public.items_pedido,
    public.lineas_pedido,
    public.pedidos,
    public.ajustes_inventario,
    public.items_factura_compra,
    public.lotes,
    public.facturas_compra,
    public.hojas_ruta
  restart identity;

  update public.productos
  set stock_total = 0,
      actualizado_en = now();
end;
$$;

revoke all on function public.reiniciar_datos_operativos()
  from public, anon, authenticated;
grant execute on function public.reiniciar_datos_operativos()
  to service_role;

comment on function public.reiniciar_datos_operativos() is
  'Borra datos operativos y reinicia el stock, conservando catálogo, personas y configuración. Uso exclusivo de desarrollo.';

notify pgrst, 'reload schema';
commit;
