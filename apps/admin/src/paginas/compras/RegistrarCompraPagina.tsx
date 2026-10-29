import { useState } from "react";
import type { FormEvent } from "react";
import type {
  CompraHistorial,
  ProductoInventario,
  RegistrarCompraEntrada,
} from "@distribuidora/tipos-compartidos";
import { BuscadorLista } from "../../components";
import { dinero, fechaHoy } from "../../comun/formato";
import "./compras.css";

interface LineaCompraFormulario {
  productoId: string | null;
  nuevoProducto: {
    nombre: string;
    categoriaCodigo: "ALI" | "SNK" | "BEB";
    subcategoriaCodigo: "V" | "C" | "G" | null;
  } | null;
  cantidad: number;
  costoUnitario: number;
  fechaVencimiento: string;
}

interface FacturaFormularioProps {
  productos: ProductoInventario[];
  compras: CompraHistorial[];
  guardando: boolean;
  onGuardar: (entrada: RegistrarCompraEntrada) => Promise<void>;
}

function FacturaFormulario({
  productos,
  compras,
  guardando,
  onGuardar,
}: FacturaFormularioProps): JSX.Element {
  const proveedores = Array.from(
    new Set(compras.map((compra) => compra.proveedor)),
  ).sort();
  const [proveedor, setProveedor] = useState("");
  const [proveedorNuevo, setProveedorNuevo] = useState("");
  const [sucursal, setSucursal] = useState("");
  const [sucursalNueva, setSucursalNueva] = useState("");
  const sucursales = Array.from(
    new Set(
      compras
        .filter(
          (compra) =>
            compra.proveedor ===
            (proveedor === "__nuevo__" ? proveedorNuevo : proveedor),
        )
        .map((compra) => compra.sucursalProveedor)
        .filter((valor): valor is string => Boolean(valor)),
    ),
  ).sort();
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(fechaHoy());
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaCompraFormulario[]>([
    {
      productoId: productos[0]?.id ?? "",
      nuevoProducto:
        productos.length === 0
          ? { nombre: "", categoriaCodigo: "ALI", subcategoriaCodigo: null }
          : null,
      cantidad: 1,
      costoUnitario: 0,
      fechaVencimiento: "",
    },
  ]);

  const agregar = (): void =>
    setLineas((actuales) => [
      ...actuales,
      {
        productoId: productos[0]?.id ?? "",
        nuevoProducto: null,
        cantidad: 1,
        costoUnitario: 0,
        fechaVencimiento: "",
      },
    ]);

  const total = lineas.reduce(
    (suma, linea) => suma + linea.cantidad * linea.costoUnitario,
    0,
  );

  const actualizarLinea = (
    indice: number,
    cambio: Partial<LineaCompraFormulario>,
  ): void =>
    setLineas((actuales) =>
      actuales.map((actual, i) =>
        i === indice ? { ...actual, ...cambio } : actual,
      ),
    );

  const enviar = (evento: FormEvent<HTMLFormElement>): void => {
    evento.preventDefault();
    void onGuardar({
      nroFactura: numero,
      proveedor: proveedor === "__nuevo__" ? proveedorNuevo : proveedor,
      sucursalProveedor: sucursal === "__nuevo__" ? sucursalNueva : sucursal,
      fechaCompra: fecha,
      notas: notas || null,
      lineas: lineas.map((linea) => ({
        productoId: linea.productoId,
        nuevoProducto: linea.nuevoProducto,
        cantidad: linea.cantidad,
        costoUnitario: linea.costoUnitario,
        fechaVencimiento: linea.fechaVencimiento || null,
      })),
    });
  };

  const valido = Boolean(
    (proveedor === "__nuevo__" ? proveedorNuevo.trim() : proveedor.trim()) &&
    (sucursal === "__nuevo__" ? sucursalNueva.trim() : sucursal.trim()) &&
    numero.trim() &&
    fecha &&
    lineas.length > 0 &&
    lineas.every(
      (linea) =>
        (linea.productoId || linea.nuevoProducto?.nombre.trim()) &&
        linea.cantidad > 0 &&
        linea.costoUnitario >= 0,
    ),
  );

  return (
    <form className="formulario-factura" onSubmit={enviar}>
      <div className="panel">
        <h2>Cabecera de factura</h2>
        <div className="campos-grid">
          <label>
            Fecha de compra
            <input
              type="date"
              required
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
            />
          </label>
          <label>
            Número de factura
            <input
              required
              value={numero}
              onChange={(evento) => setNumero(evento.target.value)}
              placeholder="Número de comprobante"
            />
          </label>
          <label>
            Proveedor
            <BuscadorLista
              opciones={[
                ...proveedores.map((nombre) => ({
                  valor: nombre,
                  etiqueta: nombre,
                })),
                { valor: "__nuevo__", etiqueta: "＋ Crear proveedor nuevo" },
              ]}
              valor={proveedor}
              onCambiar={(valor) => {
                setProveedor(valor);
                setSucursal("");
              }}
              placeholder="Buscar proveedor..."
            />
          </label>
          {proveedor === "__nuevo__" && (
            <label>
              Nuevo proveedor
              <input
                required
                value={proveedorNuevo}
                onChange={(evento) => setProveedorNuevo(evento.target.value)}
                placeholder="Nombre del proveedor"
              />
            </label>
          )}
          <label>
            Sucursal
            <BuscadorLista
              opciones={[
                ...sucursales.map((nombre) => ({
                  valor: nombre,
                  etiqueta: nombre,
                })),
                { valor: "__nuevo__", etiqueta: "＋ Crear sucursal nueva" },
              ]}
              valor={sucursal}
              onCambiar={setSucursal}
              placeholder="Buscar sucursal..."
            />
          </label>
          {sucursal === "__nuevo__" && (
            <label>
              Nueva sucursal
              <input
                required
                value={sucursalNueva}
                onChange={(evento) => setSucursalNueva(evento.target.value)}
                placeholder="Ej. Mayorista Av. Alvear"
              />
            </label>
          )}
          <label>
            Notas
            <input
              value={notas}
              onChange={(evento) => setNotas(evento.target.value)}
              placeholder="Opcional"
            />
          </label>
        </div>
      </div>
      <div className="panel">
        <div className="panel__encabezado">
          <div>
            <h2>Detalle de compra</h2>
            <p>Cada renglón crea un lote asociado al producto.</p>
          </div>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={agregar}
          >
            ＋ Añadir producto
          </button>
        </div>
        <div className="lineas-factura">
          <div className="lineas-factura__encabezados" aria-hidden="true">
            <span>Producto</span>
            <span>Categoría</span>
            <span>Cantidad</span>
            <span>Costo unitario ($)</span>
            <span>Subtotal</span>
            <span>Vencimiento</span>
            <span />
          </div>
          {lineas.map((linea, indice) => {
            const productoSeleccionado = productos.find(
              (producto) => producto.id === linea.productoId,
            );
            const subtotal = linea.cantidad * linea.costoUnitario;
            return (
              <div className="linea-factura" key={indice}>
                <div className="producto-compra-control">
                  <BuscadorLista
                    opciones={[
                      {
                        valor: "__nuevo__",
                        etiqueta: "＋ Crear producto nuevo",
                      },
                      ...productos.map((producto) => ({
                        valor: producto.id,
                        etiqueta: `${producto.sku} · ${producto.nombre}`,
                      })),
                    ]}
                    valor={
                      linea.nuevoProducto
                        ? "__nuevo__"
                        : (linea.productoId ?? "")
                    }
                    onCambiar={(valor) =>
                      actualizarLinea(
                        indice,
                        valor === "__nuevo__"
                          ? {
                              productoId: null,
                              nuevoProducto: {
                                nombre: "",
                                categoriaCodigo: "ALI",
                                subcategoriaCodigo: null,
                              },
                            }
                          : { productoId: valor, nuevoProducto: null },
                      )
                    }
                    placeholder="Buscar producto..."
                  />
                  {linea.nuevoProducto && (
                    <div className="producto-nuevo-campos">
                      <input
                        required
                        aria-label="Nombre del nuevo producto"
                        placeholder="Nombre"
                        value={linea.nuevoProducto.nombre}
                        onChange={(evento) =>
                          actualizarLinea(indice, {
                            nuevoProducto: {
                              ...linea.nuevoProducto!,
                              nombre: evento.target.value,
                            },
                          })
                        }
                      />
                      <select
                        aria-label="Categoría"
                        value={linea.nuevoProducto.categoriaCodigo}
                        onChange={(evento) =>
                          actualizarLinea(indice, {
                            nuevoProducto: {
                              ...linea.nuevoProducto!,
                              categoriaCodigo: evento.target.value as
                                | "ALI"
                                | "SNK"
                                | "BEB",
                              subcategoriaCodigo:
                                evento.target.value === "BEB" ? "V" : null,
                            },
                          })
                        }
                      >
                        <option value="ALI">Almacén</option>
                        <option value="SNK">Snack</option>
                        <option value="BEB">Bebida</option>
                      </select>
                      {linea.nuevoProducto.categoriaCodigo === "BEB" && (
                        <select
                          aria-label="Subcategoría de bebida"
                          value={linea.nuevoProducto.subcategoriaCodigo ?? "V"}
                          onChange={(evento) =>
                            actualizarLinea(indice, {
                              nuevoProducto: {
                                ...linea.nuevoProducto!,
                                subcategoriaCodigo: evento.target.value as
                                  | "V"
                                  | "C"
                                  | "G",
                              },
                            })
                          }
                        >
                          <option value="V">Vino</option>
                          <option value="C">Cerveza</option>
                          <option value="G">Gaseosa / agua saborizada</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
                <span className="categoria-linea-compra">
                  {(linea.nuevoProducto
                    ? (
                        { ALI: "Almacén", SNK: "Snack", BEB: "Bebida" } as const
                      )[linea.nuevoProducto.categoriaCodigo]
                    : null) ||
                    productoSeleccionado?.categoria ||
                    "—"}
                </span>
                <input
                  aria-label="Cantidad"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={linea.cantidad}
                  onChange={(evento) =>
                    actualizarLinea(indice, {
                      cantidad: Number(evento.target.value),
                    })
                  }
                  placeholder="Cantidad"
                />
                <label className="campo-moneda">
                  <span aria-hidden="true">$</span>
                  <input
                    aria-label="Costo unitario en pesos"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={linea.costoUnitario}
                    onChange={(evento) =>
                      actualizarLinea(indice, {
                        costoUnitario: Number(evento.target.value),
                      })
                    }
                    placeholder="0,00"
                  />
                </label>
                <strong className="subtotal-linea-compra">
                  {dinero(subtotal)}
                </strong>
                <input
                  aria-label="Vencimiento"
                  type="date"
                  value={linea.fechaVencimiento}
                  onChange={(evento) =>
                    actualizarLinea(indice, {
                      fechaVencimiento: evento.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  className="accion-tabla"
                  aria-label="Quitar producto"
                  disabled={lineas.length === 1}
                  onClick={() =>
                    setLineas((actuales) =>
                      actuales.filter((_, i) => i !== indice),
                    )
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <div className="formulario-acciones">
          <strong>Total factura: {dinero(total)}</strong>
          <button
            type="submit"
            className="boton boton--primario"
            disabled={!valido || guardando}
          >
            {guardando ? "Guardando…" : "Guardar factura y crear lotes"}
          </button>
        </div>
      </div>
    </form>
  );
}

interface RegistrarCompraPaginaProps {
  productos: ProductoInventario[];
  compras: CompraHistorial[];
  guardando: boolean;
  onGuardar: (entrada: RegistrarCompraEntrada) => Promise<void>;
}

export function RegistrarCompraPagina({
  productos,
  compras,
  guardando,
  onGuardar,
}: RegistrarCompraPaginaProps): JSX.Element {
  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <p className="eyebrow">Compras / Nueva compra</p>
          <h1>Registrar nueva compra</h1>
          <p className="subtitulo">
            Cargá la factura: cada detalle generará un lote y sumará stock.
          </p>
        </div>
      </div>
      <FacturaFormulario
        productos={productos.filter((producto) => producto.estaActivo)}
        compras={compras}
        guardando={guardando}
        onGuardar={onGuardar}
      />
    </section>
  );
}
