import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type {
  ClienteEntrada,
  ClienteItem,
  PedidoHistorialItem,
} from "@distribuidora/tipos-compartidos";
import { BuscadorLista, EstadoVacio, Paginador } from "../../components";
import { REGISTROS_POR_PAGINA, dinero } from "../../comun/formato";
import "./ClientesPagina.css";

interface ClientesPaginaProps {
  clientes: ClienteItem[];
  pedidos: PedidoHistorialItem[];
  guardando: boolean;
  onCrearCliente: (entrada: ClienteEntrada) => Promise<void>;
}

export function ClientesPagina({
  clientes,
  pedidos,
  guardando,
  onCrearCliente,
}: ClientesPaginaProps): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"pedidos_desc" | "pedidos_asc" | "nombre">(
    "nombre",
  );
  const [pagina, setPagina] = useState(1);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<
    string | null
  >(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Formulario nuevo cliente
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoCliente, setTipoCliente] = useState<"minorista" | "mayorista">(
    "minorista",
  );
  const [notas, setNotas] = useState("");

  const clientesFiltrados = useMemo(() => {
    let lista = clientes;
    const texto = busqueda.trim().toLowerCase();
    if (texto) {
      lista = lista.filter(
        (c) =>
          c.nombre.toLowerCase().includes(texto) ||
          (c.codigoCliente && c.codigoCliente.toLowerCase().includes(texto)) ||
          (c.direccion && c.direccion.toLowerCase().includes(texto)),
      );
    }
    return [...lista].sort((a, b) => {
      if (orden === "pedidos_desc") return b.cantidadPedidos - a.cantidadPedidos;
      if (orden === "pedidos_asc") return a.cantidadPedidos - b.cantidadPedidos;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [clientes, busqueda, orden]);

  const total = clientesFiltrados.length;
  const clientesPaginados = useMemo(() => {
    const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
    return clientesFiltrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [clientesFiltrados, pagina]);

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => c.id === clienteSeleccionadoId) ?? null,
    [clientes, clienteSeleccionadoId],
  );

  const pedidosCliente = useMemo(() => {
    if (!clienteSeleccionadoId) return [];
    return pedidos.filter((p) => p.clienteId === clienteSeleccionadoId);
  }, [pedidos, clienteSeleccionadoId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!nombre.trim()) return;
    await onCrearCliente({
      nombre: nombre.trim(),
      direccion: direccion.trim() || null,
      telefono: telefono.trim() || null,
      tipoCliente,
      notas: notas.trim() || null,
    });
    setNombre("");
    setDireccion("");
    setTelefono("");
    setNotas("");
    setModalAbierto(false);
  };

  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Personas / Clientes</p>
          <h1>Clientes</h1>
          <p className="subtitulo">
            Listado de clientes comerciales, historial de compras y estado de deuda.
          </p>
        </div>
        <button
          type="button"
          className="boton boton--primario"
          onClick={() => setModalAbierto(true)}
        >
          ＋ Cargar cliente
        </button>
      </div>

      <div className="barra-filtros">
        <label className="buscador">
          <span>🔍</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nombre, código o dirección…"
          />
        </label>
        <label>
          <span>Ordenar</span>
          <select
            value={orden}
            onChange={(e) =>
              setOrden(
                e.target.value as "pedidos_desc" | "pedidos_asc" | "nombre",
              )
            }
          >
            <option value="nombre">Por nombre (A-Z)</option>
            <option value="pedidos_desc">Más pedidos</option>
            <option value="pedidos_asc">Menos pedidos</option>
          </select>
        </label>
      </div>

      <div className="tabla-contenedor">
        {total === 0 ? (
          <EstadoVacio texto="No se encontraron clientes registrados." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>CodCliente</th>
                <th>Nombre / razón social</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Tipo</th>
                <th style={{ textAlign: "right" }}>Cant. pedidos</th>
                <th style={{ textAlign: "right" }}>Saldo cta. cte.</th>
                <th style={{ textAlign: "right" }}>Total comprado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientesPaginados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <strong>{cliente.codigoCliente ?? "—"}</strong>
                  </td>
                  <td>
                    <strong>{cliente.nombre}</strong>
                  </td>
                  <td>{cliente.direccion ?? "—"}</td>
                  <td>{cliente.telefono ?? "—"}</td>
                  <td>
                    <span className="badge badge-gris">
                      {cliente.tipoCliente}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{cliente.cantidadPedidos}</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span
                      className={
                        cliente.saldoPendiente > 0
                          ? "badge badge-rojo"
                          : "badge badge-verde"
                      }
                    >
                      {dinero(cliente.saldoPendiente)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {dinero(cliente.totalComprado)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="enlace"
                      onClick={() =>
                        setClienteSeleccionadoId(
                          clienteSeleccionadoId === cliente.id
                            ? null
                            : cliente.id,
                        )
                      }
                    >
                      {clienteSeleccionadoId === cliente.id
                        ? "Ocultar detalle"
                        : "Ver detalle"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Paginador total={total} pagina={pagina} onCambiar={setPagina} />

      {/* Detalle del cliente seleccionado */}
      {clienteSeleccionado && (
        <section className="panel detalle-cliente-tarjeta">
          <div className="panel__encabezado">
            <div>
              <p className="eyebrow">Detalle del cliente</p>
              <h2>
                {clienteSeleccionado.nombre} ·{" "}
                {clienteSeleccionado.codigoCliente ?? "Sin código"}
              </h2>
            </div>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => setClienteSeleccionadoId(null)}
            >
              Cerrar detalle
            </button>
          </div>

          <div className="datos-cliente-grid">
            <p>
              <span>Nombre / razón social</span>
              <strong>{clienteSeleccionado.nombre}</strong>
            </p>
            <p>
              <span>Dirección</span>
              <strong>{clienteSeleccionado.direccion ?? "No especificada"}</strong>
            </p>
            <p>
              <span>Teléfono</span>
              <strong>{clienteSeleccionado.telefono ?? "No registrado"}</strong>
            </p>
            <p>
              <span>Saldo pendiente de cobro</span>
              <strong
                style={{
                  color:
                    clienteSeleccionado.saldoPendiente > 0
                      ? "#b91c1c"
                      : "#176b43",
                }}
              >
                {dinero(clienteSeleccionado.saldoPendiente)}
              </strong>
            </p>
          </div>

          <h3>Historial de pedidos del cliente</h3>
          {pedidosCliente.length === 0 ? (
            <p className="dato-secundario">
              Este cliente aún no registra pedidos completados.
            </p>
          ) : (
            <div className="tabla-contenedor" style={{ marginTop: "12px" }}>
              <table>
                <thead>
                  <tr>
                    <th>IdPedido</th>
                    <th>Fecha</th>
                    <th>Condición de pago</th>
                    <th>Estado de cobro</th>
                    <th>Estado de entrega</th>
                    <th style={{ textAlign: "right" }}>Importe total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosCliente.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>
                          #PED-{p.numeroPedido ? String(p.numeroPedido).padStart(4, "0") : "—"}
                        </strong>
                      </td>
                      <td>{p.fechaEmision}</td>
                      <td>{p.condicionPago}</td>
                      <td>
                        <span
                          className={
                            p.estadoCobro === "cobrado_totalmente"
                              ? "badge badge-verde"
                              : p.estadoCobro === "cobrado_parcialmente"
                                ? "badge badge-amarillo"
                                : "badge badge-rojo"
                          }
                        >
                          {p.estadoCobro === "cobrado_totalmente"
                            ? "Cobrado totalmente"
                            : p.estadoCobro === "cobrado_parcialmente"
                              ? "Cobrado parcialmente"
                              : "Sin cobrar"}
                        </span>
                      </td>
                      <td>
                        <span className="estado estado--activo">
                          {p.estado.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <strong>{dinero(p.importeTotal)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Modal para crear cliente */}
      {modalAbierto && (
        <div
          className="modal-fondo"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !guardando) {
              setModalAbierto(false);
            }
          }}
        >
          <section
            className="modal-tarjeta modal-cliente"
            role="dialog"
            aria-modal="true"
          >
            <button
              className="modal-cerrar"
              disabled={guardando}
              onClick={() => setModalAbierto(false)}
            >
              ×
            </button>
            <p className="eyebrow">Personas / Formulario</p>
            <h2>Cargar nuevo cliente</h2>
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="campos-grid" style={{ gridTemplateColumns: "1fr" }}>
                <label>
                  <span>Nombre / Razón social *</span>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    placeholder="Ej. Almacén Don José"
                  />
                </label>
                <label>
                  <span>Dirección</span>
                  <input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej. Av. San Martín 1240"
                  />
                </label>
                <label>
                  <span>Teléfono</span>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 11 15 4432 1098"
                  />
                </label>
                <label>
                  <span>Tipo de cliente</span>
                  <select
                    value={tipoCliente}
                    onChange={(e) =>
                      setTipoCliente(e.target.value as "minorista" | "mayorista")
                    }
                  >
                    <option value="minorista">Minorista</option>
                    <option value="mayorista">Mayorista</option>
                  </select>
                </label>
                <label>
                  <span>Notas / Observaciones</span>
                  <input
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Horarios de entrega, preferencias, etc."
                  />
                </label>
              </div>
              <div className="formulario-acciones">
                <button
                  type="button"
                  className="boton boton--secundario"
                  disabled={guardando}
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="boton boton--primario"
                  disabled={!nombre.trim() || guardando}
                >
                  {guardando ? "Guardando…" : "Guardar cliente"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
