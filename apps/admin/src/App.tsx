import { useMemo, useState } from 'react';
import type { LoteInventario, ProductoInventario } from '@distribuidora/tipos-compartidos';

type Vista = 'inicio' | 'productos' | 'lotes' | 'clientes';

const productosIniciales: ProductoInventario[] = [
  { id: 'p-1', sku: 'ALI-059', nombre: 'Aceite Cocinero 900cc Girasol', categoria: 'Almacén', precioVenta: 3190, markupPct: 24.41, stockTotal: 168, estaActivo: true },
  { id: 'p-2', sku: 'ALI-036.0', nombre: 'Aceite Legítimo 1500cc Girasol', categoria: 'Almacén', precioVenta: 4750, markupPct: 30, stockTotal: 60, estaActivo: true },
  { id: 'p-3', sku: 'ALI-037.OF', nombre: 'Aceite Legítimo 900cc Girasol', categoria: 'Almacén', precioVenta: 3190, markupPct: 26, stockTotal: 228, estaActivo: true },
  { id: 'p-4', sku: 'BEB-V013', nombre: 'Alaris Cabernet Sauvignon', categoria: 'Bebidas', precioVenta: 4100, markupPct: 17.1, stockTotal: 24, estaActivo: true },
  { id: 'p-5', sku: 'SNK-003', nombre: 'Crutons Minitostaditas 100 gr · Queso', categoria: 'Snacks', precioVenta: 1800, markupPct: 30, stockTotal: 42, estaActivo: true },
];

const lotesIniciales: LoteInventario[] = [
  { id: 'l-1', productoId: 'p-1', codigoLote: '1503-Carrefour-15-08-2026', cantidadOriginal: 100, cantidadRestante: 72, costoUnitario: 2564.1, fechaVencimiento: '2027-08-15', recibidoEn: '2026-08-15' },
  { id: 'l-2', productoId: 'p-1', codigoLote: '1810-Mayorista-02-10-2026', cantidadOriginal: 68, cantidadRestante: 68, costoUnitario: 2630, fechaVencimiento: '2027-10-02', recibidoEn: '2026-10-02' },
  { id: 'l-3', productoId: 'p-2', codigoLote: '1601-Distribuidor-20-08-2026', cantidadOriginal: 60, cantidadRestante: 60, costoUnitario: 3800, fechaVencimiento: null, recibidoEn: '2026-08-20' },
  { id: 'l-4', productoId: 'p-3', codigoLote: '1708-Carrefour-25-09-2026', cantidadOriginal: 228, cantidadRestante: 228, costoUnitario: 2532, fechaVencimiento: '2027-09-25', recibidoEn: '2026-09-25' },
  { id: 'l-5', productoId: 'p-4', codigoLote: 'VINO-2026-09', cantidadOriginal: 24, cantidadRestante: 24, costoUnitario: 3500, fechaVencimiento: null, recibidoEn: '2026-09-10' },
];

