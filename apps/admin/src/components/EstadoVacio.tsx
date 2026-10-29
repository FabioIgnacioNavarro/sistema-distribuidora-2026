interface EstadoVacioProps {
  texto: string;
}

export function EstadoVacio({ texto }: EstadoVacioProps): JSX.Element {
  return (
    <div className="vacio">
      <strong>{texto}</strong>
    </div>
  );
}
