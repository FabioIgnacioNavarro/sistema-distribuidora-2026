import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type {
  CompraHistorial,
  CrearProductoEntrada,
  LoteDetalle,
  ProductoInventario,
  RegistrarCompraEntrada,
} from "@distribuidora/tipos-compartidos";
import {
  actualizarProductoPrecios,
  crearCompra,
  crearProducto,
  obtenerCompras,
  obtenerEstadoReinicio,
  obtenerLotes,
  obtenerProductos,
  reiniciarDatosOperativos,
} from "./repositorios/api.repositorio";
import type { Vista } from "./comun/tipos";
import { ModalNuevoProducto } from "./components/ModalNuevoProducto";
import {
  ClientesPagina,
  HistorialComprasPagina,
  InicioPagina,
  ListaPreciosPagina,
  LotesPagina,
  RegistrarCompraPagina,
  StockProductosPagina,
} from "./paginas";

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

  const guardarPrecios = async (
    id: string,
    precioVenta: number,
    markupPct: number,
  ): Promise<void> => {
    setError(null);
    try {
      await actualizarProductoPrecios({ id, precioVenta, markupPct });
      await cargarDatos();
    } catch (errorPrecios) {
      setError(
        errorPrecios instanceof Error
          ? errorPrecios.message
          : "No se pudieron actualizar los precios.",
      );
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
              <InicioPagina
                navegar={navegar}
                productos={productos}
                lotes={lotes}
                compras={compras}
                reinicioHabilitado={reinicioHabilitado}
                onAbrirReinicio={() => setModalReinicio(true)}
              />
            )}
            {vista === "precios" && (
              <ListaPreciosPagina
                productos={productos}
                categorias={categorias}
                onNuevoProducto={() => setModalProducto(true)}
                onActualizarPrecios={guardarPrecios}
              />
            )}
            {vista === "productos" && (
              <StockProductosPagina
                productos={productos}
                lotes={lotes}
                categorias={categorias}
                lotesAbiertos={lotesAbiertos}
                setLotesAbiertos={setLotesAbiertos}
              />
            )}
            {vista === "lotes" && (
              <LotesPagina
                productos={productos}
                lotes={lotes}
                navegar={navegar}
              />
            )}
            {vista === "compras" && (
              <RegistrarCompraPagina
                productos={productos}
                compras={compras}
                guardando={guardando}
                onGuardar={guardarFactura}
              />
            )}
            {vista === "historialCompras" && (
              <HistorialComprasPagina
                compras={compras}
                productos={productos}
                lotes={lotes}
                navegar={navegar}
              />
            )}
            {vista === "clientes" && <ClientesPagina />}
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
