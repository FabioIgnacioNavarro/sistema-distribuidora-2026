-- Migración segura para bases existentes. No elimina ni reescribe datos históricos.
begin;

alter table public.clientes add column if not exists codigo_cliente text;
alter table public.pedidos add column if not exists numero_pedido bigint;
alter table public.pedidos add column if not exists fecha_emision date;
alter table public.pedidos add column if not exists porcentaje_comision_aplicado numeric(5,2);
alter table public.pedidos add column if not exists condicion_pago text;
alter table public.pedidos add column if not exists numero_remito text;
alter table public.facturas_compra add column if not exists sucursal_proveedor text;

create unique index if not exists clientes_codigo_cliente_unico
  on public.clientes (codigo_cliente)
  where codigo_cliente is not null;
create unique index if not exists pedidos_numero_pedido_unico
  on public.pedidos (numero_pedido)
  where numero_pedido is not null;
create index if not exists pedidos_fecha_emision_idx
  on public.pedidos (fecha_emision);

create table if not exists public.configuracion_comisiones (
  id uuid primary key default gen_random_uuid(),
  porcentaje numeric(5,2) not null default 10
    check (porcentaje >= 0 and porcentaje <= 100),
  actualizado_por uuid references public.persona(id),
  actualizado_en timestamp with time zone not null default now()
);

insert into public.configuracion_comisiones (porcentaje)
select 10
where not exists (select 1 from public.configuracion_comisiones);

create table if not exists public.lineas_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_venta_unitario numeric not null check (precio_venta_unitario >= 0),
  porcentaje_comision_aplicado numeric(5,2) not null default 10
    check (porcentaje_comision_aplicado >= 0 and porcentaje_comision_aplicado <= 100),
  subtotal numeric not null default 0,
  creado_en timestamp with time zone not null default now(),
  unique (pedido_id, producto_id)
);

create index if not exists lineas_pedido_pedido_idx
  on public.lineas_pedido (pedido_id);

-- Backfill: una línea comercial por producto para los pedidos ya existentes.
insert into public.lineas_pedido (
  pedido_id,
  producto_id,
  cantidad,
  precio_venta_unitario,
  porcentaje_comision_aplicado,
  subtotal
)
select
  item.pedido_id,
  item.producto_id,
  sum(item.cantidad),
  min(item.precio_venta_unitario),
  coalesce(max(pedido.porcentaje_comision_aplicado), 10),
  coalesce(sum(item.subtotal), 0)
from public.items_pedido item
join public.pedidos pedido on pedido.id = item.pedido_id
where item.pedido_id is not null
  and item.producto_id is not null
group by item.pedido_id, item.producto_id
on conflict (pedido_id, producto_id) do nothing;

alter table public.items_pedido add column if not exists linea_pedido_id uuid;
alter table public.items_pedido
  drop constraint if exists items_pedido_linea_pedido_id_fkey;
alter table public.items_pedido
  add constraint items_pedido_linea_pedido_id_fkey
  foreign key (linea_pedido_id) references public.lineas_pedido(id) on delete cascade;

update public.items_pedido item
set linea_pedido_id = linea.id
from public.lineas_pedido linea
where item.linea_pedido_id is null
  and item.pedido_id = linea.pedido_id
  and item.producto_id = linea.producto_id;

create index if not exists items_pedido_linea_pedido_idx
  on public.items_pedido (linea_pedido_id);

comment on table public.lineas_pedido is
  'Una fila comercial por producto; el detalle de consumo se conserva en items_pedido por lote.';
comment on column public.pedidos.porcentaje_comision_aplicado is
  'Snapshot de la comisión usada al crear el pedido; no cambia por configuraciones futuras.';

commit;
