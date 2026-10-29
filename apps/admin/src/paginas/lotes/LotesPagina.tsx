import { Fragment, useState } from "react";
import type {
  LoteDetalle,
  ProductoInventario,
} from "@distribuidora/tipos-compartidos";
import { BuscadorLista, EstadoVacio, Filtros, Paginador } from "../../components";
import { REGISTROS_POR_PAGINA, dinero, fechaVisible } from "../../comun/formato";
import type { Vista } from "../../comun/tipos";
import "./LotesPagina.css";

interface LotesPaginaProps {
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  navegar: (vista: Vista) => void;
}

export function LotesPagina({
  productos,
  lotes,
  navegar,
}: LotesPaginaProps): JSX.Element {
  const [proveedor, setProveedor] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [ordenFecha, setOrdenFecha] = useState<"recientes" | "antiguas">(
    "recientes",
  );
  const [mostrarAgotados, setMostrarAgotados] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  const productosPorId = new Map(
    productos.map((producto) => [producto.id, producto]),
  );

  const lotesPorCodigo = new Map<string, LoteDetalle[]>();
  for (const lote of lotes) {
    const claveCompra = lote.facturaCompraId ?? lote.codigoLote;
    const lineas = lotesPorCodigo.get(claveCompra) ?? [];
    lineas.push(lote);
    lotesPorCodigo.set(claveCompra, lineas);
  }

  const grupos = Array.from(lotesPorCodigo, ([clave, lineas]) => ({
    clave,
    codigo: lineas[0]?.codigoLote ?? clave,
    lineas,
    numeroFactura: lineas[0]?.numeroFactura ?? null,
    proveedor: lineas[0]?.proveedor ?? null,
    recibidoEn: lineas[0]?.recibidoEn ?? "",
    costoTotal: lineas.reduce(
      (total, lote) => total + lote.cantidadOriginal * lote.costoUnitario,
      0,
    ),
    cantidadRestante: lineas.reduce(
      (total, lote) => total + lote.cantidadRestante,
      0,
    ),
  }));

  const proveedores = Array.from(
    new Set(
      grupos
        .map((grupo) => grupo.proveedor)
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort();

  const gruposFiltrados = grupos
    .filter((grupo) => {
      const texto = [
        grupo.codigo,
        grupo.numeroFactura,
        grupo.proveedor,
        ...grupo.lineas.flatMap((linea) => [
          linea.productoSku,
          linea.productoNombre,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return !busqueda.trim() || texto.includes(busqueda.trim().toLowerCase());
    })
    .filter((grupo) => mostrarAgotados || grupo.cantidadRestante > 0)
    .filter((grupo) => !proveedor || grupo.proveedor === proveedor)
    .filter(
      (grupo) => !fechaDesde || grupo.recibidoEn.slice(0, 10) >= fechaDesde,
    )
    .filter(
      (grupo) => !fechaHasta || grupo.recibidoEn.slice(0, 10) <= fechaHasta,
    )
    .sort((a, b) => {
      const diferencia =
        new Date(a.recibidoEn).getTime() - new Date(b.recibidoEn).getTime();
      return ordenFecha === "recientes" ? -diferencia : diferencia;
    });

  const alternar = (codigo: string): void => {
    const siguiente = new Set(abiertos);
    siguiente.has(codigo) ? siguiente.delete(codigo) : siguiente.add(codigo);
    setAbiertos(siguiente);
  };

  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Operaciones / Stock / Lotes</p>
          <h1>Lotes</h1>
          <p className="subtitulo">
            Lotes agrupados por compra. Desplegá cada uno para ver sus
            productos, remanentes y costos.
          </p>
        </div>
        <button
          type="button"
          className="boton boton--primario"
          onClick={() => navegar("compras")}
        >
          ＋ Registrar compra
        </button>
      </div>
      <Filtros
        categorias={[]}
        categoria=""
        onCategoria={() => undefined}
        onBuscar={setBusqueda}
        mostrarCategoria={false}
        placeholder="Buscar lote, factura, proveedor o producto..."
      >
        <label>
          Proveedor
          <BuscadorLista
            opciones={[
              { valor: "", etiqueta: "Todos los proveedores" },
              ...proveedores.map((nombre) => ({
                valor: nombre,
                etiqueta: nombre,
              })),
            ]}
            valor={proveedor}
            onCambiar={setProveedor}
            placeholder="Buscar proveedor..."
          />
        </label>
        <label>
          Fecha desde
          <input
            type="date"
            value={fechaDesde}
            onChange={(evento) => setFechaDesde(evento.target.value)}
          />
        </label>
        <label>
          Fecha hasta
          <input
            type="date"
            value={fechaHasta}
            onChange={(evento) => setFechaHasta(evento.target.value)}
          />
        </label>
        <label>
          Ordenar fecha
          <select
            value={ordenFecha}
            onChange={(evento) =>
              setOrdenFecha(evento.target.value as "recientes" | "antiguas")
            }
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguas">Más antiguas</option>
          </select>
        </label>
        <label className="filtros-lotes__agotados">
          <input
            type="checkbox"
            checked={mostrarAgotados}
            onChange={(evento) => setMostrarAgotados(evento.target.checked)}
          />{" "}
          Mostrar lotes vacíos / agotados
        </label>
      </Filtros>
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>IdLote</th>
              <th>Nombre lote</th>
              <th>Factura</th>
              <th>Proveedor</th>
              <th>Fecha creación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {gruposFiltrados
              .slice(
                (pagina - 1) * REGISTROS_POR_PAGINA,
                pagina * REGISTROS_POR_PAGINA,
              )
              .map((grupo) => {
                const abierto = abiertos.has(grupo.clave);
                const activo = grupo.cantidadRestante > 0;
                return (
                  <Fragment key={grupo.clave}>
                    <tr
                      className={
                        abierto
                          ? "fila-producto fila-producto--abierta"
                          : "fila-producto"
                      }
                    >
                      <td>
                        <button
                          type="button"
                          className="expansor"
                          aria-expanded={abierto}
                          onClick={() => alternar(grupo.clave)}
                        >
                          {abierto ? "⌄" : "›"}
                        </button>{" "}
                        #{grupo.lineas[0]?.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td>{grupo.codigo}</td>
                      <td>{grupo.numeroFactura ?? "—"}</td>
                      <td>{grupo.proveedor ?? "Proveedor sin nombre"}</td>
                      <td>
                        {grupo.recibidoEn
                          ? fechaVisible(grupo.recibidoEn)
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={
                            activo
                              ? "estado estado--activo"
                              : "estado estado--agotado"
                          }
                        >
                          {activo ? "Activo" : "Agotado"}
                        </span>
                      </td>
                    </tr>
                    {abierto &&
                      grupo.lineas.map((lote) => {
                        const producto = productosPorId.get(lote.productoId);
                        const porcentajeRestante =
                          lote.cantidadOriginal > 0
                            ? (lote.cantidadRestante / lote.cantidadOriginal) *
                              100
                            : 0;
                        const colorBarra =
                          porcentajeRestante > 70
                            ? "barra-progreso-verde"
                            : porcentajeRestante > 30
                              ? "barra-progreso-ambar"
                              : "barra-progreso-rojo";
                        return (
                          <tr className="fila-lote" key={lote.id}>
                            <td>↳ {lote.productoSku}</td>
                            <td>
                              <strong>{lote.productoNombre}</strong>
                            </td>
                            <td>—</td>
                            <td>{producto?.categoria ?? "Sin categoría"}</td>
                            <td>
                              <div className="progreso-lote-en-linea">
                                <div
                                  className="barra-progreso-lote"
                                  role="progressbar"
                                  aria-label={`${lote.cantidadRestante} de ${lote.cantidadOriginal} unidades restantes`}
                                  aria-valuemin={0}
                                  aria-valuemax={lote.cantidadOriginal}
                                  aria-valuenow={lote.cantidadRestante}
                                >
                                  <span
                                    className={`barra-progreso-lote-relleno ${colorBarra}`}
                                    style={{ width: `${porcentajeRestante}%` }}
                                  />
                                </div>
                                <strong>
                                  {lote.cantidadRestante} /{" "}
                                  {lote.cantidadOriginal} restantes
                                </strong>
                              </div>
                            </td>
                            <td>
                              {dinero(lote.costoUnitario)} · subtotal{" "}
                              {dinero(
                                lote.cantidadOriginal * lote.costoUnitario,
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {abierto && (
                      <tr className="fila-total" key={`${grupo.clave}-total`}>
                        <td colSpan={5} className="texto-total-lote">
                          Costo total del lote
                        </td>
                        <td>
                          <strong>{dinero(grupo.costoTotal)}</strong>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </table>
        <Paginador
          total={gruposFiltrados.length}
          pagina={pagina}
          onCambiar={setPagina}
        />
        {gruposFiltrados.length === 0 && (
          <EstadoVacio texto="No hay lotes que coincidan con los filtros." />
        )}
      </div>
    </section>
  );
}
