import { supabase } from "../lib/supabase";
import type {
  ClienteEntrada,
  ClienteItem,
  CrearClienteRespuesta,
} from "@distribuidora/tipos-compartidos";

export async function listarClientes(): Promise<ClienteItem[]> {
  // Obtenemos clientes
  const { data: clientesData, error: clientesError } = await supabase
    .from("clientes")
    .select("id, nombre, direccion, telefono, tipo_cliente, codigo_cliente, creado_en")
    .order("nombre", { ascending: true });

  if (clientesError) {
    throw new Error(`Error al obtener clientes: ${clientesError.message}`);
  }

  // Obtenemos pedidos para calcular totales por cliente
  const { data: pedidosData, error: pedidosError } = await supabase
    .from("pedidos")
    .select("id, cliente_id, total, estado");

  if (pedidosError) {
    throw new Error(`Error al obtener pedidos de clientes: ${pedidosError.message}`);
  }

  // Obtenemos cobranzas confirmadas para calcular saldos
  const { data: cobranzasData, error: cobranzasError } = await supabase
    .from("cobranzas")
    .select("pedido_id, monto, estado")
    .eq("estado", "confirmada");

  if (cobranzasError) {
    throw new Error(`Error al obtener cobranzas: ${cobranzasError.message}`);
  }

  const cobranzasPorPedido = new Map<string, number>();
  for (const c of cobranzasData ?? []) {
    const actual = cobranzasPorPedido.get(c.pedido_id) ?? 0;
    cobranzasPorPedido.set(c.pedido_id, actual + Number(c.monto));
  }

  const metricasPorCliente = new Map<
    string,
    { cantidadPedidos: number; totalComprado: number; saldoPendiente: number }
  >();

  for (const p of pedidosData ?? []) {
    if (!p.cliente_id || p.estado === "cancelado") continue;
    const actual = metricasPorCliente.get(p.cliente_id) ?? {
      cantidadPedidos: 0,
      totalComprado: 0,
      saldoPendiente: 0,
    };
    const totalPedido = Number(p.total ?? 0);
    const pagadoPedido = cobranzasPorPedido.get(p.id) ?? 0;
    const pendiente = Math.max(0, totalPedido - pagadoPedido);

    actual.cantidadPedidos += 1;
    actual.totalComprado += totalPedido;
    actual.saldoPendiente += pendiente;
    metricasPorCliente.set(p.cliente_id, actual);
  }

  return (clientesData ?? []).map((cliente) => {
    const metricas = metricasPorCliente.get(cliente.id) ?? {
      cantidadPedidos: 0,
      totalComprado: 0,
      saldoPendiente: 0,
    };
    return {
      id: cliente.id,
      codigoCliente: (cliente as { codigo_cliente?: string | null }).codigo_cliente ?? null,
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      tipoCliente: cliente.tipo_cliente ?? "minorista",
      cantidadPedidos: metricas.cantidadPedidos,
      saldoPendiente: metricas.saldoPendiente,
      totalComprado: metricas.totalComprado,
      creadoEn: (cliente as { creado_en?: string | null }).creado_en ?? null,
    };
  });
}

export async function crearCliente(
  entrada: ClienteEntrada,
): Promise<CrearClienteRespuesta> {
  let codigo = entrada.codigoCliente;

  if (!codigo) {
    // Generamos el siguiente código CLI-XXX
    const { data: ultimosClientes } = await supabase
      .from("clientes")
      .select("codigo_cliente")
      .not("codigo_cliente", "is", null)
      .order("creado_en", { ascending: false })
      .limit(20);

    let maxNumero = 0;
    for (const c of ultimosClientes ?? []) {
      const codigoRaw = (c as { codigo_cliente?: string | null }).codigo_cliente;
      if (codigoRaw) {
        const match = codigoRaw.match(/CLI-(\d+)/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNumero) maxNumero = num;
        }
      }
    }
    codigo = `CLI-${String(maxNumero + 1).padStart(3, "0")}`;
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nombre: entrada.nombre,
      direccion: entrada.direccion ?? null,
      telefono: entrada.telefono ?? null,
      tipo_cliente: entrada.tipoCliente ?? "minorista",
      notas: entrada.notas ?? null,
      codigo_cliente: codigo,
    } as unknown as { nombre: string })
    .select("id, codigo_cliente")
    .single();

  if (error) {
    throw new Error(`Error al registrar el cliente: ${error.message}`);
  }

  return {
    id: data.id,
    codigoCliente: (data as { codigo_cliente?: string | null }).codigo_cliente ?? codigo,
  };
}
