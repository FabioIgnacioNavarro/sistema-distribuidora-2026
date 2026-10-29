import { useState } from "react";
import type { ProductoInventario } from "@distribuidora/tipos-compartidos";
import { EstadoVacio, Filtros, Paginador } from "../../components";
import { REGISTROS_POR_PAGINA, porcentaje } from "../../comun/formato";
import "./ListaPreciosPagina.css";

interface FormatoMarkupRealProps {
  min: number | null;
  max: number | null;
  cantidadLotes: number;
}

function FormatoMarkupReal({
  min,
  max,
  cantidadLotes,
}: FormatoMarkupRealProps): JSX.Element {
  if (min === null) return <span>—</span>;
  if (cantidadLotes === 1 || min === max) {
    const clase = min <= 0 ? "markup-negativo" : "markup-positivo";
    return <span className={clase}>{porcentaje(min)}</span>;
  }
  const maxVal = max ?? min;
  const claseMin = min <= 0 ? "markup-negativo" : "markup-positivo";
  const claseMax = maxVal <= 0 ? "markup-negativo" : "markup-positivo";
  return (
    <span>
      <span className={claseMin}>{porcentaje(min)}</span>
      {" — "}
      <span className={claseMax}>{porcentaje(maxVal)}</span>
    </span>
  );
}

interface ListaPreciosPaginaProps {
  productos: ProductoInventario[];
  categorias: string[];
  onNuevoProducto: () => void;
  onActualizarPrecios: (
    id: string,
    precioVenta: number,
    markupPct: number,
  ) => Promise<void>;
}

export function ListaPreciosPagina({
  productos,
  categorias,
  onNuevoProducto,
  onActualizarPrecios,
}: ListaPreciosPaginaProps): JSX.Element {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ordenMarkup, setOrdenMarkup] = useState("ninguno");
  const [ordenStock, setOrdenStock] = useState("ninguno");
  const [pagina, setPagina] = useState(1);
  const [ediciones, setEdiciones] = useState<
    Record<string, { precioVenta: number; markupPct: number }>
  >({});

  const lista = productos
    .filter(
      (producto) =>
        `${producto.sku} ${producto.nombre}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()) &&
        (!categoria || producto.categoria === categoria),
    )
    .sort((a, b) => {
      const comparacionMarkup = a.markupPct - b.markupPct;
      const comparacionStock = a.stockTotal - b.stockTotal;
      const markup =
        ordenMarkup === "asc"
          ? comparacionMarkup
          : ordenMarkup === "desc"
            ? -comparacionMarkup
            : 0;
      if (markup !== 0) return markup;
      return ordenStock === "asc"
        ? comparacionStock
        : ordenStock === "desc"
          ? -comparacionStock
          : 0;
    });

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
        <button
          type="button"
          className="boton boton--primario"
          onClick={onNuevoProducto}
        >
          ＋ Nuevo producto
        </button>
      </div>
      <Filtros
        categorias={categorias}
        onBuscar={setBusqueda}
        categoria={categoria}
        onCategoria={setCategoria}
      >
        <label>
          Ordenar markup
          <select
            value={ordenMarkup}
            onChange={(evento) => setOrdenMarkup(evento.target.value)}
          >
            <option value="ninguno">Sin ordenar</option>
            <option value="desc">Mayor a menor</option>
            <option value="asc">Menor a mayor</option>
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
              <th>SKU</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio público</th>
              <th>Markup deseado</th>
              <th>Markup real por lotes</th>
            </tr>
          </thead>
          <tbody>
            {lista
              .slice(
                (pagina - 1) * REGISTROS_POR_PAGINA,
                pagina * REGISTROS_POR_PAGINA,
              )
              .map((producto) => (
                <tr key={producto.id}>
                  {(() => {
                    const edicion = ediciones[producto.id] ?? {
                      precioVenta: producto.precioVenta,
                      markupPct: producto.markupPct,
                    };
                    const cambiar = (cambio: Partial<typeof edicion>): void =>
                      setEdiciones((actuales) => ({
                        ...actuales,
                        [producto.id]: { ...edicion, ...cambio },
                      }));
                    return (
                      <>
                        <td>{producto.sku}</td>
                        <td>
                          <strong>{producto.nombre}</strong>
                        </td>
                        <td>{producto.categoria}</td>
                        <td>{producto.stockTotal}</td>
                        <td>
                          <div className="campo-tabla-envoltorio">
                            <span className="campo-tabla-simbolo">$</span>
                            <input
                              className="campo-tabla-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={edicion.precioVenta}
                              onChange={(evento) =>
                                cambiar({
                                  precioVenta: Number(evento.target.value),
                                })
                              }
                              onBlur={() =>
                                void onActualizarPrecios(
                                  producto.id,
                                  edicion.precioVenta,
                                  edicion.markupPct,
                                )
                              }
                              aria-label={`Precio público de ${producto.nombre}`}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="campo-tabla-envoltorio">
                            <input
                              className="campo-tabla-input"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={edicion.markupPct}
                              onChange={(evento) =>
                                cambiar({
                                  markupPct: Number(evento.target.value),
                                })
                              }
                              onBlur={() =>
                                void onActualizarPrecios(
                                  producto.id,
                                  edicion.precioVenta,
                                  edicion.markupPct,
                                )
                              }
                              aria-label={`Markup deseado de ${producto.nombre}`}
                            />
                            <span className="campo-tabla-simbolo">%</span>
                          </div>
                        </td>
                        <td>
                          <FormatoMarkupReal
                            min={producto.markupRealMin}
                            max={producto.markupRealMax}
                            cantidadLotes={producto.cantidadLotesActivos}
                          />
                        </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
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
