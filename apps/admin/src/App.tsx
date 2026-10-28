import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type {
  CompraHistorial,
  LoteDetalle,
  ProductoInventario,
  RegistrarCompraEntrada,
} from "@distribuidora/tipos-compartidos";
import {
  crearCompra,
  obtenerCompras,
  obtenerLotes,
  obtenerProductos,
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
  productoId: string;
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
  }, [cargarDatos]);

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

  const navegar = (nuevaVista: Vista): void => {
    setVista(nuevaVista);
    setError(null);
  };
  const categorias = useMemo(
    () => [...new Set(productos.map((producto) => producto.categoria))].sort(),
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
              />
            )}
            {vista === "precios" && (
              <ListaPrecios productos={productos} categorias={categorias} />
            )}
            {vista === "productos" && (
              <TablaProductos productos={productos} categorias={categorias} />
            )}
            {vista === "lotes" && (
              <TablaLotes
                productos={productos}
                lotes={lotes}
                lotesAbiertos={lotesAbiertos}
                setLotesAbiertos={setLotesAbiertos}
                navegar={navegar}
                categorias={categorias}
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
              <HistorialCompras compras={compras} navegar={navegar} />
            )}
            {vista === "clientes" && <ClientesPlaceholder />}
          </>
        )}
      </main>
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
}: {
  navegar: (vista: Vista) => void;
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  compras: CompraHistorial[];
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
        <button
          className="boton boton--primario"
          onClick={() => navegar("compras")}
        >
          ＋ Registrar compra
        </button>
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
}: {
  categorias: string[];
  onBuscar?: (texto: string) => void;
  categoria: string;
  onCategoria: (categoria: string) => void;
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
    </div>
  );
}

