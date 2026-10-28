-- Condiciones de pago configurables y snapshots de vencimiento en pedidos.
-- Las condiciones usadas por pedidos existentes se conservan en pedidos.condicion_pago.
begin;

create table if not exists public.condiciones_pago (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  tipo text not null check (
    tipo = any (array[
      'cuenta_corriente'::text,
      'transferencia'::text,
      'contado'::text,
      'tarjeta'::text
    ])
  ),
  dias_plazo smallint,
  esta_activa boolean not null default true,
  creado_en timestamp with time zone not null default now(),
  actualizado_en timestamp with time zone not null default now(),
  constraint condiciones_pago_plazo_coherente check (
    (tipo = 'cuenta_corriente' and dias_plazo is not null and dias_plazo > 0)
    or (tipo <> 'cuenta_corriente' and dias_plazo is null)
  )
);

insert into public.condiciones_pago (codigo, nombre, tipo, dias_plazo)
values
  ('cuenta_corriente_7', 'Cuenta corriente · 7 días', 'cuenta_corriente', 7),
  ('cuenta_corriente_14', 'Cuenta corriente · 14 días', 'cuenta_corriente', 14),
  ('cuenta_corriente_30', 'Cuenta corriente · 30 días', 'cuenta_corriente', 30),
  ('transferencia', 'Transferencia', 'transferencia', null),
  ('contado', 'Contado', 'contado', null),
  ('tarjeta', 'Tarjeta', 'tarjeta', null)
on conflict (codigo) do nothing;

alter table public.pedidos
  add column if not exists condicion_pago_id uuid,
  add column if not exists dias_plazo_aplicado smallint,
  add column if not exists fecha_vencimiento date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_condicion_pago_id_fkey'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos
      add constraint pedidos_condicion_pago_id_fkey
      foreign key (condicion_pago_id)
      references public.condiciones_pago (id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_dias_plazo_aplicado_check'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos
      add constraint pedidos_dias_plazo_aplicado_check
      check (dias_plazo_aplicado is null or dias_plazo_aplicado >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_vencimiento_posterior_emision_check'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos
      add constraint pedidos_vencimiento_posterior_emision_check
      check (
        fecha_vencimiento is null
        or fecha_emision is null
        or fecha_vencimiento >= fecha_emision
      );
  end if;
end;
$$;

create index if not exists pedidos_condicion_pago_id_idx
  on public.pedidos (condicion_pago_id);

create index if not exists pedidos_fecha_vencimiento_idx
  on public.pedidos (fecha_vencimiento)
  where fecha_vencimiento is not null;

alter table public.condiciones_pago enable row level security;

comment on table public.condiciones_pago is
  'Catálogo administrable de condiciones de pago disponibles para nuevos pedidos.';
comment on column public.pedidos.condicion_pago is
  'Nombre congelado de la condición seleccionada al emitir el pedido; conserva compatibilidad histórica.';
comment on column public.pedidos.condicion_pago_id is
  'Referencia al catálogo vigente; puede ser nula para pedidos históricos sin correspondencia segura.';
comment on column public.pedidos.dias_plazo_aplicado is
  'Snapshot del plazo en días al emitir el pedido; no cambia al editar la condición.';
comment on column public.pedidos.fecha_vencimiento is
  'Fecha de vencimiento congelada al emitir un pedido a cuenta corriente.';

commit;
