import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type {
  CompraHistorial,
  CrearProductoEntrada,
  LoteDetalle,
  ProductoInventario,
  RegistrarCompraEntrada,
} from "@distribuidora/tipos-compartidos";
import {
  crearCompra,
  crearProducto,
  obtenerCompras,
  obtenerLotes,
  obtenerProductos,
  obtenerEstadoReinicio,
  reiniciarDatosOperativos,
} from "./repositorios/api.repositorio";

type Vista =
  | "inicio"
  | "precios"
  | "productos"
  | "lotes"
  | "compras"
  | "historialCompras"
  | "clientes";
interface LineaCompraFormulario {
  productoId: string | null;
  nuevoProducto: { sku: string; nombre: string; categoria: string } | null;
  cantidad: number;
  costoUnitario: number;
  fechaVencimiento: string;
}

const dinero = (valor: number): string =>
  valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
const porcentaje = (valor: number): string =>
  `${valor.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
const fechaVisible = (valor: string): string =>
  new Date(`${valor.slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR");
const fechaHoy = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

export default function App(): JSX.Element {
  const [vista, setVista] = useState<Vista>("inicio");
  const [oscuro, setOscuro] = useState(false);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [lotes, setLotes] = useState<LoteDetalle[]>([]);
  const [compras, setCompras] = useState<CompraHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lotesAbiertos, setLotesAbiertos] = useState<Set<string>>(new Set());
  const [reinicioHabilitado, setReinicioHabilitado] = useState(false);
  const [modalReinicio, setModalReinicio] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [reiniciando, setReiniciando] = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [creandoProducto, setCreandoProducto] = useState(false);

  const cargarDatos = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const [productosRecibidos, lotesRecibidos, comprasRecibidas] =
        await Promise.all([
          obtenerProductos(),
          obtenerLotes(),
          obtenerCompras(),
        ]);
      setProductos(productosRecibidos);
      setLotes(lotesRecibidos);
      setCompras(comprasRecibidas);
    } catch (errorCarga) {
      setError(
        errorCarga instanceof Error
          ? errorCarga.message
          : "No se pudieron cargar los datos.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
    void obtenerEstadoReinicio()
      .then(setReinicioHabilitado)
      .catch(() => setReinicioHabilitado(false));
  }, [cargarDatos]);

  const confirmarReinicio = async (
    evento: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    evento.preventDefault();
    setReiniciando(true);
    setError(null);
    try {
      await reiniciarDatosOperativos({ confirmacion });
      setModalReinicio(false);
      setConfirmacion("");
      await cargarDatos();
    } catch (errorReinicio) {
      setError(
        errorReinicio instanceof Error
          ? errorReinicio.message
          : "No se pudo reiniciar la información.",
      );
    } finally {
      setReiniciando(false);
    }
  };

  const guardarFactura = async (
    entrada: RegistrarCompraEntrada,
  ): Promise<void> => {
    setGuardando(true);
    setError(null);
    try {
      await crearCompra(entrada);
      await cargarDatos();
      setVista("historialCompras");
    } catch (errorGuardado) {
      setError(
        errorGuardado instanceof Error
          ? errorGuardado.message
          : "No se pudo guardar la compra.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const guardarProducto = async (
    entrada: CrearProductoEntrada,
  ): Promise<void> => {
    setCreandoProducto(true);
    setError(null);
    try {
      await crearProducto(entrada);
      setModalProducto(false);
      await cargarDatos();
    } catch (errorCreacion) {
      setError(
        errorCreacion instanceof Error
          ? errorCreacion.message
          : "No se pudo crear el producto.",
      );
    } finally {
      setCreandoProducto(false);
    }
  };

  const navegar = (nuevaVista: Vista): void => {
    setVista(nuevaVista);
    setError(null);
  };
  const categorias = useMemo(
    () =>
      Array.from(
        new Set(productos.map((producto) => producto.categoria)),
      ).sort(),
    [productos],
  );

  return (
    <div className={oscuro ? "app app--oscura" : "app"}>
      <aside className="barra-lateral">
        <div className="marca">
          <span className="marca__simbolo">F</span>
          <span>
            FONTANA
            <br />
            <small>DISTRIBUCIONES</small>
          </span>
        </div>
        <div className="perfil">
          <span>
            <strong>Modo local</strong>
            <small>Sin sesión autenticada</small>
          </span>
        </div>
        <nav className="menu">
          <BotonMenu
            activo={vista === "inicio"}
            onClick={() => navegar("inicio")}
            icono="⌂"
          >
            Panel de inicio
          </BotonMenu>
          <p className="menu__grupo">Operaciones</p>
          <BotonMenu
            activo={vista === "precios"}
            onClick={() => navegar("precios")}
            icono="$"
          >
            Lista de precios
          </BotonMenu>
          <BotonMenu
            activo={vista === "productos"}
            onClick={() => navegar("productos")}
            icono="▥"
          >
            Stock de productos
          </BotonMenu>
          <BotonMenu
            activo={vista === "lotes"}
            onClick={() => navegar("lotes")}
            icono="◫"
          >
            Lotes
          </BotonMenu>
          <BotonMenu
            activo={vista === "compras"}
            onClick={() => navegar("compras")}
            icono="＋"
          >
            Registrar compra
          </BotonMenu>
          <BotonMenu
            activo={vista === "historialCompras"}
            onClick={() => navegar("historialCompras")}
            icono="▤"
          >
            Historial de compras
          </BotonMenu>
          <p className="menu__grupo">Personas</p>
          <BotonMenu
            activo={vista === "clientes"}
            onClick={() => navegar("clientes")}
            icono="♧"
          >
            Clientes
          </BotonMenu>
          <p className="menu__grupo">Ventas y logística</p>
          <button className="menu__item menu__item--proximamente" disabled>
            <span>↗</span>Ventas y rentabilidad<em>Próximo</em>
          </button>
          <button className="menu__item menu__item--proximamente" disabled>
            <span>⇢</span>Logística<em>Próximo</em>
          </button>
        </nav>
        <div className="barra-lateral__pie">
          <small>Gestión Fontana</small>
        </div>
      </aside>
      <main className="contenido-principal">
        <header className="cabecera">
          <div>
            <span className="miga">Admin / </span>
            <strong>{nombreVista(vista)}</strong>
          </div>
          <div className="cabecera__acciones">
            <button
              className="boton-icono"
              aria-label="Cambiar tema"
              onClick={() => setOscuro(!oscuro)}
            >
              {oscuro ? "☼" : "◐"}
            </button>
          </div>
        </header>
        {error && (
          <div className="aviso-error" role="alert">
            <span>{error}</span>
            <button onClick={() => void cargarDatos()}>Reintentar</button>
          </div>
        )}
        {cargando ? (
          <section className="pagina">
            <div className="vacio">
              <strong>Cargando información…</strong>
            </div>
          </section>
        ) : (
          <>
            {vista === "inicio" && (
              <Inicio
                navegar={navegar}
                productos={productos}
                lotes={lotes}
                compras={compras}
                reinicioHabilitado={reinicioHabilitado}
                onAbrirReinicio={() => setModalReinicio(true)}
              />
            )}
            {vista === "precios" && (
              <ListaPrecios
                productos={productos}
                categorias={categorias}
                onNuevoProducto={() => setModalProducto(true)}
              />
            )}
            {vista === "productos" && (
              <TablaProductos
                productos={productos}
                lotes={lotes}
                categorias={categorias}
                lotesAbiertos={lotesAbiertos}
                setLotesAbiertos={setLotesAbiertos}
              />
            )}
            {vista === "lotes" && (
              <TablaLotes
                productos={productos}
                lotes={lotes}
                navegar={navegar}
              />
            )}
            {vista === "compras" && (
              <RegistrarCompra
                productos={productos}
                guardando={guardando}
                onGuardar={guardarFactura}
              />
            )}
            {vista === "historialCompras" && (
              <HistorialCompras
                compras={compras}
                productos={productos}
                lotes={lotes}
                navegar={navegar}
              />
            )}
            {vista === "clientes" && <ClientesPlaceholder />}
          </>
        )}
      </main>
      {modalReinicio && (
        <div
          className="modal-fondo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !reiniciando)
              setModalReinicio(false);
          }}
        >
          <section
            className="modal-tarjeta modal-reinicio"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-reinicio"
          >
            <button
              className="modal-cerrar"
              aria-label="Cerrar"
              disabled={reiniciando}
              onClick={() => setModalReinicio(false)}
            >
              ×
            </button>
            <p className="eyebrow">Acción de desarrollo</p>
            <h2 id="titulo-reinicio">Reinicio de fábrica</h2>
            <p>
              Se eliminarán todas las compras y facturas, lotes, ventas y
              pedidos, cobranzas, rutas, ajustes de inventario y auditoría. El
              stock de los productos volverá a cero.
            </p>
            <p>
              Se conservarán los productos, categorías, clientes, usuarios y
              configuración.
            </p>
            <form onSubmit={(evento) => void confirmarReinicio(evento)}>
              <label htmlFor="confirmacion-reinicio">
                Escribí <strong>REINICIAR</strong> para confirmar
              </label>
              <input
                id="confirmacion-reinicio"
                value={confirmacion}
                onChange={(evento) => setConfirmacion(evento.target.value)}
                autoComplete="off"
              />
              <div className="formulario-acciones">
                <button
                  type="button"
                  className="boton boton--secundario"
                  disabled={reiniciando}
                  onClick={() => setModalReinicio(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="boton boton--peligro"
                  disabled={confirmacion !== "REINICIAR" || reiniciando}
                >
                  {reiniciando ? "Reiniciando…" : "Borrar datos operativos"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {modalProducto && (
        <ModalNuevoProducto
          guardando={creandoProducto}
          onCerrar={() => setModalProducto(false)}
          onGuardar={guardarProducto}
        />
      )}
    </div>
  );
}

function BotonMenu({
  activo,
  onClick,
  icono,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  icono: string;
  children: string;
}): JSX.Element {
  return (
    <button
      className={activo ? "menu__item menu__item--activo" : "menu__item"}
      onClick={onClick}
    >
      <span>{icono}</span>
      {children}
    </button>
  );
}

function nombreVista(vista: Vista): string {
  return {
    inicio: "Panel de inicio",
    precios: "Lista de precios",
    productos: "Stock de productos",
    lotes: "Lotes",
    compras: "Registrar compra",
    historialCompras: "Historial de compras",
    clientes: "Clientes",
  }[vista];
}

function Inicio({
  navegar,
  productos,
  lotes,
  compras,
  reinicioHabilitado,
  onAbrirReinicio,
}: {
  navegar: (vista: Vista) => void;
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  compras: CompraHistorial[];
  reinicioHabilitado: boolean;
  onAbrirReinicio: () => void;
}): JSX.Element {
  const unidades = productos.reduce(
    (total, producto) => total + producto.stockTotal,
    0,
  );
  const alertas = lotes.filter(
    (lote) =>
      lote.cantidadOriginal > 0 &&
      lote.cantidadRestante / lote.cantidadOriginal < 0.25,
  ).length;
  const comprasMes = compras
    .filter(
      (compra) => compra.fechaCompra.slice(0, 7) === fechaHoy().slice(0, 7),
    )
    .reduce((total, compra) => total + compra.montoTotal, 0);
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">
            {new Date().toLocaleDateString("es-AR", { dateStyle: "full" })}
          </p>
          <h1>Panel de inicio</h1>
          <p className="subtitulo">
            Resumen de la operación de Fontana Distribuciones.
          </p>
        </div>
        <div className="acciones-rapidas">
          <button
            className="boton boton--primario"
            onClick={() => navegar("compras")}
          >
            ＋ Registrar compra
          </button>
          <button
            className="boton boton--peligro"
            disabled={!reinicioHabilitado}
            title={
              reinicioHabilitado
                ? undefined
                : "Habilitalo desde la configuración local de la API"
            }
            onClick={onAbrirReinicio}
          >
            Reinicio de fábrica
          </button>
        </div>
      </div>
      <div className="tarjetas">
        <article className="tarjeta tarjeta--verde">
          <strong>
            {productos.filter((producto) => producto.estaActivo).length}
          </strong>
          <span>Productos activos</span>
          <small>Catálogo vigente</small>
        </article>
        <article className="tarjeta">
          <strong>{unidades}</strong>
          <span>Unidades en stock</span>
          <small>Distribuidas en {lotes.length} lotes</small>
        </article>
        <article className="tarjeta tarjeta--alerta">
          <strong>{alertas}</strong>
          <span>Alertas de inventario</span>
          <small>Lotes con menos del 25%</small>
        </article>
        <article className="tarjeta">
          <strong>{dinero(comprasMes)}</strong>
          <span>Compras del mes</span>
          <small>Según facturas registradas</small>
        </article>
      </div>
      <div className="seccion-doble">
        <article className="panel">
          <h2>Operación rápida</h2>
          <p>Las compras crean lotes y actualizan el stock automáticamente.</p>
          <div className="acciones-rapidas">
            <button
              className="boton boton--primario"
              onClick={() => navegar("productos")}
            >
              Ver stock
            </button>
            <button
              className="boton boton--secundario"
              onClick={() => navegar("lotes")}
            >
              Ver lotes
            </button>
            <button
              className="boton boton--secundario"
              onClick={() => navegar("precios")}
            >
              Lista de precios
            </button>
          </div>
        </article>
        <article className="panel panel--verde">
          <p className="eyebrow">Siguiente módulo</p>
          <h2>Pedidos y rentabilidad</h2>
          <p>Este módulo todavía no está conectado.</p>
        </article>
      </div>
    </section>
  );
}

function Filtros({
  categorias,
  onBuscar,
  categoria,
  onCategoria,
  children,
}: {
  categorias: string[];
  onBuscar?: (texto: string) => void;
  categoria: string;
  onCategoria: (categoria: string) => void;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className="barra-filtros">
      <label className="buscador">
        <span>⌕</span>
        <input
          onChange={(evento) => onBuscar?.(evento.target.value)}
          placeholder="Buscar por SKU o nombre..."
        />
      </label>
      <select
        value={categoria}
        onChange={(evento) => onCategoria(evento.target.value)}
      >
        <option value="">Todas las categorías</option>
        {categorias.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {children}
    </div>
  );
}

function TablaProductos({
  productos,
  lotes,
  categorias,
  lotesAbiertos,
  setLotesAbiertos,
}: {
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  categorias: string[];
  lotesAbiertos: Set<string>;
  setLotesAbiertos: (valor: Set<string>) => void;
}): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ordenPrecio, setOrdenPrecio] = useState("ninguno");
  const [ordenStock, setOrdenStock] = useState("ninguno");
  const lista = productos
    .filter(
      (producto) =>
        `${producto.sku} ${producto.nombre}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()) &&
        (!categoria || producto.categoria === categoria),
    )
    .sort((a, b) => {
      const comparacionPrecio = a.precioVenta - b.precioVenta;
      const comparacionStock = a.stockTotal - b.stockTotal;
      const precio =
        ordenPrecio === "asc"
          ? comparacionPrecio
          : ordenPrecio === "desc"
            ? -comparacionPrecio
            : 0;
      if (precio !== 0) return precio;
      return ordenStock === "asc"
        ? comparacionStock
        : ordenStock === "desc"
          ? -comparacionStock
          : 0;
    });
  const alternar = (id: string): void => {
    const siguiente = new Set(lotesAbiertos);
    siguiente.has(id) ? siguiente.delete(id) : siguiente.add(id);
    setLotesAbiertos(siguiente);
  };
  const lotesPorProducto = new Map<string, LoteDetalle[]>();
  for (const lote of lotes) {
    const delProducto = lotesPorProducto.get(lote.productoId) ?? [];
    delProducto.push(lote);
    lotesPorProducto.set(lote.productoId, delProducto);
  }
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Operaciones / Stock</p>
          <h1>Stock de productos</h1>
          <p className="subtitulo">
            Stock consolidado por producto y detalle de los lotes que lo
            componen.
          </p>
        </div>
      </div>
      <Filtros
        categorias={categorias}
        onBuscar={setBusqueda}
        categoria={categoria}
        onCategoria={setCategoria}
      >
        <select
          aria-label="Ordenar por precio de venta"
          value={ordenPrecio}
          onChange={(evento) => setOrdenPrecio(evento.target.value)}
        >
          <option value="ninguno">Precio venta · sin ordenar</option>
          <option value="asc">Precio · menor a mayor</option>
          <option value="desc">Precio · mayor a menor</option>
        </select>
        <select
          aria-label="Ordenar por cantidad en stock"
          value={ordenStock}
          onChange={(evento) => setOrdenStock(evento.target.value)}
        >
          <option value="ninguno">Stock · sin ordenar</option>
          <option value="desc">Stock · mayor a menor</option>
          <option value="asc">Stock · menor a mayor</option>
        </select>
      </Filtros>
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>IdProducto</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Cantidad stock</th>
              <th>Precio venta</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((producto) => {
              const propios = lotesPorProducto.get(producto.id) ?? [];
              const abierto = lotesAbiertos.has(producto.id);
              return (
                <Fragment key={producto.id}>
                  <tr
                    className={
                      abierto
                        ? "fila-producto fila-producto--abierta"
                        : "fila-producto"
                    }
                  >
                    <td>
                      <button
                        className="expansor"
                        aria-expanded={abierto}
                        onClick={() => alternar(producto.id)}
                      >
                        {abierto ? "⌄" : "›"}
                      </button>{" "}
                      <strong>{producto.sku}</strong>
                    </td>
                    <td>{producto.nombre}</td>
                    <td>
                      <span className="etiqueta-categoria">
                        {producto.categoria}
                      </span>
                    </td>
                    <td>
                      <strong>{producto.stockTotal} u.</strong>
                    </td>
                    <td>{dinero(producto.precioVenta)}</td>
                  </tr>
                  {abierto &&
                    (propios.length > 0 ? (
                      propios.map((lote) => (
                        <tr className="fila-lote" key={lote.id}>
                          <td>↳ {lote.codigoLote}</td>
                          <td colSpan={2}>
                            Cantidad disponible · compra{" "}
                            {fechaVisible(lote.recibidoEn)}
                          </td>
                          <td>
                            {(() => {
                              const porcentajeRestante =
                                lote.cantidadOriginal > 0
                                  ? (lote.cantidadRestante /
                                      lote.cantidadOriginal) *
                                    100
                                  : 0;
                              const colorBarra =
                                porcentajeRestante > 70
                                  ? "barra-progreso-verde"
                                  : porcentajeRestante > 30
                                    ? "barra-progreso-ambar"
                                    : "barra-progreso-rojo";
                              return (
                                <div className="progreso-lote-en-linea progreso-stock-producto">
                                  <strong>{lote.cantidadRestante} u.</strong>
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
                                      style={{
                                        width: `${porcentajeRestante}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="texto-progreso-stock">
                                    {Math.round(porcentajeRestante)}%
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td>—</td>
                        </tr>
                      ))
                    ) : (
                      <tr
                        className="fila-lote"
                        key={`${producto.id}-sin-lotes`}
                      >
                        <td colSpan={5}>
                          Este producto todavía no tiene lotes registrados.
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {lista.length === 0 && (
          <EstadoVacio texto="No hay productos para mostrar." />
        )}
      </div>
    </section>
  );
}

