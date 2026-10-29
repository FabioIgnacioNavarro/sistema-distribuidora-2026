import { useEffect, useRef, useState } from "react";

export interface OpcionBuscador {
  valor: string;
  etiqueta: string;
}

interface BuscadorListaProps {
  opciones: OpcionBuscador[];
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder: string;
}

export function BuscadorLista({
  opciones,
  valor,
  onCambiar,
  placeholder,
}: BuscadorListaProps): JSX.Element {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const referencia = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cerrarAlHacerClickFuera = (evento: MouseEvent): void => {
      if (
        referencia.current &&
        !referencia.current.contains(evento.target as Node)
      ) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", cerrarAlHacerClickFuera);
    return () =>
      document.removeEventListener("mousedown", cerrarAlHacerClickFuera);
  }, []);

  const seleccionada = opciones.find((opcion) => opcion.valor === valor);
  const coincidencias = opciones
    .filter((opcion) =>
      opcion.etiqueta.toLowerCase().includes(texto.toLowerCase()),
    )
    .slice(0, 20);

  return (
    <div className="buscador-lista" ref={referencia}>
      <input
        value={abierto ? texto : (seleccionada?.etiqueta ?? "")}
        placeholder={placeholder}
        onFocus={() => {
          setAbierto(true);
          setTexto("");
        }}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setAbierto(true);
        }}
      />
      {abierto && (
        <div className="buscador-lista__resultados">
          {coincidencias.map((opcion) => (
            <button
              type="button"
              key={opcion.valor}
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => {
                onCambiar(opcion.valor);
                setTexto("");
                setAbierto(false);
              }}
            >
              {opcion.etiqueta}
            </button>
          ))}
          {coincidencias.length === 0 && (
            <span>No se encontraron resultados.</span>
          )}
        </div>
      )}
    </div>
  );
}
