import { supabase } from "../lib/supabase";
import type {
  CrearPedidoEntrada,
  CrearPedidoRespuesta,
  PedidoHistorialItem,
} from "@distribuidora/tipos-compartidos";
import { crearCliente } from "./clientes.repositorio";

export async function listarPedidos(): Promise<PedidoHistorialItem[]> {
  // Obtenemos los pedidos con clientes y vendedor
  const { data: pedidosData, error: pedidosError } = await supabase
    .from("pedidos")
    .select(`
      id,
      numero_pedido,
      fecha_emision,
      cliente_id,
      vendedor_id,
      vendido_por_dueno,
      condicion_pago,
      fecha_vencimiento,
      total,
      estado,
      creado_en,
      clientes (
        id,
        nombre,
        direccion,
        telefono,
        codigo_cliente
      ),
      persona (
        nombre_completo
      )
    `)
    .order("creado_en", { ascending: false });

  if (pedidosError) {
    throw new Error(`Error al obtener pedidos: ${pedidosError.message}`);
  }

  // Obtenemos las líneas de pedido
  const { data: lineasData, error: lineasError } = await supabase
    .from("lineas_pedido")
    .select(`
      id,
      pedido_id,
      producto_id,
      cantidad,
      precio_venta_unitario,
      subtotal,
      productos (
        nombre
      )
    `);

  if (lineasError) {
    throw new Error(`Error al obtener líneas de pedido: ${lineasError.message}`);
  }

  // Obtenemos cobranzas confirmadas para calcular estado de cobro
  const { data: cobranzasData, error: cobranzasError } = await supabase
    .from("cobranzas")
    .select("pedido_id, monto, estado")
    .eq("estado", "confirmada");

  if (cobranzasError) {
    throw new Error(`Error al obtener cobranzas: ${cobranzasError.message}`);
  }

  // Mapeamos cobranzas por pedido
  const cobradoPorPedido = new Map<string, number>();
  for (const c of cobranzasData ?? []) {
    const actual = cobradoPorPedido.get(c.pedido_id) ?? 0;
    cobradoPorPedido.set(c.pedido_id, actual + Number(c.monto));
  }

  // Mapeamos líneas por pedido
  const lineasPorPedido = new Map<
    string,
    Array<{
      id: string;
      productoId: string;
      productoNombre: string;
      cantidad: number;
      precioVentaUnitario: number;
      subtotal: number;
    }>
  >();

  for (const l of lineasData ?? []) {
    const arr = lineasPorPedido.get(l.pedido_id) ?? [];
    const prod = l.productos as unknown as { nombre: string } | null;
    arr.push({
      id: l.id,
      productoId: l.producto_id,
      productoNombre: prod?.nombre ?? "Producto",
      cantidad: l.cantidad,
      precioVentaUnitario: Number(l.precio_venta_unitario),
      subtotal: Number(l.subtotal),
    });
    lineasPorPedido.set(l.pedido_id, arr);
  }

  return (pedidosData ?? []).map((p) => {
    const cliente = p.clientes as unknown as {
      id: string;
      nombre: string;
      direccion: string | null;
      telefono: string | null;
      codigo_cliente: string | null;
    } | null;

    const persona = p.persona as unknown as {
      nombre_completo: string;
    } | null;

    const total = Number(p.total ?? 0);
    const cobrado = cobradoPorPedido.get(p.id) ?? 0;
    const pendiente = Math.max(0, total - cobrado);

    let estadoCobro: "sin_cobrar" | "cobrado_parcialmente" | "cobrado_totalmente" =
      "sin_cobrar";
    if (cobrado >= total && total > 0) {
      estadoCobro = "cobrado_totalmente";
    } else if (cobrado > 0) {
      estadoCobro = "cobrado_parcialmente";
    }

    const lineas = lineasPorPedido.get(p.id) ?? [];

    return {
      id: p.id,
      numeroPedido: (p as { numero_pedido?: number | null }).numero_pedido ?? null,
      fechaEmision:
        (p as { fecha_emision?: string | null }).fecha_emision ??
        (p.creado_en ? p.creado_en.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      clienteId: cliente?.id ?? p.cliente_id ?? "",
      clienteNombre: cliente?.nombre ?? "Cliente no registrado",
      clienteDireccion: cliente?.direccion ?? null,
      clienteTelefono: cliente?.telefono ?? null,
      vendedorNombre: p.vendido_por_dueno
        ? "Dueño (Fontana)"
        : persona?.nombre_completo ?? "Vendedor",
      vendidoPorDueno: Boolean(p.vendido_por_dueno),
      condicionPago:
        (p as { condicion_pago?: string | null }).condicion_pago ?? "Contado",
      fechaVencimiento:
        (p as { fecha_vencimiento?: string | null }).fecha_vencimiento ?? null,
      importeTotal: total,
      importeCobrado: cobrado,
      saldoPendiente: pendiente,
      estadoCobro,
      estado: (p.estado as "pendiente_preparar" | "preparado" | "entregado" | "cancelado") ?? "pendiente_preparar",
      lineas,
    };
  });
}

export async function crearPedido(
  entrada: CrearPedidoEntrada,
): Promise<CrearPedidoRespuesta> {
  // 1. Resolver o dar de alta al cliente
  let clienteId = entrada.clienteId;
  if (entrada.nuevoCliente) {
    const nuevo = await crearCliente(entrada.nuevoCliente);
    clienteId = nuevo.id;
  }

  if (!clienteId) {
    throw new Error("No se pudo determinar el cliente para el pedido.");
  }

  // 2. Validar stock disponible para cada producto
  const productoIds = entrada.lineas.map((l) => l.productoId);
  const { data: lotesData, error: lotesError } = await supabase
    .from("lotes")
    .select("producto_id, cantidad_restante")
    .in("producto_id", productoIds)
    .gt("cantidad_restante", 0);

  if (lotesError) {
    throw new Error(`Error al verificar stock: ${lotesError.message}`);
  }

  const stockDisponiblePorProducto = new Map<string, number>();
  for (const lote of lotesData ?? []) {
    if (!lote.producto_id) continue;
    const actual = stockDisponiblePorProducto.get(lote.producto_id) ?? 0;
    stockDisponiblePorProducto.set(
      lote.producto_id,
      actual + (lote.cantidad_restante ?? 0),
    );
  }

  for (const linea of entrada.lineas) {
    const disponible = stockDisponiblePorProducto.get(linea.productoId) ?? 0;
    if (linea.cantidad > disponible) {
      throw new Error(
        `Stock insuficiente para el producto solicitado. Disponible: ${disponible}, solicitado: ${linea.cantidad}.`,
      );
    }
  }

  // 3. Obtener condición de pago del catálogo
  const { data: condicionData, error: condicionError } = await supabase
    .from("condiciones_pago")
    .select("id, codigo, nombre, tipo, dias_plazo")
    .eq("codigo", entrada.condicionPago)
    .single();

  if (condicionError || !condicionData) {
    throw new Error(`Condición de pago no válida: ${entrada.condicionPago}`);
  }

  // Calcular vencimiento si aplica
  const fechaHoy = new Date();
  const fechaEmisionStr = fechaHoy.toISOString().slice(0, 10);
  let fechaVencimientoStr: string | null = null;
  if (condicionData.tipo === "cuenta_corriente" && condicionData.dias_plazo) {
    const vencimiento = new Date(fechaHoy.getTime());
    vencimiento.setDate(vencimiento.getDate() + condicionData.dias_plazo);
    fechaVencimientoStr = vencimiento.toISOString().slice(0, 10);
  }

  // 4. Obtener porcentaje de comisión vigente
  let porcentajeComision = 10;
  if (entrada.vendidoPorDueno) {
    porcentajeComision = 0;
  } else {
    const { data: comisionData } = await supabase
      .from("configuracion_comisiones")
      .select("porcentaje")
      .order("actualizado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (comisionData?.porcentaje !== undefined) {
      porcentajeComision = Number(comisionData.porcentaje);
    }
  }

  // 5. Correlativo de pedido (numero_pedido)
  const { data: ultimoPedido } = await supabase
    .from("pedidos")
    .select("numero_pedido")
    .not("numero_pedido", "is", null)
    .order("numero_pedido", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ultimoNumero = (ultimoPedido as { numero_pedido?: number | null })?.numero_pedido ?? 1000;
  const nuevoNumeroPedido = ultimoNumero + 1;

  // 6. Calcular total
  const lineasConSubtotal = entrada.lineas.map((l) => ({
    ...l,
    subtotal: l.cantidad * l.precioVentaUnitario,
  }));
  const totalPedido = lineasConSubtotal.reduce((acc, l) => acc + l.subtotal, 0);

  // 7. Insertar pedido
  const { data: pedidoData, error: insertPedidoError } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: clienteId,
      vendedor_id: entrada.vendedorId ?? null,
      vendido_por_dueno: entrada.vendidoPorDueno,
      estado: "pendiente_preparar",
      total: totalPedido,
      numero_pedido: nuevoNumeroPedido,
      fecha_emision: fechaEmisionStr,
      porcentaje_comision_aplicado: porcentajeComision,
      condicion_pago: condicionData.nombre,
      condicion_pago_id: condicionData.id,
      dias_plazo_aplicado: condicionData.dias_plazo,
      fecha_vencimiento: fechaVencimientoStr,
      notas: entrada.notas ?? null,
    } as unknown as { total: number })
    .select("id, numero_pedido")
    .single();

  if (insertPedidoError || !pedidoData) {
    throw new Error(`Error al crear el pedido: ${insertPedidoError?.message}`);
  }

  // 8. Insertar líneas comerciales congeladas
  const filasLineas = lineasConSubtotal.map((l) => ({
    pedido_id: pedidoData.id,
    producto_id: l.productoId,
    cantidad: l.cantidad,
    precio_venta_unitario: l.precioVentaUnitario,
    porcentaje_comision_aplicado: porcentajeComision,
    subtotal: l.subtotal,
  }));

  const { error: insertLineasError } = await supabase
    .from("lineas_pedido")
    .insert(filasLineas);

  if (insertLineasError) {
    throw new Error(
      `Error al guardar líneas de pedido: ${insertLineasError.message}`,
    );
  }

  // 9. Si la condición fue contado, registrar cobranza automática (efectivo o transferencia)
  if (condicionData.codigo === "contado") {
    // Buscar persona admin para registrar la cobranza
    const { data: adminData } = await supabase
      .from("persona")
      .select("id")
      .eq("rol", "admin")
      .limit(1)
      .maybeSingle();

    if (adminData?.id) {
      const medioTexto =
        entrada.medioPagoContado === "transferencia"
          ? "Transferencia"
          : "Efectivo";

      await supabase.from("cobranzas").insert({
        pedido_id: pedidoData.id,
        monto: totalPedido,
        medio_pago: medioTexto,
        observacion: `Cobro contado acreditado por ${medioTexto.toLowerCase()}`,
        estado: "confirmada",
        registrado_por: adminData.id,
      });
    }
  }

  return {
    id: pedidoData.id,
    numeroPedido: (pedidoData as { numero_pedido?: number | null }).numero_pedido ?? nuevoNumeroPedido,
  };
}
