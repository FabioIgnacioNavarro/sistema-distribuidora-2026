-- Evita que la protección de actualizaciones sin filtro rechace el reinicio.
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
      actualizado_en = now()
  where stock_total <> 0;
end;
$$;

revoke all on function public.reiniciar_datos_operativos()
  from public, anon, authenticated;
grant execute on function public.reiniciar_datos_operativos()
  to service_role;

notify pgrst, 'reload schema';
commit;
