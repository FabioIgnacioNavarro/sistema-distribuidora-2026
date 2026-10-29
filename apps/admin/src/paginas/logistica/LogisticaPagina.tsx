import { EstadoVacio } from "../../components";

export function LogisticaPagina(): JSX.Element {
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Logística / Rutas</p>
          <h1>Logística y reparto</h1>
          <p className="subtitulo">
            Organización de hojas de ruta, choferes, vehículos y seguimiento de entregas en calle.
          </p>
        </div>
      </div>
      <div className="tabla-contenedor">
        <EstadoVacio texto="El módulo de asignación de choferes y hojas de ruta se activará en la fase de logística." />
      </div>
    </section>
  );
}
