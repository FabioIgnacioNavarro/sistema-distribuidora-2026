# Registro de Decisiones de Arquitectura (ADR)

## ADR-001: Modelo de rentabilidad por lotes con precio estable
- Fecha: Agosto 2026 | Estado: Aceptado
- Contexto: El dueño compra el mismo producto a precios distintos. Necesita precio de venta estable pero rentabilidad real variable.
- Decisión: Precio de venta único por producto (editable manualmente). Costo trackeado por lote individual. Rentabilidad calculada al vender usando costo del lote FIFO asignado.
- Consecuencias: Schema requiere tabla lotes separada. Items de pedido vinculan a lote específico.

## ADR-002: FIFO fijo sin estrategia configurable
- Fecha: Agosto 2026 | Estado: Aceptado
- Decisión: Descuento siempre por lote más antiguo (recibido_en ASC). Sin selector en UI. Lógica hardcodeada en servicio FIFO.
- Consecuencias: Menos complejidad. No hay campo estrategia_descuento en productos.

## ADR-003: Comisión configurable con valor inicial del 10%
- Fecha: Agosto 2026 | Estado: Aceptado
- Decisión: El porcentaje de comisión se almacena como configuración editable por el Administrador y comienza en 10%. El campo booleano vendido_por_dueno determina la excepción: la comisión es 0 si es una venta del dueño. La comisión se calcula sobre el precio de venta congelado en el pedido.
- Consecuencias: El porcentaje puede cambiarse sin modificar el código. Debe registrarse en auditoría cada modificación de configuración y conservarse el valor aplicado a cada pedido para que los históricos no cambien.

## ADR-009: Admin web con React + Vite
- Fecha: Agosto 2026 | Estado: Aceptado
- Decisión: La aplicación web de administración utilizará React + Vite + Tailwind. El backend continúa separado como Fastify + Supabase.
- Consecuencias: No se utilizará Next.js en el admin; el routing y el consumo de la API se resuelven en la aplicación cliente.

## ADR-004: Stock descontado al pasar a Preparado, no al crear pedido
- Fecha: Agosto 2026 | Estado: Aceptado
- Decisión: Validación de stock al crear pedido (bloqueo), pero descuento real de lotes ocurre solo en transición a preparado.
- Consecuencias: Stock puede mostrar disponible para pedidos pendientes. Riesgo mitigado por volumen bajo (30 pedidos/día).

## ADR-005: App móvil unificada con dos roles
- Fecha: Agosto 2026 | Estado: Aceptado
- Decisión: Un solo codebase React Native. Expo Router con stacks separados por rol. Lazy loading.
- Consecuencias: 50% menos infraestructura. Un solo APK. Bundle ligeramente mayor (mitigado con lazy loading).

## ADR-006: Reparto V1 sin mapas embebidos
- Fecha: Agosto 2026 | Estado: Aceptado
- Decisión: Botón Ir abre Google Maps nativo via intent/Linking. Sin tracking GPS ni optimización de rutas.
- Consecuencias: Ahorro de 2-3 semanas. Cero costo. Campos lat/lng reservados como nullable para V2.

## ADR-007: Todo el código en español
- Fecha: Agosto 2026 | Estado: Aceptado
- Decisión: Todos los identificadores del dominio en español. Keywords del lenguaje en inglés.
- Consecuencias: Curva de aprendizaje más baja. Documentación y código alineados.

## ADR-008: Persona como única entidad de identidad
- Fecha: Agosto 2026 | Estado: Aceptado
- Decisión: No existe entidad usuario separada. persona tiene rol y abarca admin, vendedor, chofer, logistica.
- Consecuencias: Sin joins innecesarios. Sin sincronización de datos duplicados. Suficiente para ~10 personas y 4 roles fijos.
