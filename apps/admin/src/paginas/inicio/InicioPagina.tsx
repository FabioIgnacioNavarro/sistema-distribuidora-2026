import type {
  CompraHistorial,
  LoteDetalle,
  ProductoInventario,
} from "@distribuidora/tipos-compartidos";
import { dinero, fechaHoy } from "../../comun/formato";
import type { Vista } from "../../comun/tipos";
import "./InicioPagina.css";

interface InicioPaginaProps {
  navegar: (vista: Vista) => void;
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  compras: CompraHistorial[];
  reinicioHabilitado: boolean;
  onAbrirReinicio: () => void;
}

export function InicioPagina({
  navegar,
  productos,
  lotes,
  compras,
  reinicioHabilitado,
  onAbrirReinicio,
}: InicioPaginaProps): JSX.Element {
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
            type="button"
            className="boton boton--primario"
            onClick={() => navegar("compras")}
          >
            ＋ Registrar compra
          </button>
          <button
            type="button"
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
              type="button"
              className="boton boton--primario"
              onClick={() => navegar("productos")}
            >
              Ver stock
            </button>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => navegar("lotes")}
            >
              Ver lotes
            </button>
            <button
              type="button"
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