function TablaProductos({
  productos,
  categorias,
}: {
  productos: ProductoInventario[];
  categorias: string[];
}): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const lista = productos.filter(
    (producto) =>
      `${producto.sku} ${producto.nombre}`
        .toLowerCase()
        .includes(busqueda.toLowerCase()) &&
      (!categoria || producto.categoria === categoria),
  );
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Operaciones / Stock</p>
          <h1>Stock de productos</h1>
          <p className="subtitulo">
            Stock actual por producto. El detalle de compras se consulta en
            Lotes.
          </p>
        </div>
      </div>
      <Filtros
        categorias={categorias}
        onBuscar={setBusqueda}
        categoria={categoria}
        onCategoria={setCategoria}
      />
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Descripción del artículo</th>
              <th>Categoría</th>
              <th>Precio público</th>
              <th>Stock actual</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((producto) => (
              <tr key={producto.id}>
                <td>
                  <strong>{producto.sku}</strong>
                </td>
                <td>{producto.nombre}</td>
                <td>
                  <span className="etiqueta-categoria">
                    {producto.categoria}
                  </span>
                </td>
                <td>{dinero(producto.precioVenta)}</td>
                <td>
                  <strong>{producto.stockTotal}</strong>
                </td>
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

function TablaLotes({
  productos,
  lotes,
  lotesAbiertos,
  setLotesAbiertos,
  navegar,
  categorias,
}: {
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  lotesAbiertos: Set<string>;
  setLotesAbiertos: (valor: Set<string>) => void;
  navegar: (vista: Vista) => void;
  categorias: string[];
}): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const lista = productos.filter(
    (producto) =>
      `${producto.sku} ${producto.nombre}`
        .toLowerCase()
        .includes(busqueda.toLowerCase()) &&
      (!categoria || producto.categoria === categoria),
  );
  const alternar = (id: string): void => {
    const siguiente = new Set(lotesAbiertos);
    siguiente.has(id) ? siguiente.delete(id) : siguiente.add(id);
    setLotesAbiertos(siguiente);
  };
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Operaciones / Stock / Lotes</p>
          <h1>Lotes</h1>
          <p className="subtitulo">
            Compras recibidas, remanente disponible y costo por lote.
          </p>
        </div>
        <button
          className="boton boton--primario"
          onClick={() => navegar("compras")}
        >
          ＋ Registrar compra
        </button>
      </div>
      <Filtros
        categorias={categorias}
        onBuscar={setBusqueda}
        categoria={categoria}
        onCategoria={setCategoria}
      />
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock actual</th>
              <th>Lotes registrados</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((producto) => {
              const propios = lotes.filter(
                (lote) => lote.productoId === producto.id,
              );
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
                      <div className="producto-celda">
                        <button
                          className="expansor"
                          onClick={() => alternar(producto.id)}
                          aria-expanded={abierto}
                        >
                          {abierto ? "⌄" : "›"}
                        </button>
                        <span>
                          <strong>{producto.nombre}</strong>
                          <small>{producto.sku}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="etiqueta-categoria">
                        {producto.categoria}
                      </span>
                    </td>
                    <td>
                      <strong>{producto.stockTotal} u.</strong>
                    </td>
                    <td>{propios.length}</td>
                    <td>
                      <span
                        className={
                          producto.stockTotal > 0
                            ? "estado estado--activo"
                            : "estado estado--agotado"
                        }
                      >
                        {producto.stockTotal > 0 ? "Disponible" : "Agotado"}
                      </span>
                    </td>
                  </tr>
                  {abierto &&
                    propios.map((lote) => (
                      <tr className="fila-lote" key={lote.id}>
                        <td>
                          <span className="lote-nombre">
                            ↳ <strong>{lote.codigoLote}</strong>
                            <small>
                              {lote.numeroFactura
                                ? `Factura ${lote.numeroFactura} · ${lote.proveedor ?? ""}`
                                : "Compra registrada"}
                            </small>
                          </span>
                        </td>
                        <td>Costo: {dinero(lote.costoUnitario)}</td>
                        <td>
                          <strong>
                            {lote.cantidadRestante} / {lote.cantidadOriginal} u.
                          </strong>
                          <div className="barra-stock barra-stock--lote">
                            <i
                              style={{
                                width: `${lote.cantidadOriginal ? (lote.cantidadRestante / lote.cantidadOriginal) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          {lote.fechaVencimiento
                            ? fechaVisible(lote.fechaVencimiento)
                            : "Sin vencimiento"}
                        </td>
                        <td>
                          <span
                            className={
                              lote.cantidadRestante > 0
                                ? "estado estado--lote"
                                : "estado estado--agotado"
                            }
                          >
                            {lote.cantidadRestante > 0
                              ? "Disponible"
                              : "Agotado"}
                          </span>
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

function ListaPrecios({
  productos,
  categorias,
}: {
  productos: ProductoInventario[];
  categorias: string[];
}): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const lista = productos.filter(
    (producto) =>
      `${producto.sku} ${producto.nombre}`
        .toLowerCase()
        .includes(busqueda.toLowerCase()) &&
      (!categoria || producto.categoria === categoria),
  );
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
      </div>
      <Filtros
        categorias={categorias}
        onBuscar={setBusqueda}
        categoria={categoria}
        onCategoria={setCategoria}
      />
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
    productos.length > 0 &&
    lineas.length > 0 &&
    lineas.every(
      (linea) =>
        linea.productoId && linea.cantidad > 0 && linea.costoUnitario >= 0,
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
            disabled={productos.length === 0}
            onClick={agregar}
          >
            ＋ Añadir producto
          </button>
        </div>
        {productos.length === 0 ? (
          <EstadoVacio texto="No hay productos activos. Primero necesitás productos en el catálogo." />
        ) : (
          <div className="lineas-factura">
            {lineas.map((linea, indice) => (
              <div className="linea-factura" key={indice}>
                <select
                  required
                  value={linea.productoId}
                  onChange={(evento) =>
                    actualizarLinea(indice, { productoId: evento.target.value })
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
                </select>
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
                <input
                  aria-label="Costo unitario"
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
                  placeholder="Costo unitario"
                />
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
            ))}
          </div>
        )}
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
  navegar,
}: {
  compras: CompraHistorial[];
  navegar: (vista: Vista) => void;
}): JSX.Element {
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const alternar = (id: string): void => {
    const siguiente = new Set(abiertas);
    siguiente.has(id) ? siguiente.delete(id) : siguiente.add(id);
    setAbiertas(siguiente);
  };
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
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Factura</th>
              <th>Fecha de compra</th>
              <th>Proveedor</th>
              <th>Renglones</th>
              <th>Costo total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {compras.map((compra) => {
              const abierta = abiertas.has(compra.id);
              return (
                <Fragment key={compra.id}>
                  <tr>
                    <td>
                      <strong>{compra.nroFactura}</strong>
                    </td>
                    <td>{fechaVisible(compra.fechaCompra)}</td>
                    <td>{compra.proveedor}</td>
                    <td>{compra.lineas.length}</td>
                    <td>{dinero(compra.montoTotal)}</td>
                    <td>
                      <button
                        className="enlace"
                        aria-expanded={abierta}
                        onClick={() => alternar(compra.id)}
                      >
                        {abierta ? "Ocultar detalle" : "Ver detalle"}
                      </button>
                    </td>
                  </tr>
                  {abierta && (
                    <tr>
                      <td colSpan={6}>
                        <div className="detalle-compra">
                          <strong>Productos de la factura</strong>
                          <ul>
                            {compra.lineas.map((linea) => (
                              <li key={linea.id}>
                                {linea.sku ?? "Sin SKU"} ·{" "}
                                {linea.nombreProducto ?? "Producto"} —{" "}
                                {linea.cantidad} u. ×{" "}
                                {dinero(linea.costoUnitario)} ={" "}
                                {dinero(
                                  linea.subtotal ??
                                    linea.cantidad * linea.costoUnitario,
                                )}
                                {linea.fechaVencimiento
                                  ? ` · Vence ${fechaVisible(linea.fechaVencimiento)}`
                                  : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {compras.length === 0 && (
          <EstadoVacio texto="Todavía no hay compras registradas." />
        )}
      </div>
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
