begin;

-- IdFactura visible: correlativo autogenerado, independiente del número
-- de comprobante real (nro_factura) que trae la factura del proveedor.
alter table public.facturas_compra
  add column if not exists numero_interno bigint generated always as identity;

create unique index if not exists facturas_compra_numero_interno_uk
  on public.facturas_compra (numero_interno);

notify pgrst, 'reload schema';
commit;
