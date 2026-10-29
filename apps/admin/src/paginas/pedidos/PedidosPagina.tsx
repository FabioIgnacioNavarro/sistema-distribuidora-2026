import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type {
  ClienteItem,
  CondicionPagoPedido,
  CrearPedidoEntrada,
  MedioAcreditacionPago,
  PedidoHistorialItem,
  ProductoInventario,
} from "@distribuidora/tipos-compartidos";
import { BuscadorLista, EstadoVacio, Paginador } from "../../components";
import { REGISTROS_POR_PAGINA, dinero } from "../../comun/formato";
import type { Vista } from "../../comun/tipos";
import "./PedidosPagina.css";

function formatearCondicionPago(condicion: string): string {
  switch (condicion) {
    case "contado":
    case "Contado":
      return "Contado (todo de una)";
    case "cuenta_corriente_7":
    case "Cuenta corriente · 7 días":
      return "Cuenta corriente · 7 días";
    case "cuenta_corriente_14":
    case "Cuenta corriente · 14 días":
      return "Cuenta corriente · 14 días";
    case "cuenta_corriente_30":
    case "Cuenta corriente · 30 días":
      return "Cuenta corriente · 30 días";
    default:
      return condicion;
  }
}

interface PedidosPaginaProps {
  pedidos: PedidoHistorialItem[];
  productos: ProductoInventario[];
  clientes: ClienteItem[];
  guardando: boolean;
  onCrearPedido: (entrada: CrearPedidoEntrada) => Promise<void>;
  navegar: (vista: Vista) => void;
}

interface LineaFormulario {
  productoId: string;
  cantidad: number;
  precioVentaUnitario: number;
}

