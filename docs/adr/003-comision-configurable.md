# ADR-003: Comisión configurable con valor inicial del 10%

- Fecha: Agosto 2026
- Estado: Aceptado

El Administrador edita el porcentaje vigente, inicialmente 10%. Si `vendido_por_dueno` es verdadero, la comisión es cero. Se calcula sobre el precio congelado en el pedido y se guarda el porcentaje aplicado para no alterar históricos. Cada cambio se audita.
