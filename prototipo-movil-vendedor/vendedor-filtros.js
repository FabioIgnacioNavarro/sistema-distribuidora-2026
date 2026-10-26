function renderCatalogoFiltrado() {
  const filtro = ($('#filtro-productos').value || '').trim().toLocaleLowerCase();
  const visibles = productos.filter((producto) => `${producto.nombre} ${producto.categoria} ${producto.id}`.toLocaleLowerCase().includes(filtro));
  $('#catalogo').innerHTML = visibles.map((producto) => { const cantidad = carrito.get(producto.id) ?? 0; return `<article class="producto"><div><strong>${producto.nombre}</strong><small>${producto.categoria} · ${producto.id} · ${dinero(producto.precio)}</small></div><div class="controles"><button data-producto="${producto.id}" data-cambio="-1">−</button><span class="cantidad">${cantidad}</span><button data-producto="${producto.id}" data-cambio="1">+</button></div></article>`; }).join('') || '<p class="ayuda">No encontramos productos.</p>';
}
function renderListaPrecios() {
  const filtro = ($('#filtro-precios').value || '').trim().toLocaleLowerCase();
  $('#lista-precios').innerHTML = productos.filter((producto) => `${producto.nombre} ${producto.categoria} ${producto.id}`.toLocaleLowerCase().includes(filtro)).map((producto) => `<article class="precio-item"><div><strong>${producto.nombre}</strong><small>${producto.id} · ${producto.categoria}</small></div><strong>${dinero(producto.precio)}</strong></article>`).join('') || '<p class="ayuda">No encontramos productos.</p>';
}
$('#filtro-productos').addEventListener('input', renderCatalogoFiltrado);
$('#filtro-precios').addEventListener('input', renderListaPrecios);
renderCatalogoFiltrado();
renderListaPrecios();