export function PedidosPagina({
  pedidos,
  productos,
  clientes,
  guardando,
  onCrearPedido,
  navegar,
}: PedidosPaginaProps): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [filtroCobro, setFiltroCobro] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState<string | null>(
    null,
  );
  const [modalAbierto, setModalAbierto] = useState(false);

  // Formulario nuevo pedido
  const [esNuevoCliente, setEsNuevoCliente] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [condicionPago, setCondicionPago] =
    useState<CondicionPagoPedido>("contado");
  const [medioPagoContado, setMedioPagoContado] =
    useState<MedioAcreditacionPago>("efectivo");
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaFormulario[]>([
    { productoId: "", cantidad: 1, precioVentaUnitario: 0 },
  ]);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  // Opciones para buscador de clientes
  const opcionesClientes = useMemo(
    () =>
      clientes.map((c) => ({
        valor: c.id,
        etiqueta: `${c.nombre} (${c.codigoCliente ?? "Sin código"}) - ${c.direccion ?? "Sin dirección"}`,
      })),
    [clientes],
  );

  // Filtros
  const pedidosFiltrados = useMemo(() => {
    let lista = pedidos;
    const texto = busqueda.trim().toLowerCase();
    if (texto) {
      lista = lista.filter(
        (p) =>
          p.clienteNombre.toLowerCase().includes(texto) ||
          (p.clienteDireccion &&
            p.clienteDireccion.toLowerCase().includes(texto)) ||
          (p.numeroPedido && String(p.numeroPedido).includes(texto)),
      );
    }
    if (filtroCobro !== "todos") {
      lista = lista.filter((p) => p.estadoCobro === filtroCobro);
    }
    return lista;
  }, [pedidos, busqueda, filtroCobro]);

  const total = pedidosFiltrados.length;
  const pedidosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
    return pedidosFiltrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [pedidosFiltrados, pagina]);

  const pedidoSeleccionado = useMemo(
    () => pedidos.find((p) => p.id === pedidoSeleccionadoId) ?? null,
    [pedidos, pedidoSeleccionadoId],
  );

  const totalBorrador = useMemo(
    () =>
      lineas.reduce(
        (acc, l) => acc + (l.cantidad > 0 ? l.cantidad * l.precioVentaUnitario : 0),
        0,
      ),
    [lineas],
  );

  const agregarLinea = (): void => {
    setLineas((prev) => [
      ...prev,
      { productoId: "", cantidad: 1, precioVentaUnitario: 0 },
    ]);
  };

  const eliminarLinea = (indice: number): void => {
    if (lineas.length === 1) return;
    setLineas((prev) => prev.filter((_, i) => i !== indice));
  };

  const cambiarProductoLinea = (indice: number, prodId: string): void => {
    const prod = productos.find((p) => p.id === prodId);
    setLineas((prev) =>
      prev.map((l, i) =>
        i === indice
          ? {
              ...l,
              productoId: prodId,
              precioVentaUnitario: prod ? prod.precioVenta : 0,
            }
          : l,
      ),
    );
  };

  const cambiarCantidadLinea = (indice: number, cant: number): void => {
    setLineas((prev) =>
      prev.map((l, i) => (i === indice ? { ...l, cantidad: cant } : l)),
    );
  };

  const cambiarPrecioLinea = (indice: number, precio: number): void => {
    setLineas((prev) =>
      prev.map((l, i) =>
        i === indice ? { ...l, precioVentaUnitario: precio } : l,
      ),
    );
  };

  const handleCrearPedido = async (
    e: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setErrorFormulario(null);

    // Validar cliente
    if (!esNuevoCliente && !clienteId) {
      setErrorFormulario("Seleccioná un cliente existente.");
      return;
    }
    if (esNuevoCliente && !nuevoNombre.trim()) {
      setErrorFormulario("Ingresá el nombre del nuevo cliente.");
      return;
    }

    // Validar líneas
    const lineasValidas = lineas.filter(
      (l) => l.productoId && l.cantidad > 0 && l.precioVentaUnitario >= 0,
    );
    if (lineasValidas.length === 0) {
      setErrorFormulario(
        "El pedido debe contener al menos un producto con cantidad válida.",
      );
      return;
    }

    // Validar stock disponible
    for (const l of lineasValidas) {
      const prod = productos.find((p) => p.id === l.productoId);
      if (prod && l.cantidad > prod.stockTotal) {
        setErrorFormulario(
          `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stockTotal}, solicitado: ${l.cantidad}.`,
        );
        return;
      }
    }

    try {
      await onCrearPedido({
        clienteId: esNuevoCliente ? null : clienteId,
        nuevoCliente: esNuevoCliente
          ? {
              nombre: nuevoNombre.trim(),
              direccion: nuevaDireccion.trim() || null,
              telefono: nuevoTelefono.trim() || null,
              tipoCliente: "minorista",
            }
          : null,
        vendidoPorDueno: true,
        condicionPago,
        medioPagoContado:
          condicionPago === "contado" ? medioPagoContado : undefined,
        notas: notas.trim() || null,
        lineas: lineasValidas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precioVentaUnitario: l.precioVentaUnitario,
        })),
      });

      // Reset
      setEsNuevoCliente(false);
      setClienteId("");
      setNuevoNombre("");
      setNuevaDireccion("");
      setNuevoTelefono("");
      setCondicionPago("contado");
      setMedioPagoContado("efectivo");
      setNotas("");
      setLineas([{ productoId: "", cantidad: 1, precioVentaUnitario: 0 }]);
      setModalAbierto(false);
    } catch (err) {
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al registrar pedido.",
      );
    }
  };

  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Operaciones / Pedidos</p>
          <h1>Pedidos</h1>
          <p className="subtitulo">
            Control de pedidos comerciales, estado de cobranzas y seguimiento de entregas.
          </p>
        </div>
        <button
          type="button"
          className="boton boton--primario"
          onClick={() => setModalAbierto(true)}
        >
          ＋ Registrar pedido
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
            placeholder="Buscar por cliente, dirección o N° pedido…"
          />
        </label>
        <label>
          <span>Estado de cobro</span>
          <select
            value={filtroCobro}
            onChange={(e) => {
              setFiltroCobro(e.target.value);
              setPagina(1);
            }}
          >
            <option value="todos">Todos los estados</option>
            <option value="sin_cobrar">Sin cobrar</option>
            <option value="cobrado_parcialmente">Cobrado parcialmente</option>
            <option value="cobrado_totalmente">Cobrado totalmente</option>
          </select>
        </label>
      </div>

      <div className="tabla-contenedor">
        {total === 0 ? (
          <EstadoVacio texto="No se registraron pedidos aún." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>IdPedido</th>
                <th>Fecha</th>
                <th>Cliente / Dirección</th>
                <th>Condición pago</th>
                <th>Vencimiento</th>
                <th style={{ textAlign: "right" }}>Importe total</th>
                <th style={{ textAlign: "right" }}>Importe cobrado</th>
                <th style={{ textAlign: "right" }}>Saldo pendiente</th>
                <th>Estado de cobro</th>
                <th>Estado pedido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidosPaginados.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>
                      #PED-
                      {p.numeroPedido
                        ? String(p.numeroPedido).padStart(4, "0")
                        : "—"}
                    </strong>
                  </td>
                  <td>{p.fechaEmision}</td>
                  <td>
                    <strong>{p.clienteNombre}</strong>
                    {p.clienteDireccion && (
                      <small className="celda-secundaria">
                        {p.clienteDireccion}
                      </small>
                    )}
                  </td>
                  <td>{formatearCondicionPago(p.condicionPago)}</td>
                  <td>{p.fechaVencimiento ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{dinero(p.importeTotal)}</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {dinero(p.importeCobrado)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span
                      className={
                        p.saldoPendiente > 0
                          ? "badge badge-rojo"
                          : "badge badge-verde"
                      }
                    >
                      {dinero(p.saldoPendiente)}
                    </span>
                  </td>
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
                    <button
                      type="button"
                      className="enlace"
                      onClick={() =>
                        setPedidoSeleccionadoId(
                          pedidoSeleccionadoId === p.id ? null : p.id,
                        )
                      }
                    >
                      {pedidoSeleccionadoId === p.id
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

      {/* Detalle del pedido */}
      {pedidoSeleccionado && (
        <section className="panel detalle-pedido-tarjeta">
          <div className="panel__encabezado">
            <div>
              <p className="eyebrow">Detalle del pedido / remito</p>
              <h2>
                #PED-
                {pedidoSeleccionado.numeroPedido
                  ? String(pedidoSeleccionado.numeroPedido).padStart(4, "0")
                  : "—"}{" "}
                · {pedidoSeleccionado.clienteNombre}
              </h2>
            </div>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => setPedidoSeleccionadoId(null)}
            >
              Cerrar detalle
            </button>
          </div>

          <div className="resumen-cobro-grid">
            <p>
              <span>Condición de pago</span>
              <strong>{formatearCondicionPago(pedidoSeleccionado.condicionPago)}</strong>
            </p>
            <p>
              <span>Importe total</span>
              <strong>{dinero(pedidoSeleccionado.importeTotal)}</strong>
            </p>
            <p>
              <span>Importe cobrado</span>
              <strong style={{ color: "#176b43" }}>
                {dinero(pedidoSeleccionado.importeCobrado)}
              </strong>
            </p>
            <p>
              <span>Saldo pendiente</span>
              <strong
                style={{
                  color:
                    pedidoSeleccionado.saldoPendiente > 0
                      ? "#b91c1c"
                      : "#176b43",
                }}
              >
                {dinero(pedidoSeleccionado.saldoPendiente)}
              </strong>
            </p>
          </div>

          <h3>Productos del pedido</h3>
          <div className="tabla-contenedor" style={{ marginTop: "12px" }}>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: "right" }}>Cantidad</th>
                  <th style={{ textAlign: "right" }}>Precio venta congelado</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedidoSeleccionado.lineas.map((linea) => (
                  <tr key={linea.id}>
                    <td>
                      <strong>{linea.productoNombre}</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{linea.cantidad}</td>
                    <td style={{ textAlign: "right" }}>
                      {dinero(linea.precioVentaUnitario)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <strong>{dinero(linea.subtotal)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Registrar Pedido */}
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
            className="modal-tarjeta modal-pedido"
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
            <p className="eyebrow">Operaciones / Venta</p>
            <h2>Registrar nuevo pedido</h2>

            {errorFormulario && (
              <div className="aviso-error" style={{ margin: "14px 0" }}>
                <span>{errorFormulario}</span>
              </div>
            )}

            <form onSubmit={(e) => void handleCrearPedido(e)}>
              {/* Selección / creación de cliente */}
              <div className="selector-tipo-cliente">
                <label>
                  <input
                    type="radio"
                    name="tipoClienteRadio"
                    checked={!esNuevoCliente}
                    onChange={() => setEsNuevoCliente(false)}
                  />
                  Cliente existente
                </label>
                <label>
                  <input
                    type="radio"
                    name="tipoClienteRadio"
                    checked={esNuevoCliente}
                    onChange={() => setEsNuevoCliente(true)}
                  />
                  Nuevo cliente (en este pedido)
                </label>
              </div>

              {!esNuevoCliente ? (
                <div style={{ marginBottom: "18px" }}>
                  <label className="menu__grupo" style={{ margin: "0 0 6px 0" }}>
                    Seleccionar cliente
                  </label>
                  <BuscadorLista
                    opciones={opcionesClientes}
                    valor={clienteId}
                    onCambiar={setClienteId}
                    placeholder="Escribí para buscar cliente por nombre o código…"
                  />
                </div>
              ) : (
                <div className="campos-grid" style={{ marginBottom: "18px" }}>
                  <label>
                    <span>Nombre / Razón social *</span>
                    <input
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Ej. Autoservicio La Unión"
                      required
                    />
                  </label>
                  <label>
                    <span>Dirección</span>
                    <input
                      value={nuevaDireccion}
                      onChange={(e) => setNuevaDireccion(e.target.value)}
                      placeholder="Ej. Rivadavia 1560"
                    />
                  </label>
                  <label>
                    <span>Teléfono</span>
                    <input
                      value={nuevoTelefono}
                      onChange={(e) => setNuevoTelefono(e.target.value)}
                      placeholder="Ej. 11 15 7004 2811"
                    />
                  </label>
                </div>
              )}

              {/* Condición de pago, medio de acreditación y notas */}
              <div
                className="campos-grid"
                style={{
                  gridTemplateColumns:
                    condicionPago === "contado" ? "1fr 1fr 1fr" : "1fr 1fr",
                }}
              >
                <label>
                  <span>Condición de pago</span>
                  <select
                    value={condicionPago}
                    onChange={(e) =>
                      setCondicionPago(
                        e.target.value as CondicionPagoPedido,
                      )
                    }
                  >
                    <option value="contado">Contado (todo de una)</option>
                    <option value="cuenta_corriente_7">
                      Cuenta corriente · 7 días
                    </option>
                    <option value="cuenta_corriente_14">
                      Cuenta corriente · 14 días
                    </option>
                    <option value="cuenta_corriente_30">
                      Cuenta corriente · 30 días
                    </option>
                  </select>
                </label>
                {condicionPago === "contado" && (
                  <label>
                    <span>Medio de acreditación</span>
                    <select
                      value={medioPagoContado}
                      onChange={(e) =>
                        setMedioPagoContado(
                          e.target.value as MedioAcreditacionPago,
                        )
                      }
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">
                        Transferencia bancaria
                      </option>
                    </select>
                  </label>
                )}
                <label>
                  <span>Notas del pedido</span>
                  <input
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Observaciones de entrega…"
                  />
                </label>
              </div>

              {/* Líneas de productos */}
              <div className="seccion-lineas-pedido">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Productos solicitados</h3>
                  <button
                    type="button"
                    className="boton boton--secundario"
                    style={{ padding: "6px 12px" }}
                    onClick={agregarLinea}
                  >
                    ＋ Agregar producto
                  </button>
                </div>

                <div className="tabla-contenedor" style={{ marginTop: "10px" }}>
                  <table className="tabla-lineas-pedido">
                    <thead>
                      <tr>
                        <th style={{ width: "40%" }}>Producto (Stock disp.)</th>
                        <th style={{ width: "15%" }}>Cantidad</th>
                        <th style={{ width: "20%" }}>Precio venta unit.</th>
                        <th style={{ width: "15%", textAlign: "right" }}>
                          Subtotal
                        </th>
                        <th style={{ width: "10%" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineas.map((linea, index) => {
                        const prod = productos.find(
                          (p) => p.id === linea.productoId,
                        );
                        const subtotalLinea =
                          linea.cantidad > 0
                            ? linea.cantidad * linea.precioVentaUnitario
                            : 0;

                        return (
                          <tr key={index}>
                            <td>
                              <select
                                style={{
                                  width: "100%",
                                  minHeight: "38px",
                                  padding: "6px 8px",
                                }}
                                value={linea.productoId}
                                onChange={(e) =>
                                  cambiarProductoLinea(index, e.target.value)
                                }
                                required
                              >
                                <option value="">Seleccioná un producto…</option>
                                {productos.map((p) => (
                                  <option
                                    key={p.id}
                                    value={p.id}
                                    disabled={p.stockTotal <= 0}
                                  >
                                    {p.nombre} ({p.sku}) — Disp: {p.stockTotal}{" "}
                                    {p.stockTotal <= 0 ? "(Sin stock)" : ""}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                max={prod ? prod.stockTotal : 99999}
                                value={linea.cantidad}
                                onChange={(e) =>
                                  cambiarCantidadLinea(
                                    index,
                                    parseInt(e.target.value, 10) || 0,
                                  )
                                }
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="any"
                                min={0}
                                value={linea.precioVentaUnitario}
                                onChange={(e) =>
                                  cambiarPrecioLinea(
                                    index,
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                required
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <strong>{dinero(subtotalLinea)}</strong>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {lineas.length > 1 && (
                                <button
                                  type="button"
                                  className="boton-icono"
                                  style={{ width: "28px", height: "28px" }}
                                  onClick={() => eliminarLinea(index)}
                                  title="Eliminar producto"
                                >
                                  ×
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                className="formulario-acciones"
                style={{ marginTop: "24px" }}
              >
                <div style={{ marginRight: "auto" }}>
                  <span style={{ fontSize: "12px", color: "#65736a" }}>
                    Total del pedido:
                  </span>{" "}
                  <strong style={{ fontSize: "18px", color: "#176b43" }}>
                    {dinero(totalBorrador)}
                  </strong>
                </div>
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
                  disabled={guardando || totalBorrador <= 0}
                >
                  {guardando ? "Emitiendo pedido…" : "Emitir pedido"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
