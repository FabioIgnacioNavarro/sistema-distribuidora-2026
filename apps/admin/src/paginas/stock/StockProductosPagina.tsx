import { Fragment, useState } from "react";
import type {
  LoteDetalle,
  ProductoInventario,
} from "@distribuidora/tipos-compartidos";
import { EstadoVacio, Filtros, Paginador } from "../../components";
import { REGISTROS_POR_PAGINA, dinero, fechaVisible } from "../../comun/formato";
import "./StockProductosPagina.css";

interface StockProductosPaginaProps {
  productos: ProductoInventario[];
  lotes: LoteDetalle[];
  categorias: string[];
  lotesAbiertos: Set<string>;
  setLotesAbiertos: (valor: Set<string>) => void;
}

export function StockProductosPagina({
  productos,
  lotes,
  categorias,
  lotesAbiertos,
  setLotesAbiertos,
}: StockProductosPaginaProps): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ordenPrecio, setOrdenPrecio] = useState("ninguno");
  const [ordenStock, setOrdenStock] = useState("ninguno");
  const [pagina, setPagina] = useState(1);

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
        <label>
          Ordenar precio
          <select
            value={ordenPrecio}
            onChange={(evento) => setOrdenPrecio(evento.target.value)}
          >
            <option value="ninguno">Sin ordenar</option>
            <option value="asc">Menor a mayor</option>
            <option value="desc">Mayor a menor</option>
          </select>
        </label>
        <label>
          Ordenar stock
          <select
            value={ordenStock}
            onChange={(evento) => setOrdenStock(evento.target.value)}
          >
            <option value="ninguno">Sin ordenar</option>
            <option value="desc">Mayor a menor</option>
            <option value="asc">Menor a mayor</option>
          </select>
        </label>
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
            {lista
              .slice(
                (pagina - 1) * REGISTROS_POR_PAGINA,
                pagina * REGISTROS_POR_PAGINA,
              )
              .map((producto) => {
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
                          type="button"
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
        <Paginador total={lista.length} pagina={pagina} onCambiar={setPagina} />
        {lista.length === 0 && (
          <EstadoVacio texto="No hay productos para mostrar." />
        )}
      </div>
    </section>
  );
}
