const productos = [
  { id: 'ALI-059', nombre: 'Aceite Cocinero 900cc', precio: 3190 },
  { id: 'BEB-V013', nombre: 'Alaris Cab. Sauvignon', precio: 4100 },
  { id: 'SNK-003', nombre: 'Crutons Minitostaditas Queso', precio: 1800 },
  { id: 'ALI-045.1', nombre: 'Fideo Santa Isabel 500g Coditos', precio: 600 },
];
const pedidos = [{ numero: '10001', cliente: 'Avicola 912', total: 15400 }, { numero: '10000', cliente: 'Tickets bajos', total: 48600 }];
const carrito = new Map();
const dinero = (valor) => `$${valor.toLocaleString('es-AR')}`;
const $ = (selector) => document.querySelector(selector);

function mostrarVista(nombre) {
  document.querySelectorAll('.vista').forEach((vista) => vista.classList.remove('activa'));
  $(`#vista-${nombre}`).classList.add('activa');
  document.querySelectorAll('.navegacion button').forEach((boton) => boton.classList.toggle('seleccionada', boton.dataset.vista === nombre || (nombre === 'remito' && boton.dataset.vista === 'pedido')));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCatalogo() {
  $('#catalogo').innerHTML = productos.map((producto) => {
    const cantidad = carrito.get(producto.id) ?? 0;
    return `<article class="producto"><div><strong>${producto.nombre}</strong><small>${producto.id} · ${dinero(producto.precio)}</small></div><div class="controles"><button data-producto="${producto.id}" data-cambio="-1">−</button><span class="cantidad">${cantidad}</span><button data-producto="${producto.id}" data-cambio="1">+</button></div></article>`;
  }).join('');
  const cantidadTotal = [...carrito.values()].reduce((suma, cantidad) => suma + cantidad, 0);
  const total = [...carrito].reduce((suma, [id, cantidad]) => suma + productos.find((producto) => producto.id === id).precio * cantidad, 0);
  $('#contador').textContent = `${cantidadTotal} ${cantidadTotal === 1 ? 'producto' : 'productos'}`;
  $('#total-boton').textContent = dinero(total);
  $('#previsualizar').disabled = cantidadTotal === 0;
}

function renderRemito() {
  const cliente = $('#cliente').value;
  const lineas = [...carrito].map(([id, cantidad]) => { const producto = productos.find((item) => item.id === id); return `<div class="remito-linea"><div><strong>${producto.nombre}</strong><small>${cantidad} × ${dinero(producto.precio)}</small></div><strong>${dinero(cantidad * producto.precio)}</strong></div>`; }).join('');
  const total = [...carrito].reduce((suma, [id, cantidad]) => suma + productos.find((producto) => producto.id === id).precio * cantidad, 0);
  $('#remito').innerHTML = `<div class="remito-cabecera"><div><strong>FONTANA DISTRIBUCIONES</strong><small>Remito de pedido</small></div><strong>PREVISUALIZACIÓN</strong></div><p><b>Cliente:</b> ${cliente}</p>${lineas}<div class="total"><span>TOTAL PEDIDO</span><span>${dinero(total)}</span></div>`;
}

$('#resumen-pedidos').innerHTML = pedidos.map((pedido) => `<div class="pedido-anterior"><div><strong>#${pedido.numero}</strong><small>${pedido.cliente} · ${dinero(pedido.total)}</small></div></div>`).join('');
$('#catalogo').addEventListener('click', (evento) => { const boton = evento.target.closest('button[data-producto]'); if (!boton) return; const id = boton.dataset.producto; const cantidad = Math.max(0, (carrito.get(id) ?? 0) + Number(boton.dataset.cambio)); cantidad ? carrito.set(id, cantidad) : carrito.delete(id); renderCatalogo(); });
document.querySelectorAll('[data-vista]').forEach((boton) => boton.addEventListener('click', () => mostrarVista(boton.dataset.vista)));
$('#previsualizar').addEventListener('click', () => { renderRemito(); mostrarVista('remito'); });
$('#confirmar').addEventListener('click', () => { carrito.clear(); renderCatalogo(); mostrarVista('confirmado'); });
renderCatalogo();
