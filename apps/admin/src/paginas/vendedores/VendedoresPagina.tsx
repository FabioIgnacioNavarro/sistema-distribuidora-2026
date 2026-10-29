import { EstadoVacio } from "../../components";

export function VendedoresPagina(): JSX.Element {
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Personas / Preventa</p>
          <h1>Vendedores</h1>
          <p className="subtitulo">
            Gestión de equipo de ventas en calle, comisiones configuradas y pedidos asignados.
          </p>
        </div>
      </div>
      <div className="tabla-contenedor">
        <EstadoVacio texto="El panel de vendedores y liquidación de comisiones se conectará en la siguiente etapa." />
      </div>
    </section>
  );
}
