let paginaCatalogo = 0;
const productosPorPagina = 10;
function renderCatalogoFiltrado() {
  const filtro = ($('#filtro-productos').value || '').trim().toLocaleLowerCase();
  const categoria = $('#categoria-productos').value;
  const filtrados = productos.filter((producto) =>
    producto.nombre.toLocaleLowerCase().includes(filtro) &&
    (!categoria || producto.categoria === categoria),
  );
  const paginas = Math.max(1, Math.ceil(filtrados.length / productosPorPagina));
  paginaCatalogo = Math.min(paginaCatalogo, paginas - 1);
  const visibles = filtrados.slice(paginaCatalogo * productosPorPagina, (paginaCatalogo + 1) * productosPorPagina);
  $('#catalogo').innerHTML = visibles.map((producto) => { const cantidad = carrito.get(producto.id) ?? 0; return `<article class="producto"><div><strong>${producto.nombre}</strong><small>${producto.categoria} · ${producto.id} · ${dinero(producto.precio)}</small></div><div class="controles"><button data-producto="${producto.id}" data-cambio="-1">−</button><span class="cantidad">${cantidad}</span><button data-producto="${producto.id}" data-cambio="1">+</button></div></article>`; }).join('') || '<p class="ayuda">No encontramos productos.</p>';
  $('#paginacion-productos').innerHTML = `<button type="button" data-pagina="anterior" ${paginaCatalogo === 0 ? 'disabled' : ''}>‹ Anterior</button><span>Página ${paginaCatalogo + 1} de ${paginas} · ${filtrados.length} productos</span><button type="button" data-pagina="siguiente" ${paginaCatalogo >= paginas - 1 ? 'disabled' : ''}>Siguiente ›</button>`;
  const seleccionados = [...carrito].filter(([, cantidad]) => cantidad > 0);
  const total = seleccionados.reduce((suma, [id, cantidad]) => suma + productos.find((producto) => producto.id === id).precio * cantidad, 0);
  $('#resumen-carrito').innerHTML = `<h3>Resumen del pedido</h3>${seleccionados.length ? seleccionados.map(([id, cantidad]) => { const producto = productos.find((item) => item.id === id); return `<div class="resumen-linea"><span>${cantidad} × ${producto.nombre}</span><strong>${dinero(cantidad * producto.precio)}</strong></div>`; }).join('') : '<p class="ayuda">Los productos que agregues aparecerán aquí.</p>'}<div class="resumen-linea resumen-total"><span>Total</span><strong>${dinero(total)}</strong></div>`;
  const cantidadTotal = seleccionados.reduce((suma, [, cantidad]) => suma + cantidad, 0);
  $('#contador').textContent = `${cantidadTotal} ${cantidadTotal === 1 ? 'producto' : 'productos'}`;
  $('#total-boton').textContent = dinero(total);
  $('#previsualizar').disabled = cantidadTotal === 0 || !clienteActual;
}
function renderListaPrecios() {
  const filtro = ($('#filtro-precios').value || '').trim().toLocaleLowerCase();
  $('#lista-precios').innerHTML = productos.filter((producto) => `${producto.nombre} ${producto.categoria} ${producto.id}`.toLocaleLowerCase().includes(filtro)).map((producto) => `<article class="precio-item"><div><strong>${producto.nombre}</strong><small>${producto.id} · ${producto.categoria}</small></div><strong>${dinero(producto.precio)}</strong></article>`).join('') || '<p class="ayuda">No encontramos productos.</p>';
}
$('#filtro-productos').addEventListener('input', renderCatalogoFiltrado);
$('#categoria-productos').innerHTML += [...new Set(productos.map((producto) => producto.categoria))].map((categoria) => `<option value="${categoria}">${categoria}</option>`).join('');
$('#categoria-productos').addEventListener('change', () => { paginaCatalogo = 0; renderCatalogoFiltrado(); });
$('#paginacion-productos').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-pagina]');
  if (!boton || boton.disabled) return;
  paginaCatalogo += boton.dataset.pagina === 'siguiente' ? 1 : -1;
  renderCatalogoFiltrado();
});
$('#catalogo').addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-producto]');
  if (!boton) return;
  const id = boton.dataset.producto;
  const cantidad = Math.max(0, (carrito.get(id) ?? 0) + Number(boton.dataset.cambio));
  cantidad ? carrito.set(id, cantidad) : carrito.delete(id);
  renderCatalogoFiltrado();
});
$('#filtro-precios').addEventListener('input', renderListaPrecios);
renderCatalogoFiltrado();
renderListaPrecios();
