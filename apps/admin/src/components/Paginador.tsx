import { REGISTROS_POR_PAGINA } from "../comun/formato";
import "./Paginador.css";

interface PaginadorProps {
  total: number;
  pagina: number;
  onCambiar: (pagina: number) => void;
}

export function Paginador({
  total,
  pagina,
  onCambiar,
}: PaginadorProps): JSX.Element | null {
  const paginas = Math.max(1, Math.ceil(total / REGISTROS_POR_PAGINA));
  if (total <= REGISTROS_POR_PAGINA) return null;

  return (
    <div className="paginador" aria-label="Paginación">
      <button
        type="button"
        className="boton boton--secundario"
        disabled={pagina === 1}
        onClick={() => onCambiar(pagina - 1)}
      >
        ← Anterior
      </button>
      <span>
        Página {pagina} de {paginas}
      </span>
      <button
        type="button"
        className="boton boton--secundario"
        disabled={pagina === paginas}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente →
      </button>
    </div>
  );
}
