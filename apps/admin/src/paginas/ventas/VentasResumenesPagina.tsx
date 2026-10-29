import { EstadoVacio } from "../../components";

export function VentasResumenesPagina(): JSX.Element {
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Operaciones / Resúmenes</p>
          <h1>Ventas y rentabilidad</h1>
          <p className="subtitulo">
            Métricas consolidadas de facturación, comisiones a vendedores y margen neto.
          </p>
        </div>
      </div>

      <div className="tarjetas">
        <article className="tarjeta tarjeta--verde">
          <div className="tarjeta__icono">↗</div>
          <span>Ventas este mes</span>
          <strong>$0</strong>
          <small>Próxima integración</small>
        </article>
        <article className="tarjeta">
          <div className="tarjeta__icono tarjeta__icono--gris">Yo</div>
          <span>Ganancia neta este mes</span>
          <strong>$0</strong>
          <small>Renta menos comisiones</small>
        </article>
        <article className="tarjeta">
          <div className="tarjeta__icono tarjeta__icono--amarillo">%</div>
          <span>Comisiones liquidadas</span>
          <strong>$0</strong>
          <small>10% sobre ventas vendedor</small>
        </article>
        <article className="tarjeta">
          <div className="tarjeta__icono tarjeta__icono--gris">📦</div>
          <span>Pedidos confirmados</span>
          <strong>0</strong>
          <small>Pendientes de entrega</small>
        </article>
      </div>

      <div className="tabla-contenedor">
        <EstadoVacio texto="Los gráficos de rentabilidad y evolución mensual se activarán con el cierre del ciclo de entregas (Paso 2)." />
      </div>
    </section>
  );
}
