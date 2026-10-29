import type { ReactNode } from "react";

interface FiltrosProps {
  categorias: string[];
  onBuscar?: (texto: string) => void;
  categoria: string;
  onCategoria: (categoria: string) => void;
  mostrarCategoria?: boolean;
  placeholder?: string;
  children?: ReactNode;
}

export function Filtros({
  categorias,
  onBuscar,
  categoria,
  onCategoria,
  mostrarCategoria = true,
  placeholder = "Buscar por SKU o nombre...",
  children,
}: FiltrosProps): JSX.Element {
  return (
    <div className="barra-filtros">
      <label className="buscador">
        <span>⌕</span>
        <input
          onChange={(evento) => onBuscar?.(evento.target.value)}
          placeholder={placeholder}
        />
      </label>
      {mostrarCategoria && (
        <label>
          Categoría
          <select
            value={categoria}
            onChange={(evento) => onCategoria(evento.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      )}
      {children}
    </div>
  );
}
