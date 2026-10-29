begin;

alter table public.productos add column if not exists categoria_codigo text;
alter table public.productos add column if not exists subcategoria_codigo text;
create table if not exists public.contadores_sku (prefijo text primary key, ultimo_numero integer not null check (ultimo_numero > 0));

insert into public.categorias (nombre) values ('Almacén'), ('Snack'), ('Bebida') on conflict (nombre) do nothing;
update public.productos p set categoria_codigo = case
  when lower(c.nombre) in ('almacén','almacen','alimentos','alimento') then 'ALI'
  when lower(c.nombre) in ('snack','snacks') then 'SNK'
  when lower(c.nombre) in ('bebida','bebidas') then 'BEB'
  else p.categoria_codigo end
from public.categorias c where p.categoria_id = c.id and p.categoria_codigo is null;

update public.productos p set categoria_id = c.id
from public.categorias c
where c.nombre = case p.categoria_codigo when 'ALI' then 'Almacén' when 'SNK' then 'Snack' when 'BEB' then 'Bebida' end;

update public.productos set sku = 'LEG-' || sku where sku not like 'LEG-%';

insert into public.contadores_sku (prefijo, ultimo_numero)
select prefijo, max(numero)::integer from (
  select 'ALI-' prefijo, substring(sku from '^ALI-([0-9]{3})$') numero from public.productos
  union all select 'SNK-', substring(sku from '^SNK-([0-9]{3})$') from public.productos
  union all select 'BEB-V', substring(sku from '^BEB-V([0-9]{3})$') from public.productos
  union all select 'BEB-C', substring(sku from '^BEB-C([0-9]{3})$') from public.productos
  union all select 'BEB-G', substring(sku from '^BEB-G([0-9]{3})$') from public.productos
) codigos where numero is not null group by prefijo
on conflict (prefijo) do update set ultimo_numero = greatest(public.contadores_sku.ultimo_numero, excluded.ultimo_numero);

create or replace function public.generar_sku_producto(p_categoria_codigo text, p_subcategoria_codigo text)
returns text language plpgsql security invoker set search_path = '' as $$
declare v_prefijo text; v_numero integer;
begin
  if p_categoria_codigo not in ('ALI','SNK','BEB') then raise exception 'Categoría inválida'; end if;
  if p_categoria_codigo = 'BEB' and p_subcategoria_codigo not in ('V','C','G') then raise exception 'Las bebidas requieren subcategoría V, C o G'; end if;
  if p_categoria_codigo <> 'BEB' and p_subcategoria_codigo is not null then raise exception 'Solo las bebidas admiten subcategoría'; end if;
  v_prefijo := case when p_categoria_codigo = 'BEB' then 'BEB-' || p_subcategoria_codigo else p_categoria_codigo || '-' end;
  insert into public.contadores_sku values (v_prefijo, 1)
  on conflict (prefijo) do update set ultimo_numero = public.contadores_sku.ultimo_numero + 1
  returning ultimo_numero into v_numero;
  return v_prefijo || lpad(v_numero::text, 3, '0');
end; $$;

drop function if exists public.crear_producto(text, text, text, numeric, numeric);
create or replace function public.crear_producto(p_nombre text, p_categoria_codigo text, p_subcategoria_codigo text, p_precio_venta numeric, p_markup_pct numeric)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_categoria_id uuid; v_producto_id uuid; v_sku text; v_categoria_nombre text;
begin
  v_sku := public.generar_sku_producto(p_categoria_codigo, p_subcategoria_codigo);
  v_categoria_nombre := case p_categoria_codigo when 'ALI' then 'Almacén' when 'SNK' then 'Snack' else 'Bebida' end;
  select id into v_categoria_id from public.categorias where nombre = v_categoria_nombre;
  insert into public.productos (sku,nombre,categoria_id,categoria_codigo,subcategoria_codigo,precio_venta,markup_pct,stock_total)
  values (v_sku,trim(p_nombre),v_categoria_id,p_categoria_codigo,p_subcategoria_codigo,p_precio_venta,p_markup_pct,0) returning id into v_producto_id;
  return v_producto_id;
end; $$;

create or replace function public.registrar_compra(
  p_nro_factura text, p_proveedor text, p_fecha_compra date, p_notas text, p_lineas jsonb
)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_factura_id uuid; v_linea jsonb; v_producto_id uuid; v_cantidad integer;
  v_costo_unitario numeric; v_fecha_vencimiento date; v_monto_total numeric := 0;
  v_codigo_lote text; v_nuevo jsonb; v_categoria_id uuid; v_sku text;
  v_categoria_codigo text; v_subcategoria_codigo text; v_categoria_nombre text;
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
  values (p_nro_factura, p_proveedor, p_fecha_compra, v_monto_total, p_notas)
  returning id into v_factura_id;
  for v_linea in select value from jsonb_array_elements(p_lineas) loop
    v_producto_id := nullif(v_linea ->> 'productoId', '')::uuid;
    v_nuevo := v_linea -> 'nuevoProducto';
    v_cantidad := (v_linea ->> 'cantidad')::integer;
    v_costo_unitario := (v_linea ->> 'costoUnitario')::numeric;
    v_fecha_vencimiento := nullif(v_linea ->> 'fechaVencimiento', '')::date;
    if v_producto_id is null and jsonb_typeof(v_nuevo) = 'object' then
      v_categoria_codigo := v_nuevo ->> 'categoriaCodigo';
      v_subcategoria_codigo := nullif(v_nuevo ->> 'subcategoriaCodigo', '');
      v_sku := public.generar_sku_producto(v_categoria_codigo, v_subcategoria_codigo);
      v_categoria_nombre := case v_categoria_codigo when 'ALI' then 'Almacén' when 'SNK' then 'Snack' else 'Bebida' end;
      select id into v_categoria_id from public.categorias where nombre = v_categoria_nombre;
      insert into public.productos (sku, nombre, categoria_id, categoria_codigo, subcategoria_codigo, precio_venta, markup_pct, stock_total)
      values (v_sku, trim(v_nuevo ->> 'nombre'), v_categoria_id, v_categoria_codigo, v_subcategoria_codigo, v_costo_unitario, 0, 0)
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
end; $$;

revoke all on function public.generar_sku_producto(text,text) from public,anon,authenticated;
revoke all on function public.crear_producto(text,text,text,numeric,numeric) from public,anon,authenticated;
revoke all on function public.registrar_compra(text,text,date,text,jsonb) from public,anon,authenticated;
grant execute on function public.crear_producto(text,text,text,numeric,numeric) to service_role;
grant execute on function public.registrar_compra(text,text,date,text,jsonb) to service_role;
notify pgrst, 'reload schema';
commit;
