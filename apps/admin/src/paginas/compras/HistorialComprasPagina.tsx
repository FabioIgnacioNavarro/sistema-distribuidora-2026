import { useState } from "react";
import type {
  CompraHistorial,
  LoteDetalle,
  ProductoInventario,
} from "@distribuidora/tipos-compartidos";
import { BuscadorLista, EstadoVacio, Filtros, Paginador } from "../../components";
import {
  REGISTROS_POR_PAGINA,
  dinero,
  fechaVisible,
  idFacturaVisible,
} from "../../comun/formato";
import type { Vista } from "../../comun/tipos";
import "./compras.css";

interface HistorialComprasPaginaProps {
  compras: CompraHistorial[];
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  navegar: (vista: Vista) => void;
}

export function HistorialComprasPagina({
  compras,
  productos,
  lotes,
  navegar,
}: HistorialComprasPaginaProps): JSX.Element {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"recientes" | "antiguas">("recientes");
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  const proveedores = Array.from(
    new Set(compras.map((compra) => compra.proveedor)),
  ).sort();

  const filtradas = compras
    .filter(
      (compra) =>
        !busqueda.trim() ||
        `${compra.nroFactura} ${compra.proveedor}`
          .toLowerCase()
          .includes(busqueda.trim().toLowerCase()),
    )
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
          type="button"
          className="boton boton--primario"
          onClick={() => navegar("compras")}
        >
          ＋ Nueva compra
        </button>
      </div>
      <Filtros
        categorias={[]}
        categoria=""
        onCategoria={() => undefined}
        onBuscar={setBusqueda}
        mostrarCategoria={false}
        placeholder="Buscar número de factura o proveedor..."
      >
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
      </Filtros>
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>IdFactura</th>
              <th>N° factura</th>
              <th>Fecha de compra</th>
              <th>Nombre lote creado</th>
              <th>Proveedor</th>
              <th>Sucursal</th>
              <th>Costo total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtradas
              .slice(
                (pagina - 1) * REGISTROS_POR_PAGINA,
                pagina * REGISTROS_POR_PAGINA,
              )
              .map((compra) => {
                const lote =
                  lotes.find((item) => item.facturaCompraId === compra.id)
                    ?.codigoLote ?? compra.nroFactura;
                return (
                  <tr key={compra.id}>
                    <td>
                      <strong>{idFacturaVisible(compra.numeroInterno)}</strong>
                    </td>
                    <td>{compra.nroFactura}</td>
                    <td>{fechaVisible(compra.fechaCompra)}</td>
                    <td>{lote}</td>
                    <td>{compra.proveedor}</td>
                    <td>{compra.sucursalProveedor ?? "—"}</td>
                    <td>{dinero(compra.montoTotal)}</td>
                    <td>
                      <button
                        type="button"
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
        <Paginador
          total={filtradas.length}
          pagina={pagina}
          onCambiar={setPagina}
        />
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
              type="button"
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
                <span>IdFactura</span>
                <strong>{idFacturaVisible(compraSeleccionada.numeroInterno)}</strong>
              </p>
              <p>
                <span>N° factura</span>
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
                <span>Sucursal</span>
                <strong>{compraSeleccionada.sucursalProveedor ?? "—"}</strong>
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
                type="button"
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
