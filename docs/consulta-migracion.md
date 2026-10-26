# Consulta de migración

La consulta ejecutable está en [`supabase/migrations/20261026000100_modelo-comercial-y-configuracion.sql`](../supabase/migrations/20261026000100_modelo-comercial-y-configuracion.sql).

Se puede aplicar con el flujo habitual de Supabase:

```bash
pnpm exec supabase db push
```

Antes de cargar códigos o números históricos conviene detectar duplicados:

```sql
select codigo_cliente, count(*)
from public.clientes
where codigo_cliente is not null
group by codigo_cliente
having count(*) > 1;

select numero_pedido, count(*)
from public.pedidos
where numero_pedido is not null
group by numero_pedido
having count(*) > 1;
```

La migración no borra columnas, no modifica importes existentes y deja la comisión inicial en 10%. Las ventas importadas deben conservar su porcentaje histórico en `pedidos.porcentaje_comision_aplicado`.
