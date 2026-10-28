const productos = [
  {
    id: "ALI-059",
    nombre: "Aceite Cocinero 900cc",
    categoria: "Almacén",
    precio: 3190,
  },
  {
    id: "BEB-V013",
    nombre: "Alaris Cab. Sauvignon",
    categoria: "Bebidas",
    precio: 4100,
  },
  {
    id: "SNK-003",
    nombre: "Crutons Minitostaditas Queso",
    categoria: "Snacks",
    precio: 1800,
  },
  {
    id: "ALI-045.1",
    nombre: "Fideo Santa Isabel 500g Coditos",
    categoria: "Almacén",
    precio: 600,
  },
  { id: "ALI-046.1", nombre: "Fideo Santa Isabel 500g Mostachol", categoria: "Almacén", precio: 600 },
  { id: "ALI-047.1", nombre: "Fideo Santa Isabel 500g Spaghetti", categoria: "Almacén", precio: 600 },
  { id: "ALI-048.1", nombre: "Fideo Santa Isabel 500g Tallarín", categoria: "Almacén", precio: 600 },
  { id: "ALI-050.OF", nombre: "Puré de tomate Santa Isabel 520g", categoria: "Almacén", precio: 620 },
  { id: "ALI-036.0", nombre: "Aceite Legítimo 1500cc", categoria: "Almacén", precio: 4750 },
  { id: "ALI-037.OF", nombre: "Aceite Legítimo 900cc", categoria: "Almacén", precio: 3190 },
  { id: "ALI-061", nombre: "Arroz largo fino 1kg", categoria: "Almacén", precio: 1250 },
  { id: "ALI-072", nombre: "Azúcar común 1kg", categoria: "Almacén", precio: 1100 },
  { id: "ALI-083", nombre: "Harina de trigo 1kg", categoria: "Almacén", precio: 980 },
  { id: "ALI-091", nombre: "Yerba mate 1kg", categoria: "Almacén", precio: 2850 },
  { id: "BEB-G002.1", nombre: "Coca-Cola PET 2250cc", categoria: "Bebidas", precio: 3600 },
  { id: "BEB-G007.NF", nombre: "Sprite PET 2250cc", categoria: "Bebidas", precio: 3600 },
  { id: "BEB-G014.1", nombre: "Aquarius 2500cc Limonada", categoria: "Bebidas", precio: 2135 },
  { id: "BEB-G015.1", nombre: "Aquarius 2500cc Manzana", categoria: "Bebidas", precio: 2135 },
  { id: "BEB-V012", nombre: "Alaris Malbec", categoria: "Bebidas", precio: 4100 },
  { id: "BEB-L001.1", nombre: "Fernet Branca 750cc", categoria: "Bebidas", precio: 14450 },
  { id: "SNK-002", nombre: "Crutons Minitostaditas Jamón", categoria: "Snacks", precio: 1800 },
  { id: "SNK-004", nombre: "Crutons Minitostaditas Salame", categoria: "Snacks", precio: 1800 },
  { id: "SNK-011", nombre: "Papas fritas clásicas 100g", categoria: "Snacks", precio: 1500 },
  { id: "SNK-014", nombre: "Maní tostado salado 100g", categoria: "Snacks", precio: 950 },
];
const clientes = [
  {
    codigo: "CL-0000",
    nombre: "Tickets bajos",
    direccion: "NNN",
    telefono: "",
  },
  {
    codigo: "CL-0001",
    nombre: "Avicola 912",
    direccion: "La Pampa 1048",
    telefono: "362 455 9207",
  },
  {
    codigo: "CL-0002",
    nombre: "Kiosco Gema (Tati)",
    direccion: "Puerto de Palos 23",
    telefono: "362 428 5102",
  },
];
const pedidos = [
  {
    numero: "10001",
    cliente: "Avicola 912",
    total: 15400,
    cobrado: 0,
    ganancia: 1538,
    condicionPago: "Cuenta corriente · 7 días",
    estadoCobro: "Sin cobrar",
    cobrado: 0,
    condicionPago: "Cuenta corriente · 7 días",
    estadoCobro: "Sin cobrar",
    detalle: [
      { producto: "Aceite Cocinero 900cc", cantidad: 2, importe: 6380 },
      { producto: "Crutons Minitostaditas Queso", cantidad: 5, importe: 9000 },
    ],
  },
  {
    numero: "10000",
    cliente: "Tickets bajos",
    total: 48600,
    cobrado: 48600,
    ganancia: 4860,
    condicionPago: "Transferencia",
    estadoCobro: "Cobrado totalmente",
    cobrado: 48600,
    condicionPago: "Transferencia",
    estadoCobro: "Cobrado totalmente",
    detalle: [
      {
        producto: "Fideo Santa Isabel 500g Coditos",
        cantidad: 12,
        importe: 7200,
      },
      { producto: "Alaris Cab. Sauvignon", cantidad: 10, importe: 41000 },
    ],
  },
];
const carrito = new Map();
let clienteActual = null;
const dinero = (valor) => `$${valor.toLocaleString("es-AR")}`;
const $ = (selector) => document.querySelector(selector);
function mostrarVista(nombre) {
  document
    .querySelectorAll(".vista")
    .forEach((vista) => vista.classList.remove("activa"));
  $(`#vista-${nombre}`).classList.add("activa");
  document
    .querySelectorAll(".navegacion button")
    .forEach((boton) =>
      boton.classList.toggle(
        "seleccionada",
        boton.dataset.vista === nombre ||
          (nombre === "remito" && boton.dataset.vista === "pedido"),
      ),
    );
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function renderCatalogo() {
  if (typeof renderCatalogoFiltrado === "function") {
    renderCatalogoFiltrado();
    return;
  }
  $("#catalogo").innerHTML = productos
    .map((producto) => {
      const cantidad = carrito.get(producto.id) ?? 0;
      return `<article class="producto"><div><strong>${producto.nombre}</strong><small>${producto.id} · ${dinero(producto.precio)}</small></div><div class="controles"><button data-producto="${producto.id}" data-cambio="-1">−</button><span class="cantidad">${cantidad}</span><button data-producto="${producto.id}" data-cambio="1">+</button></div></article>`;
    })
    .join("");
  const cantidadTotal = [...carrito.values()].reduce(
    (suma, cantidad) => suma + cantidad,
    0,
  );
  const total = [...carrito].reduce(
    (suma, [id, cantidad]) =>
      suma + productos.find((producto) => producto.id === id).precio * cantidad,
    0,
  );
  $("#contador").textContent =
    `${cantidadTotal} ${cantidadTotal === 1 ? "producto" : "productos"}`;
  $("#total-boton").textContent = dinero(total);
  $("#previsualizar").disabled = cantidadTotal === 0 || !clienteActual;
}
function renderClientes(filtro = "") {
  const termino = filtro.trim().toLocaleLowerCase();
  const resultados = clientes.filter((cliente) =>
    `${cliente.codigo} ${cliente.nombre} ${cliente.telefono}`
      .toLocaleLowerCase()
      .includes(termino),
  );
  $("#clientes-resultados").innerHTML =
    resultados
      .map(
        (cliente) =>
          `<button type="button" class="cliente-opcion" data-cliente="${cliente.codigo}"><strong>${cliente.nombre}</strong><small>${cliente.codigo} · ${cliente.direccion}</small></button>`,
      )
      .join("") ||
    '<p class="ayuda">No encontramos clientes con esa búsqueda.</p>';
}
function seleccionarCliente(cliente) {
  clienteActual = cliente;
  $("#cliente-seleccionado").hidden = false;
  $("#cliente-seleccionado").textContent =
    `Cliente seleccionado: ${cliente.nombre}`;
  $("#buscar-cliente").value = cliente.nombre;
  $("#clientes-resultados").innerHTML = "";
  renderCatalogo();
}
function renderRemito() {
  const lineas = [...carrito]
    .map(([id, cantidad]) => {
      const producto = productos.find((item) => item.id === id);
      return `<div class="remito-linea"><div><strong>${producto.nombre}</strong><small>${cantidad} × ${dinero(producto.precio)}</small></div><strong>${dinero(cantidad * producto.precio)}</strong></div>`;
    })
    .join("");
  const total = [...carrito].reduce(
    (suma, [id, cantidad]) =>
      suma + productos.find((producto) => producto.id === id).precio * cantidad,
    0,
  );
  const condicion = $("#condicion-pago").selectedOptions[0].textContent;
  $("#remito").innerHTML =
    `<div class="remito-cabecera"><div><strong>FONTANA DISTRIBUCIONES</strong><small>Remito de pedido</small></div><strong>PREVISUALIZACIÓN</strong></div><p><b>Cliente:</b> ${clienteActual.nombre}</p><p><b>Condición de pago:</b> ${condicion}</p>${lineas}<div class="total"><span>TOTAL PEDIDO</span><span>${dinero(total)}</span></div>`;
}
function renderHistorial() {
  $("#historial-pedidos").innerHTML = pedidos
    .map(
      (pedido) =>
        `<details class="pedido-anterior"><summary><div><strong>#${pedido.numero}</strong><small>${pedido.cliente} · ${dinero(pedido.total)}</small></div><span class="ver-detalle">Ver detalle</span></summary><div class="detalle-historial">${pedido.detalle.map((linea) => `<div><span>${linea.cantidad} × ${linea.producto}</span><strong>${dinero(linea.importe)}</strong></div>`).join("")}<div class="total-historial"><span>Total vendido</span><strong>${dinero(pedido.total)}</strong></div><div><span>Ganancia del pedido</span><strong>${dinero(pedido.ganancia)}</strong></div><div><span>Condición</span><strong>${pedido.condicionPago}</strong></div><div><span>Estado de cobro</span><strong>${pedido.estadoCobro}</strong></div><div><span>Saldo pendiente</span><strong>${dinero(pedido.total - pedido.cobrado)}</strong></div></div></details>`,
    )
    .join("");
}
function alternarTema() {
  document.body.classList.toggle("modo-oscuro");
  $("#alternar-tema").textContent = document.body.classList.contains(
    "modo-oscuro",
  )
    ? "☀"
    : "☾";
}
$("#ingresar").addEventListener("click", () => {
  const valido = $("#codigo-acceso").value === "pass1234";
  $("#error-acceso").hidden = valido;
  if (valido) $("#pantalla-acceso").classList.add("oculta");
});
$("#codigo-acceso").addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") $("#ingresar").click();
});
$("#alternar-tema").addEventListener("click", alternarTema);
$("#buscar-cliente").addEventListener("input", (evento) =>
  renderClientes(evento.target.value),
);
$("#clientes-resultados").addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-cliente]");
  if (boton)
    seleccionarCliente(
      clientes.find((cliente) => cliente.codigo === boton.dataset.cliente),
    );
});
$("#mostrar-alta-cliente").addEventListener("click", () => {
  $("#formulario-cliente").hidden = false;
  $("#nuevo-nombre").focus();
});
$("#formulario-cliente").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nuevo = {
    codigo: `TEMP-${clientes.length + 1}`,
    nombre: $("#nuevo-nombre").value.trim(),
    direccion: $("#nuevo-direccion").value.trim(),
    telefono: $("#nuevo-telefono").value.trim(),
  };
  if (!nuevo.nombre) return;
  clientes.push(nuevo);
  seleccionarCliente(nuevo);
  $("#formulario-cliente").reset();
  $("#formulario-cliente").hidden = true;
});
document.querySelectorAll("[data-vista]").forEach((boton) =>
  boton.addEventListener("click", () => {
    if (boton.dataset.vista === "pedido") {
      renderClientes();
      renderCatalogo();
    }
    mostrarVista(boton.dataset.vista);
  }),
);
$("#previsualizar").addEventListener("click", () => {
  renderRemito();
  mostrarVista("remito");
});
$("#confirmar").addEventListener("click", () => {
  carrito.clear();
  clienteActual = null;
  renderCatalogo();
  mostrarVista("confirmado");
});
renderHistorial();
renderClientes();
renderCatalogo();