function TablaLotes({
  productos,
  lotes,
  navegar,
}: {
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  navegar: (vista: Vista) => void;
}): JSX.Element {
  const [proveedor, setProveedor] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [ordenFecha, setOrdenFecha] = useState<"recientes" | "antiguas">(
    "recientes",
  );
  const [mostrarAgotados, setMostrarAgotados] = useState(false);
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
          className="boton boton--primario"
          onClick={() => navegar("compras")}
        >
          ＋ Registrar compra
        </button>
      </div>
      <section className="panel filtros-lotes">
        <label>
          Proveedor
          <select
            value={proveedor}
            onChange={(evento) => setProveedor(evento.target.value)}
          >
            <option value="">Todos</option>
            {proveedores.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
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
      </section>
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
            {gruposFiltrados.map((grupo) => {
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
                      {grupo.recibidoEn ? fechaVisible(grupo.recibidoEn) : "—"}
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
                            {dinero(lote.cantidadOriginal * lote.costoUnitario)}
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
        {gruposFiltrados.length === 0 && (
          <EstadoVacio texto="No hay lotes que coincidan con los filtros." />
        )}
      </div>
    </section>
  );
}

function ListaPrecios({
  productos,
  categorias,
  onNuevoProducto,
}: {
  productos: ProductoInventario[];
  categorias: string[];
  onNuevoProducto: () => void;
}): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ordenMarkup, setOrdenMarkup] = useState("ninguno");
  const [ordenStock, setOrdenStock] = useState("ninguno");
  const lista = productos
    .filter(
      (producto) =>
        `${producto.sku} ${producto.nombre}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()) &&
        (!categoria || producto.categoria === categoria),
    )
    .sort((a, b) => {
      const comparacionMarkup = a.markupPct - b.markupPct;
      const comparacionStock = a.stockTotal - b.stockTotal;
      const markup =
        ordenMarkup === "asc"
          ? comparacionMarkup
          : ordenMarkup === "desc"
            ? -comparacionMarkup
            : 0;
      if (markup !== 0) return markup;
      return ordenStock === "asc"
        ? comparacionStock
        : ordenStock === "desc"
          ? -comparacionStock
          : 0;
    });
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Operaciones / Precios</p>
          <h1>Lista de precios</h1>
          <p className="subtitulo">
            Precios y markup vigentes registrados en el catálogo.
          </p>
        </div>
        <button className="boton boton--primario" onClick={onNuevoProducto}>
          ＋ Nuevo producto
        </button>
      </div>
      <Filtros
        categorias={categorias}
        onBuscar={setBusqueda}
        categoria={categoria}
        onCategoria={setCategoria}
      >
        <select
          aria-label="Ordenar por markup"
          value={ordenMarkup}
          onChange={(evento) => setOrdenMarkup(evento.target.value)}
        >
          <option value="ninguno">Markup · sin ordenar</option>
          <option value="desc">Markup · mayor a menor</option>
          <option value="asc">Markup · menor a mayor</option>
        </select>
        <select
          aria-label="Ordenar por stock"
          value={ordenStock}
          onChange={(evento) => setOrdenStock(evento.target.value)}
        >
          <option value="ninguno">Stock · sin ordenar</option>
          <option value="desc">Stock · mayor a menor</option>
          <option value="asc">Stock · menor a mayor</option>
        </select>
      </Filtros>
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio público</th>
              <th>Markup</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((producto) => (
              <tr key={producto.id}>
                <td>{producto.sku}</td>
                <td>
                  <strong>{producto.nombre}</strong>
                </td>
                <td>{producto.categoria}</td>
                <td>{producto.stockTotal}</td>
                <td>
                  <strong>{dinero(producto.precioVenta)}</strong>
                </td>
                <td>{porcentaje(producto.markupPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {lista.length === 0 && (
          <EstadoVacio texto="No hay productos para mostrar." />
        )}
      </div>
    </section>
  );
}

function RegistrarCompra({
  productos,
  guardando,
  onGuardar,
}: {
  productos: ProductoInventario[];
  guardando: boolean;
  onGuardar: (entrada: RegistrarCompraEntrada) => Promise<void>;
}): JSX.Element {
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Compras / Nueva compra</p>
          <h1>Registrar nueva compra</h1>
          <p className="subtitulo">
            Cargá la factura: cada detalle generará un lote y sumará stock.
          </p>
        </div>
      </div>
      <FacturaFormulario
        productos={productos.filter((producto) => producto.estaActivo)}
        guardando={guardando}
        onGuardar={onGuardar}
      />
    </section>
  );
}

function ModalNuevoProducto({
  guardando,
  onCerrar,
  onGuardar,
}: {
  guardando: boolean;
  onCerrar: () => void;
  onGuardar: (entrada: CrearProductoEntrada) => Promise<void>;
}): JSX.Element {
  const [sku, setSku] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precioVenta, setPrecioVenta] = useState(0);
  const [markupPct, setMarkupPct] = useState(0);
  const enviar = (evento: FormEvent<HTMLFormElement>): void => {
    evento.preventDefault();
    void onGuardar({ sku, nombre, categoria, precioVenta, markupPct });
  };
  return (
    <div
      className="modal-fondo"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !guardando) onCerrar();
      }}
    >
      <section
        className="modal-tarjeta modal-producto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-producto"
      >
        <button
          className="modal-cerrar"
          aria-label="Cerrar"
          disabled={guardando}
          onClick={onCerrar}
        >
          ×
        </button>
        <p className="eyebrow">Catálogo</p>
        <h2 id="titulo-nuevo-producto">Nuevo producto</h2>
        <p className="subtitulo">
          Se crea sin stock. Podés cargar su primera existencia desde una
          factura.
        </p>
        <form className="campos-grid" onSubmit={enviar}>
          <label>
            SKU
            <input
              required
              value={sku}
              onChange={(evento) => setSku(evento.target.value)}
            />
          </label>
          <label>
            Nombre
            <input
              required
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </label>
          <label>
            Categoría
            <input
              required
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
            />
          </label>
          <label>
            Precio de venta ($)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={precioVenta}
              onChange={(evento) => setPrecioVenta(Number(evento.target.value))}
            />
          </label>
          <label>
            Markup (%)
            <input
              required
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={markupPct}
              onChange={(evento) => setMarkupPct(Number(evento.target.value))}
            />
          </label>
          <div className="formulario-acciones">
            <button
              type="button"
              className="boton boton--secundario"
              disabled={guardando}
              onClick={onCerrar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="boton boton--primario"
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Crear producto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FacturaFormulario({
  productos,
  guardando,
  onGuardar,
}: {
  productos: ProductoInventario[];
  guardando: boolean;
  onGuardar: (entrada: RegistrarCompraEntrada) => Promise<void>;
}): JSX.Element {
  const [proveedor, setProveedor] = useState("");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(fechaHoy());
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaCompraFormulario[]>([
    {
      productoId: productos[0]?.id ?? "",
      nuevoProducto:
        productos.length === 0 ? { sku: "", nombre: "", categoria: "" } : null,
      cantidad: 1,
      costoUnitario: 0,
      fechaVencimiento: "",
    },
  ]);
  const agregar = (): void =>
    setLineas((actuales) => [
      ...actuales,
      {
        productoId: productos[0]?.id ?? "",
        nuevoProducto: null,
        cantidad: 1,
        costoUnitario: 0,
        fechaVencimiento: "",
      },
    ]);
  const total = lineas.reduce(
    (suma, linea) => suma + linea.cantidad * linea.costoUnitario,
    0,
  );
  const actualizarLinea = (
    indice: number,
    cambio: Partial<LineaCompraFormulario>,
  ): void =>
    setLineas((actuales) =>
      actuales.map((actual, i) =>
        i === indice ? { ...actual, ...cambio } : actual,
      ),
    );
  const enviar = (evento: FormEvent<HTMLFormElement>): void => {
    evento.preventDefault();
    void onGuardar({
      nroFactura: numero,
      proveedor,
      fechaCompra: fecha,
      notas: notas || null,
      lineas: lineas.map((linea) => ({
        productoId: linea.productoId,
        nuevoProducto: linea.nuevoProducto,
        cantidad: linea.cantidad,
        costoUnitario: linea.costoUnitario,
        fechaVencimiento: linea.fechaVencimiento || null,
      })),
    });
  };
  const valido = Boolean(
    proveedor.trim() &&
    numero.trim() &&
    fecha &&
    lineas.length > 0 &&
    lineas.every(
      (linea) =>
        (linea.productoId ||
          (linea.nuevoProducto?.sku.trim() &&
            linea.nuevoProducto.nombre.trim() &&
            linea.nuevoProducto.categoria.trim())) &&
        linea.cantidad > 0 &&
        linea.costoUnitario >= 0,
    ),
  );
  return (
    <form className="formulario-factura" onSubmit={enviar}>
      <div className="panel">
        <h2>Cabecera de factura</h2>
        <div className="campos-grid">
          <label>
            Fecha de compra
            <input
              type="date"
              required
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
            />
          </label>
          <label>
            Número de factura
            <input
              required
              value={numero}
              onChange={(evento) => setNumero(evento.target.value)}
              placeholder="Número de comprobante"
            />
          </label>
          <label>
            Proveedor
            <input
              required
              value={proveedor}
              onChange={(evento) => setProveedor(evento.target.value)}
              placeholder="Nombre del proveedor"
            />
          </label>
          <label>
            Notas
            <input
              value={notas}
              onChange={(evento) => setNotas(evento.target.value)}
              placeholder="Opcional"
            />
          </label>
        </div>
      </div>
      <div className="panel">
        <div className="panel__encabezado">
          <div>
            <h2>Detalle de compra</h2>
            <p>Cada renglón crea un lote asociado al producto.</p>
          </div>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={agregar}
          >
            ＋ Añadir producto
          </button>
        </div>
        <div className="lineas-factura">
          <div className="lineas-factura__encabezados" aria-hidden="true">
            <span>Producto</span>
            <span>Categoría</span>
            <span>Cantidad</span>
            <span>Costo unitario ($)</span>
            <span>Subtotal</span>
            <span>Vencimiento</span>
            <span />
          </div>
          {lineas.map((linea, indice) => {
            const productoSeleccionado = productos.find(
              (producto) => producto.id === linea.productoId,
            );
            const subtotal = linea.cantidad * linea.costoUnitario;
            return (
              <div className="linea-factura" key={indice}>
                <div className="producto-compra-control">
                  <select
                    required
                    value={
                      linea.nuevoProducto
                        ? "__nuevo__"
                        : (linea.productoId ?? "")
                    }
                    onChange={(evento) =>
                      actualizarLinea(
                        indice,
                        evento.target.value === "__nuevo__"
                          ? {
                              productoId: null,
                              nuevoProducto: {
                                sku: "",
                                nombre: "",
                                categoria: "",
                              },
                            }
                          : {
                              productoId: evento.target.value,
                              nuevoProducto: null,
                            },
                      )
                    }
                  >
                    <option value="" disabled>
                      Seleccionar producto
                    </option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.sku} · {producto.nombre}
                      </option>
                    ))}
                    <option value="__nuevo__">＋ Crear producto nuevo</option>
                  </select>
                  {linea.nuevoProducto && (
                    <div className="producto-nuevo-campos">
                      <input
                        required
                        aria-label="SKU del nuevo producto"
                        placeholder="SKU"
                        value={linea.nuevoProducto.sku}
                        onChange={(evento) =>
                          actualizarLinea(indice, {
                            nuevoProducto: {
                              ...linea.nuevoProducto!,
                              sku: evento.target.value,
                            },
                          })
                        }
                      />
                      <input
                        required
                        aria-label="Nombre del nuevo producto"
                        placeholder="Nombre"
                        value={linea.nuevoProducto.nombre}
                        onChange={(evento) =>
                          actualizarLinea(indice, {
                            nuevoProducto: {
                              ...linea.nuevoProducto!,
                              nombre: evento.target.value,
                            },
                          })
                        }
                      />
                      <input
                        required
                        aria-label="Categoría del nuevo producto"
                        placeholder="Categoría"
                        value={linea.nuevoProducto.categoria}
                        onChange={(evento) =>
                          actualizarLinea(indice, {
                            nuevoProducto: {
                              ...linea.nuevoProducto!,
                              categoria: evento.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  )}
                </div>
                <span className="categoria-linea-compra">
                  {linea.nuevoProducto?.categoria ||
                    productoSeleccionado?.categoria ||
                    "—"}
                </span>
                <input
                  aria-label="Cantidad"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={linea.cantidad}
                  onChange={(evento) =>
                    actualizarLinea(indice, {
                      cantidad: Number(evento.target.value),
                    })
                  }
                  placeholder="Cantidad"
                />
                <label className="campo-moneda">
                  <span aria-hidden="true">$</span>
                  <input
                    aria-label="Costo unitario en pesos"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={linea.costoUnitario}
                    onChange={(evento) =>
                      actualizarLinea(indice, {
                        costoUnitario: Number(evento.target.value),
                      })
                    }
                    placeholder="0,00"
                  />
                </label>
                <strong className="subtotal-linea-compra">
                  {dinero(subtotal)}
                </strong>
                <input
                  aria-label="Vencimiento"
                  type="date"
                  value={linea.fechaVencimiento}
                  onChange={(evento) =>
                    actualizarLinea(indice, {
                      fechaVencimiento: evento.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  className="accion-tabla"
                  aria-label="Quitar producto"
                  disabled={lineas.length === 1}
                  onClick={() =>
                    setLineas((actuales) =>
                      actuales.filter((_, i) => i !== indice),
                    )
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <div className="formulario-acciones">
          <strong>Total factura: {dinero(total)}</strong>
          <button
            type="submit"
            className="boton boton--primario"
            disabled={!valido || guardando}
          >
            {guardando ? "Guardando…" : "Guardar factura y crear lotes"}
          </button>
        </div>
      </div>
    </form>
  );
}

function HistorialCompras({
  compras,
  productos,
  lotes,
  navegar,
}: {
  compras: CompraHistorial[];
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  navegar: (vista: Vista) => void;
}): JSX.Element {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [orden, setOrden] = useState<"recientes" | "antiguas">("recientes");
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const proveedores = Array.from(
    new Set(compras.map((compra) => compra.proveedor)),
  ).sort();
  const filtradas = compras
    .filter((compra) => !fechaDesde || compra.fechaCompra >= fechaDesde)
    .filter((compra) => !fechaHasta || compra.fechaCompra <= fechaHasta)
    .filter((compra) => !proveedor || compra.proveedor === proveedor)
    .sort((a, b) => {
      const comparacion = a.fechaCompra.localeCompare(b.fechaCompra);
      return orden === "recientes" ? -comparacion : comparacion;
    });
  const compraSeleccionada = filtradas.find(
    (compra) => compra.id === seleccionadaId,
  );
  const productosPorId = new Map(
    productos.map((producto) => [producto.id, producto]),
  );
  const codigoLote =
    lotes.find((lote) => lote.facturaCompraId === compraSeleccionada?.id)
      ?.codigoLote ??
    compraSeleccionada?.nroFactura ??
    "";
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Compras / Historial</p>
          <h1>Historial de compras</h1>
          <p className="subtitulo">
            Facturas registradas, detalles y lotes creados.
          </p>
        </div>
        <button
          className="boton boton--primario"
          onClick={() => navegar("compras")}
        >
          ＋ Nueva compra
        </button>
      </div>
      <section className="panel filtros-historial-compras">
        <label>
          Desde
          <input
            type="date"
            value={fechaDesde}
            onChange={(evento) => setFechaDesde(evento.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={fechaHasta}
            onChange={(evento) => setFechaHasta(evento.target.value)}
          />
        </label>
        <label>
          Proveedor
          <select
            value={proveedor}
            onChange={(evento) => setProveedor(evento.target.value)}
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ordenar
          <select
            value={orden}
            onChange={(evento) =>
              setOrden(evento.target.value as "recientes" | "antiguas")
            }
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguas">Más antiguas</option>
          </select>
        </label>
      </section>
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>IdFactura</th>
              <th>Fecha de compra</th>
              <th>Nombre lote creado</th>
              <th>Proveedor</th>
              <th>Costo total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtradas.map((compra) => {
              const lote =
                lotes.find((item) => item.facturaCompraId === compra.id)
                  ?.codigoLote ?? compra.nroFactura;
              return (
                <tr key={compra.id}>
                  <td>
                    <strong>{compra.nroFactura}</strong>
                  </td>
                  <td>{fechaVisible(compra.fechaCompra)}</td>
                  <td>{lote}</td>
                  <td>{compra.proveedor}</td>
                  <td>{dinero(compra.montoTotal)}</td>
                  <td>
                    <button
                      className="enlace"
                      aria-label={`Ver detalle de ${compra.nroFactura}`}
                      onClick={() => setSeleccionadaId(compra.id)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtradas.length === 0 && (
          <EstadoVacio texto="No hay compras que coincidan con los filtros." />
        )}
      </div>
      {compraSeleccionada && (
        <div
          className="modal-fondo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setSeleccionadaId(null);
          }}
        >
          <section
            className="modal-tarjeta detalle-historial-compra"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalle-compra"
          >
            <button
              className="modal-cerrar"
              aria-label="Cerrar detalle de compra"
              onClick={() => setSeleccionadaId(null)}
            >
              ×
            </button>
            <p className="eyebrow">Detalle de factura</p>
            <h2 id="titulo-detalle-compra">
              {compraSeleccionada.nroFactura} · {codigoLote}
            </h2>
            <div className="resumen-factura">
              <p>
                <span>Factura</span>
                <strong>{compraSeleccionada.nroFactura}</strong>
              </p>
              <p>
                <span>Fecha de compra</span>
                <strong>{fechaVisible(compraSeleccionada.fechaCompra)}</strong>
              </p>
              <p>
                <span>Proveedor</span>
                <strong>{compraSeleccionada.proveedor}</strong>
              </p>
              <p>
                <span>Costo total</span>
                <strong>{dinero(compraSeleccionada.montoTotal)}</strong>
              </p>
            </div>
            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Cantidad</th>
                    <th>Costo unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compraSeleccionada.lineas.map((linea) => (
                    <tr key={linea.id}>
                      <td>
                        <strong>
                          {linea.nombreProducto ?? linea.sku ?? "Producto"}
                        </strong>
                      </td>
                      <td>
                        {linea.productoId
                          ? (productosPorId.get(linea.productoId)?.categoria ??
                            "Sin categoría")
                          : "Sin categoría"}
                      </td>
                      <td>{linea.cantidad}</td>
                      <td>{dinero(linea.costoUnitario)}</td>
                      <td>
                        {dinero(
                          linea.subtotal ??
                            linea.cantidad * linea.costoUnitario,
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="fila-total">
                    <td colSpan={4} className="texto-total-lote">
                      Total
                    </td>
                    <td>{dinero(compraSeleccionada.montoTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="detalle-modal__acciones">
              <button
                className="boton boton--secundario"
                onClick={() => setSeleccionadaId(null)}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function ClientesPlaceholder(): JSX.Element {
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Personas / Clientes</p>
          <h1>Clientes</h1>
          <p className="subtitulo">
            La gestión de clientes se conectará en la siguiente etapa.
          </p>
        </div>
      </div>
      <div className="tabla-contenedor">
        <EstadoVacio texto="No hay un listado conectado todavía." />
      </div>
    </section>
  );
}

function EstadoVacio({ texto }: { texto: string }): JSX.Element {
  return (
    <div className="vacio">
      <strong>{texto}</strong>
    </div>
  );
}
