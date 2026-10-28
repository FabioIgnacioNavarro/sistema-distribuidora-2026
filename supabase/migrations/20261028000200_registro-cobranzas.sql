-- Registra cobranzas parciales o totales vinculadas a pedidos.
-- Las cobranzas confirmadas son inmutables; para corregirlas se anulan y se registra otra.
begin;

create table if not exists public.cobranzas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null
    references public.pedidos(id) on delete restrict,
  monto numeric(12, 2) not null check (monto > 0),
  fecha_cobro timestamp with time zone not null default now(),
  medio_pago text not null check (length(btrim(medio_pago)) > 0),
  observacion text,
  estado text not null default 'confirmada'
    check (estado = any (array['confirmada'::text, 'anulada'::text])),
  registrado_por uuid not null
    references public.persona(id) on delete restrict,
  creado_en timestamp with time zone not null default now(),
  anulada_en timestamp with time zone,
  anulada_por uuid references public.persona(id) on delete restrict,
  motivo_anulacion text,
  constraint cobranzas_anulacion_coherente check (
    (
      estado = 'confirmada'
      and anulada_en is null
      and anulada_por is null
      and motivo_anulacion is null
    )
    or (
      estado = 'anulada'
      and anulada_en is not null
      and anulada_por is not null
      and motivo_anulacion is not null
      and length(btrim(motivo_anulacion)) > 0
    )
  )
);

create index if not exists cobranzas_pedido_fecha_idx
  on public.cobranzas (pedido_id, fecha_cobro desc, creado_en desc);

alter table public.cobranzas enable row level security;

create or replace function public.proteger_cobranza()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  importe_total_pedido numeric;
  importe_cobrado numeric;
begin
  if tg_op = 'INSERT' then
    if new.estado <> 'confirmada' then
      raise exception 'Las cobranzas deben registrarse confirmadas antes de poder anularse.';
    end if;

    select pedido.total
      into importe_total_pedido
      from public.pedidos as pedido
      where pedido.id = new.pedido_id
      for update;

    if not found then
      raise exception 'No existe el pedido asociado a la cobranza.';
    end if;

    select coalesce(sum(cobranza.monto), 0)
      into importe_cobrado
      from public.cobranzas as cobranza
      where cobranza.pedido_id = new.pedido_id
        and cobranza.estado = 'confirmada';

    if importe_cobrado + new.monto > importe_total_pedido then
      raise exception 'La cobranza supera el saldo pendiente del pedido.';
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Las cobranzas no se eliminan físicamente; deben anularse.';
  end if;

  if old.estado <> 'confirmada' then
    raise exception 'Solo se pueden anular cobranzas confirmadas.';
  end if;

  if new.estado <> 'anulada' then
    raise exception 'Una cobranza confirmada solo puede pasar a anulada.';
  end if;

  if (to_jsonb(new) - array['estado', 'anulada_en', 'anulada_por', 'motivo_anulacion'])
    is distinct from
     (to_jsonb(old) - array['estado', 'anulada_en', 'anulada_por', 'motivo_anulacion']) then
    raise exception 'Los datos de una cobranza son inmutables; solo se permite anularla.';
  end if;

  return new;
end;
$$;

create or replace function public.auditar_cobranza()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.auditoria (
    persona_id,
    tabla_afectada,
    registro_id,
    accion,
    valor_anterior,
    valor_nuevo,
    creado_en
  )
  values (
    case when tg_op = 'INSERT' then new.registrado_por else new.anulada_por end,
    'cobranzas',
    new.id,
    case when tg_op = 'INSERT' then 'crear' else 'cambio_estado' end,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new),
    now()
  );

  return new;
end;
$$;

drop trigger if exists cobranzas_proteger_ciclo_vida on public.cobranzas;
create trigger cobranzas_proteger_ciclo_vida
  before insert or update or delete on public.cobranzas
  for each row execute function public.proteger_cobranza();

drop trigger if exists cobranzas_auditar_movimientos on public.cobranzas;
create trigger cobranzas_auditar_movimientos
  after insert or update on public.cobranzas
  for each row execute function public.auditar_cobranza();

comment on table public.cobranzas is
  'Registro inmutable de pagos recibidos por pedido; los errores se corrigen mediante anulación auditada.';
comment on column public.cobranzas.monto is
  'Importe recibido. La suma de cobranzas confirmadas determina el total cobrado y el saldo pendiente.';
comment on column public.cobranzas.medio_pago is
  'Medio usado para recibir este pago, conservado como snapshot descriptivo.';
comment on column public.cobranzas.estado is
  'Una cobranza anulada se conserva para historial y auditoría, pero no debe computar como importe cobrado.';

commit;
