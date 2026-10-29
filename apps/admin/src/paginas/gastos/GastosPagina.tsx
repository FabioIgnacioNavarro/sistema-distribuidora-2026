import { EstadoVacio } from "../../components";

export function GastosPagina(): JSX.Element {
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Operaciones / Egresos</p>
          <h1>Gastos operativos</h1>
          <p className="subtitulo">
            Control de gastos generales, combustible, viáticos y mantenimiento.
          </p>
        </div>
      </div>
      <div className="tabla-contenedor">
        <EstadoVacio texto="El registro y resumen de gastos operativos estará disponible próximamente." />
      </div>
    </section>
  );
}