const dinero = (valor: number): string => valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const porcentaje = (valor: number): string => `${valor.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;

export default function App(): JSX.Element {
  const [vista, setVista] = useState<Vista>('inicio');
  const [oscuro, setOscuro] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [lotesAbiertos, setLotesAbiertos] = useState<Set<string>>(new Set());
  const categorias = ['Todas', ...new Set(productosIniciales.map((producto) => producto.categoria))];
  const productos = useMemo(() => productosIniciales.filter((producto) => {
    const coincideTexto = `${producto.sku} ${producto.nombre}`.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase());
    return coincideTexto && (categoria === 'Todas' || producto.categoria === categoria);
  }), [busqueda, categoria]);
  const lotePorProducto = (productoId: string): LoteInventario[] => lotesIniciales.filter((lote) => lote.productoId === productoId);

  const navegar = (nuevaVista: Vista): void => { setVista(nuevaVista); setBusqueda(''); setCategoria('Todas'); };
  const alternarLotes = (productoId: string): void => setLotesAbiertos((actuales) => { const siguiente = new Set(actuales); if (siguiente.has(productoId)) siguiente.delete(productoId); else siguiente.add(productoId); return siguiente; });

  return <div className={oscuro ? 'app app--oscura' : 'app'}>
    <aside className="barra-lateral">
      <div className="marca"><span className="marca__simbolo">F</span><span>FONTANA<br /><small>DISTRIBUCIONES</small></span></div>
      <div className="perfil"><span className="avatar">M</span><span><strong>Martín</strong><small>Administrador</small></span></div>
      <nav className="menu" aria-label="Navegación principal">
        <button className={vista === 'inicio' ? 'menu__item menu__item--activo' : 'menu__item'} onClick={() => navegar('inicio')}><span>⌂</span>Panel de inicio</button>
        <p className="menu__grupo">Operación</p>
        <button className={vista === 'productos' ? 'menu__item menu__item--activo' : 'menu__item'} onClick={() => navegar('productos')}><span>▦</span>Productos</button>
        <button className={vista === 'lotes' ? 'menu__item menu__item--activo' : 'menu__item'} onClick={() => navegar('lotes')}><span>▤</span>Stock y lotes</button>
        <button className="menu__item" onClick={() => navegar('clientes')}><span>♙</span>Clientes</button>
        <p className="menu__grupo">Ventas y logística</p>
        <button className="menu__item menu__item--proximamente" onClick={() => undefined}><span>↗</span>Pedidos <em>Próximo</em></button>
        <button className="menu__item menu__item--proximamente" onClick={() => undefined}><span>◫</span>Rentabilidad <em>Próximo</em></button>
        <button className="menu__item menu__item--proximamente" onClick={() => undefined}><span>⇢</span>Rutas de reparto <em>Próximo</em></button>
      </nav>
      <div className="barra-lateral__pie"><button className="menu__item"><span>⚙</span>Configuración</button><small>V1 · Gestión Fontana</small></div>
    </aside>
    <main className="contenido-principal">
      <header className="cabecera"><div><span className="miga">Admin / </span><strong>{vista === 'inicio' ? 'Panel de inicio' : vista === 'productos' ? 'Productos' : vista === 'lotes' ? 'Stock y lotes' : 'Clientes'}</strong></div><div className="cabecera__acciones"><button className="boton-icono" onClick={() => setOscuro(!oscuro)} aria-label="Cambiar tema">{oscuro ? '☼' : '◐'}</button><button className="notificacion" aria-label="Notificaciones">♧<i /></button><span className="avatar avatar--pequeno">M</span></div></header>
      {vista === 'inicio' && <Inicio navegar={navegar} productos={productosIniciales} lotes={lotesIniciales} />}
      {(vista === 'productos' || vista === 'lotes') && <Inventario vista={vista} productos={productos} lotes={lotesIniciales} categorias={categorias} busqueda={busqueda} categoria={categoria} setBusqueda={setBusqueda} setCategoria={setCategoria} lotesAbiertos={lotesAbiertos} alternarLotes={alternarLotes} />}
      {vista === 'clientes' && <ClientesPlaceholder navegar={navegar} />}
    </main>
  </div>;
}

function Inicio({ navegar, productos, lotes }: { navegar: (vista: Vista) => void; productos: ProductoInventario[]; lotes: LoteInventario[] }): JSX.Element {
  const stockTotal = productos.reduce((total, producto) => total + producto.stockTotal, 0);
  return <section className="pagina"><div className="pagina__encabezado"><div><p className="eyebrow">Lunes, 26 de octubre de 2026</p><h1>Panel de inicio</h1><p className="subtitulo">Una vista rápida de la operación de Fontana Distribuciones.</p></div><button className="boton boton--primario" onClick={() => navegar('productos')}>+ Gestionar inventario</button></div><div className="tarjetas"><article className="tarjeta tarjeta--verde"><span className="tarjeta__icono">▦</span><strong>{productos.length}</strong><span>Productos activos</span><small>Catálogo vigente</small></article><article className="tarjeta"><span className="tarjeta__icono tarjeta__icono--gris">▤</span><strong>{stockTotal}</strong><span>Unidades en stock</span><small>Distribuidas en {lotes.length} lotes</small></article><article className="tarjeta tarjeta--alerta"><span className="tarjeta__icono tarjeta__icono--amarillo">!</span><strong>3</strong><span>Alertas de inventario</span><small>Requieren revisión</small></article><article className="tarjeta"><span className="tarjeta__icono tarjeta__icono--gris">↗</span><strong>$0</strong><span>Ventas del día</span><small>Se conectará con pedidos</small></article></div><div className="seccion-doble"><article className="panel"><div className="panel__encabezado"><div><h2>Actividad reciente</h2><p>Los movimientos más importantes del sistema.</p></div><button className="enlace" onClick={() => navegar('lotes')}>Ver inventario →</button></div><div className="actividad"><div><span className="actividad__punto actividad__punto--verde" /><p><strong>Inventario listo para gestionar</strong><small>Los productos y lotes están separados según FIFO.</small></p><time>Ahora</time></div><div><span className="actividad__punto actividad__punto--gris" /><p><strong>Comisión inicial configurada</strong><small>El valor vigente para vendedores es 10%.</small></p><time>Configuración</time></div></div></article><article className="panel panel--verde"><p className="eyebrow">Próximo módulo</p><h2>Pedidos y rentabilidad</h2><p>La siguiente etapa conectará ventas, remitos y el cálculo congelado de comisión.</p><button className="boton boton--claro" onClick={() => navegar('productos')}>Continuar con inventario</button></article></div></section>;
}

function Inventario({ vista, productos, lotes, categorias, busqueda, categoria, setBusqueda, setCategoria, lotesAbiertos, alternarLotes }: { vista: 'productos' | 'lotes'; productos: ProductoInventario[]; lotes: LoteInventario[]; categorias: string[]; busqueda: string; categoria: string; setBusqueda: (valor: string) => void; setCategoria: (valor: string) => void; lotesAbiertos: Set<string>; alternarLotes: (id: string) => void }): JSX.Element {
  const mostrarLotes = vista === 'lotes';
  return <section className="pagina"><div className="pagina__encabezado"><div><p className="eyebrow">Operación / {mostrarLotes ? 'Stock y lotes' : 'Productos'}</p><h1>{mostrarLotes ? 'Stock y lotes' : 'Productos'}</h1><p className="subtitulo">{mostrarLotes ? 'Controlá el stock por producto y el detalle de cada lote.' : 'Administrá el catálogo, precios y disponibilidad comercial.'}</p></div><button className="boton boton--primario">+ Nuevo producto</button></div><div className="barra-filtros"><label className="buscador"><span>⌕</span><input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por SKU o nombre..." /></label><select value={categoria} onChange={(evento) => setCategoria(evento.target.value)}>{categorias.map((item) => <option key={item} value={item}>{item === 'Todas' ? 'Todas las categorías' : item}</option>)}</select><button className="boton-filtro">☷ Filtros</button></div><div className="tabla-contenedor"><table><thead><tr><th>{mostrarLotes ? 'Producto' : 'Producto / SKU'}</th><th>Categoría</th><th>Precio público</th><th>Stock actual</th><th>Estado</th><th aria-label="Acciones" /></tr></thead><tbody>{productos.map((producto) => { const lotesProducto = lotes.filter((lote) => lote.productoId === producto.id); const abierto = lotesAbiertos.has(producto.id); const porcentajeStock = lotesProducto.reduce((total, lote) => total + lote.cantidadRestante, 0) / Math.max(producto.stockTotal, 1) * 100; return <>{<tr key={producto.id} className={abierto ? 'fila-producto fila-producto--abierta' : 'fila-producto'}><td><div className="producto-celda"><button className="expansor" onClick={() => alternarLotes(producto.id)} aria-label={abierto ? 'Ocultar lotes' : 'Mostrar lotes'}>{abierto ? '⌄' : '›'}</button><span><strong>{producto.nombre}</strong><small>{producto.sku}</small></span></div></td><td><span className="etiqueta-categoria">{producto.categoria}</span></td><td><strong>{dinero(producto.precioVenta)}</strong><small className="dato-secundario">Markup {porcentaje(producto.markupPct)}</small></td><td><div className="stock-celda"><strong>{producto.stockTotal} u.</strong><div className="barra-stock"><i style={{ width: `${Math.min(100, porcentajeStock)}%` }} /></div></div></td><td><span className="estado estado--activo">Activo</span></td><td><button className="accion-tabla" aria-label="Más acciones">•••</button></td></tr>}{abierto && mostrarLotes && lotesProducto.map((lote) => <tr className="fila-lote" key={lote.id}><td><span className="lote-nombre">↳ <strong>{lote.codigoLote}</strong><small>Recibido {lote.recibidoEn}</small></span></td><td><span className="dato-secundario">Costo unitario</span></td><td>{dinero(lote.costoUnitario)}</td><td><div className="stock-celda"><strong>{lote.cantidadRestante} / {lote.cantidadOriginal} u.</strong><div className="barra-stock barra-stock--lote"><i style={{ width: `${lote.cantidadRestante / lote.cantidadOriginal * 100}%` }} /></div></div></td><td><span className={lote.cantidadRestante === 0 ? 'estado estado--agotado' : 'estado estado--lote'}>{lote.cantidadRestante === 0 ? 'Agotado' : 'Disponible'}</span></td><td /></tr>)}</>; })}</tbody></table>{productos.length === 0 && <div className="vacio"><strong>No encontramos productos</strong><span>Probá con otro nombre, SKU o categoría.</span></div>}</div></section>;
}

function ClientesPlaceholder({ navegar }: { navegar: (vista: Vista) => void }): JSX.Element { return <section className="pagina"><div className="pagina__encabezado"><div><p className="eyebrow">Operación / Clientes</p><h1>Clientes</h1><p className="subtitulo">Este módulo será el siguiente paso después de cerrar inventario.</p></div><button className="boton boton--primario" onClick={() => navegar('productos')}>Volver a inventario</button></div><div className="panel panel--vacio"><span className="panel__icono">♙</span><h2>Clientes conectados a pedidos</h2><p>La estructura ya contempla código, nombre comercial, dirección y contacto. La pantalla se conectará al servicio de clientes en la próxima iteración.</p></div></section>; }
