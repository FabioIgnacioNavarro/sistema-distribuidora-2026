import { useState } from "react";
import type { FormEvent } from "react";
import type { CrearProductoEntrada } from "@distribuidora/tipos-compartidos";
import "./ModalNuevoProducto.css";

interface ModalNuevoProductoProps {
  guardando: boolean;
  onCerrar: () => void;
  onGuardar: (entrada: CrearProductoEntrada) => Promise<void>;
}

export function ModalNuevoProducto({
  guardando,
  onCerrar,
  onGuardar,
}: ModalNuevoProductoProps): JSX.Element {
  const [nombre, setNombre] = useState("");
  const [categoriaCodigo, setCategoriaCodigo] = useState<"ALI" | "SNK" | "BEB">(
    "ALI",
  );
  const [subcategoriaCodigo, setSubcategoriaCodigo] = useState<"V" | "C" | "G">(
    "V",
  );
  const [precioVenta, setPrecioVenta] = useState(0);
  const [markupPct, setMarkupPct] = useState(0);

  const enviar = (evento: FormEvent<HTMLFormElement>): void => {
    evento.preventDefault();
    void onGuardar({
      nombre,
      categoriaCodigo,
      subcategoriaCodigo: categoriaCodigo === "BEB" ? subcategoriaCodigo : null,
      precioVenta,
      markupPct,
    });
  };

  return (
    <div
      className="modal-fondo"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !guardando) onCerrar();
      }}
    >
      <section
        className="modal-tarjeta modal-producto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-producto"
      >
        <button
          type="button"
          className="modal-cerrar"
          aria-label="Cerrar"
          disabled={guardando}
          onClick={onCerrar}
        >
          ×
        </button>
        <p className="eyebrow">Catálogo / Nuevo producto</p>
        <h2 id="titulo-nuevo-producto">Cargar nuevo producto</h2>
        <form className="formulario-producto" onSubmit={enviar}>
          <label>
            Nombre del producto
            <input
              required
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej. Alfajor Guaymallén Blanco"
            />
          </label>
          <label>
            Categoría
            <select
              value={categoriaCodigo}
              onChange={(evento) => {
                const codigo = evento.target.value as "ALI" | "SNK" | "BEB";
                setCategoriaCodigo(codigo);
                if (codigo === "BEB") setSubcategoriaCodigo("V");
              }}
            >
              <option value="ALI">Almacén (ALI)</option>
              <option value="SNK">Snack (SNK)</option>
              <option value="BEB">Bebida (BEB)</option>
            </select>
          </label>
          {categoriaCodigo === "BEB" && (
            <label>
              Subcategoría de bebida
              <select
                value={subcategoriaCodigo}
                onChange={(evento) =>
                  setSubcategoriaCodigo(evento.target.value as "V" | "C" | "G")
                }
              >
                <option value="V">Vino (V)</option>
                <option value="C">Cerveza (C)</option>
                <option value="G">Gaseosa / agua saborizada (G)</option>
              </select>
            </label>
          )}
          <label>
            Precio de venta ($)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={precioVenta}
              onChange={(evento) => setPrecioVenta(Number(evento.target.value))}
            />
          </label>
          <label>
            Markup (%)
            <input
              required
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={markupPct}
              onChange={(evento) => setMarkupPct(Number(evento.target.value))}
            />
          </label>
          <div className="formulario-acciones">
            <button
              type="button"
              className="boton boton--secundario"
              disabled={guardando}
              onClick={onCerrar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="boton boton--primario"
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Crear producto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
