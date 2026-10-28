-- La columna subtotal de items_factura_compra es generada por la base.
begin;

create or replace function public.registrar_compra(
  p_nro_factura text, p_proveedor text, p_fecha_compra date, p_notas text, p_lineas jsonb
)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_factura_id uuid; v_linea jsonb; v_producto_id uuid; v_cantidad integer;
  v_costo_unitario numeric; v_fecha_vencimiento date; v_monto_total numeric := 0;
  v_codigo_lote text; v_nuevo jsonb; v_categoria_id uuid;
begin
  if jsonb_typeof(p_lineas) is distinct from 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'La factura debe incluir al menos un producto';
  end if;
  v_codigo_lote := p_nro_factura || '-' || regexp_replace(p_proveedor, '[^[:alnum:]]+', '-', 'g') || '-' || to_char(p_fecha_compra, 'DD-MM-YYYY');
  for v_linea in select value from jsonb_array_elements(p_lineas) loop
    v_cantidad := (v_linea ->> 'cantidad')::integer;
    v_costo_unitario := (v_linea ->> 'costoUnitario')::numeric;
    if v_cantidad <= 0 or v_costo_unitario < 0 then raise exception 'Cantidad o costo unitario inválido'; end if;
    v_monto_total := v_monto_total + v_cantidad * v_costo_unitario;
  end loop;
  insert into public.facturas_compra (nro_factura, proveedor, fecha_compra, monto_total, notas)
    values (p_nro_factura, p_proveedor, p_fecha_compra, v_monto_total, p_notas) returning id into v_factura_id;
  for v_linea in select value from jsonb_array_elements(p_lineas) loop
    v_producto_id := nullif(v_linea ->> 'productoId', '')::uuid;
    v_nuevo := v_linea -> 'nuevoProducto';
    v_cantidad := (v_linea ->> 'cantidad')::integer;
    v_costo_unitario := (v_linea ->> 'costoUnitario')::numeric;
    v_fecha_vencimiento := nullif(v_linea ->> 'fechaVencimiento', '')::date;
    if v_producto_id is null and v_nuevo is not null and jsonb_typeof(v_nuevo) = 'object' then
      select id into v_categoria_id from public.categorias where lower(nombre) = lower(trim(v_nuevo ->> 'categoria')) limit 1;
      if v_categoria_id is null then
        insert into public.categorias (nombre) values (trim(v_nuevo ->> 'categoria')) returning id into v_categoria_id;
      end if;
      insert into public.productos (sku, nombre, categoria_id, precio_venta, markup_pct, stock_total)
        values (trim(v_nuevo ->> 'sku'), trim(v_nuevo ->> 'nombre'), v_categoria_id, v_costo_unitario, 0, 0)
        returning id into v_producto_id;
    end if;
    if v_producto_id is null then raise exception 'Cada línea debe indicar un producto existente o uno nuevo válido'; end if;
    update public.productos set stock_total = stock_total + v_cantidad, actualizado_en = now() where id = v_producto_id;
    if not found then raise exception 'No existe el producto %', v_producto_id; end if;
    insert into public.items_factura_compra (factura_id, producto_id, cantidad, costo_unitario, fecha_vencimiento)
      values (v_factura_id, v_producto_id, v_cantidad, v_costo_unitario, v_fecha_vencimiento);
    insert into public.lotes (producto_id, factura_compra_id, codigo_lote, cantidad_original, cantidad_restante, costo_unitario, fecha_vencimiento, recibido_en)
      values (v_producto_id, v_factura_id, v_codigo_lote, v_cantidad, v_cantidad, v_costo_unitario, v_fecha_vencimiento, p_fecha_compra::timestamp with time zone);
  end loop;
  insert into public.auditoria (tabla_afectada, registro_id, accion, valor_nuevo)
    values ('facturas_compra', v_factura_id, 'crear', jsonb_build_object('nro_factura', p_nro_factura, 'proveedor', p_proveedor, 'fecha_compra', p_fecha_compra, 'monto_total', v_monto_total, 'lineas', p_lineas));
  return v_factura_id;
end;
$$;

revoke all on function public.registrar_compra(text, text, date, text, jsonb) from public, anon, authenticated;
grant execute on function public.registrar_compra(text, text, date, text, jsonb) to service_role;
notify pgrst, 'reload schema';
commit;
