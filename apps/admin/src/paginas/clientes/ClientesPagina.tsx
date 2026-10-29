import { EstadoVacio } from "../../components";

export function ClientesPagina(): JSX.Element {
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
