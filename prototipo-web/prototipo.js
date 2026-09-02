/* Comportamientos compartidos de la maqueta estática. */
(function () {
  const CLAVE_TEMA = 'distribuidora-tema';
  const CLAVE_SCROLL = 'distribuidora-sidebar-scroll';
  const CLAVE_SECCIONES = 'distribuidora-secciones-abiertas';

  const obtenerSecciones = () => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_SECCIONES) || '{}');
    } catch {
      return {};
    }
  };

  const guardarSecciones = (secciones) => {
    localStorage.setItem(CLAVE_SECCIONES, JSON.stringify(secciones));
  };

  function prepararBarra() {
    const barra = document.querySelector('.barra-lateral');
    const navegacion = barra?.querySelector('nav');
    if (!barra || !navegacion) return;

    const secciones = obtenerSecciones();
    const grupos = [];
    const hijos = Array.from(navegacion.children);
    let grupoActual = null;

    hijos.forEach((hijo) => {
      const encabezado = hijo.matches('.nav-seccion')
        ? hijo
        : hijo.querySelector?.(':scope > .nav-seccion');

      if (encabezado) {
        const nombre = encabezado.textContent.trim();
        grupoActual = { nombre, nodos: [] };
        grupos.push(grupoActual);
        if (hijo !== encabezado) {
          Array.from(hijo.children).forEach((nodo) => {
            if (nodo !== encabezado) grupoActual.nodos.push(nodo);
          });
        }
        return;
      }

      if (grupoActual) grupoActual.nodos.push(hijo);
      else {
        let general = grupos.find((grupo) => grupo.nombre === 'General');
        if (!general) {
          general = { nombre: 'General', nodos: [] };
          grupos.unshift(general);
        }
        general.nodos.push(hijo);
      }
    });

    navegacion.replaceChildren();
    grupos.forEach((grupo) => {
      const detalle = document.createElement('details');
      detalle.className = 'grupo-nav';
      detalle.dataset.seccion = grupo.nombre;
      const resumen = document.createElement('summary');
      resumen.className = 'nav-seccion';
      resumen.textContent = grupo.nombre;
      detalle.append(resumen, ...grupo.nodos);
      navegacion.append(detalle);

      const enlaceActivo = detalle.querySelector('.enlace-nav.activo');
      detalle.open = secciones[grupo.nombre] ?? Boolean(enlaceActivo);
      detalle.addEventListener('toggle', () => {
        const estado = obtenerSecciones();
        estado[grupo.nombre] = detalle.open;
        guardarSecciones(estado);
      });
    });

    const posicion = Number(sessionStorage.getItem(CLAVE_SCROLL) || 0);
    requestAnimationFrame(() => {
      barra.scrollTop = posicion;
    });
    barra.addEventListener('scroll', () => {
      sessionStorage.setItem(CLAVE_SCROLL, String(barra.scrollTop));
    }, { passive: true });
  }

  function prepararFilasDesplegables() {
    const rutas = /stock-productos|stock-lotes|logistica-rutas-activas|logistica-historial-rutas|ventas-historial/;
    if (!rutas.test(location.pathname)) return;

    document.querySelectorAll('tr.fila-padre').forEach((fila) => {
      const filasHijas = [];
      let siguiente = fila.nextElementSibling;
      while (siguiente && !siguiente.classList.contains('fila-padre')) {
        if (siguiente.classList.contains('fila-hija')) {
          filasHijas.push(siguiente);
        }
        siguiente = siguiente.nextElementSibling;
      }
      if (!filasHijas.length) return;

      fila.classList.add('fila-desplegable');
      fila.tabIndex = 0;
      const iniciarAbierto = /ventas-historial/.test(location.pathname);
      fila.setAttribute('aria-expanded', String(iniciarAbierto));
      fila.classList.toggle('fila-abierta', iniciarAbierto);
      const primeraCelda = fila.querySelector('td');
      if (primeraCelda) {
        const indicador = document.createElement('span');
        indicador.className = 'indicador-desplegable';
        indicador.setAttribute('aria-hidden', 'true');
        primeraCelda.prepend(indicador);
      }

      const alternar = () => {
        const abierto = fila.getAttribute('aria-expanded') === 'true';
        fila.setAttribute('aria-expanded', String(!abierto));
        fila.classList.toggle('fila-abierta', !abierto);
        filasHijas.forEach((filaHija) => filaHija.classList.toggle('fila-oculta', abierto));
      };
      fila.addEventListener('click', (evento) => {
        if (evento.target.closest('a, button, input, select')) return;
        alternar();
      });
      fila.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          alternar();
        }
      });
      filasHijas.forEach((filaHija) => filaHija.classList.toggle('fila-oculta', !iniciarAbierto));
    });
  }

  function prepararLotesDelDetalle() {
    if (!/ventas-historial/.test(location.pathname)) return;
    document.querySelectorAll('#detalle-pedido tr.fila-hija').forEach((fila) => {
      fila.classList.add('fila-lote-desplegable');
      fila.tabIndex = 0;
      fila.setAttribute('aria-expanded', 'true');
      const primeraCelda = fila.querySelector('td');
      if (primeraCelda) {
        const indicador = document.createElement('span');
        indicador.className = 'indicador-lote';
        indicador.setAttribute('aria-hidden', 'true');
        primeraCelda.prepend(indicador);
      }
      const alternar = () => {
        const abierto = fila.getAttribute('aria-expanded') === 'true';
        fila.setAttribute('aria-expanded', String(!abierto));
        fila.classList.toggle('lote-cerrado', abierto);
      };
      fila.addEventListener('click', alternar);
      fila.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          alternar();
        }
      });
    });
  }

  function prepararTema() {
    const temaGuardado = localStorage.getItem(CLAVE_TEMA) || 'claro';
    document.documentElement.dataset.tema = temaGuardado;
    const boton = document.querySelector('[data-cambiar-tema]');
    if (!boton) return;

    const actualizarEtiqueta = () => {
      const oscuro = document.documentElement.dataset.tema === 'oscuro';
      boton.textContent = oscuro ? '☀️ Usar modo claro' : '🌙 Usar modo oscuro';
      boton.setAttribute('aria-pressed', String(oscuro));
    };
    actualizarEtiqueta();
    boton.addEventListener('click', () => {
      const nuevoTema = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
      document.documentElement.dataset.tema = nuevoTema;
      localStorage.setItem(CLAVE_TEMA, nuevoTema);
      actualizarEtiqueta();
    });
  }

  function prepararSelectorDeColumnas() {
    const tabla = document.querySelector('[data-tabla-columnas="historial-pedidos"]');
    const selector = document.querySelector('[data-selector-columnas]');
    const boton = selector?.querySelector('[data-alternar-columnas]');
    const panel = selector?.querySelector('[data-panel-columnas]');
    if (!tabla || !selector || !boton || !panel) return;

    const clave = 'distribuidora-columnas-historial';
    let estado = {};
    try {
      estado = JSON.parse(localStorage.getItem(clave) || '{}');
    } catch {
      estado = {};
    }

    const encabezados = Array.from(tabla.tHead.rows[0].cells);
    encabezados.forEach((encabezado, indice) => {
      const nombre = encabezado.textContent.trim();
      if (indice === 0 || !nombre) return;
      const etiqueta = document.createElement('label');
      etiqueta.className = 'opcion-columna';
      const entrada = document.createElement('input');
      entrada.type = 'checkbox';
      entrada.checked = estado[nombre] !== false;
      entrada.dataset.indiceColumna = String(indice);
      etiqueta.append(entrada, document.createTextNode(` ${nombre}`));
      panel.append(etiqueta);

      const aplicar = () => {
        const visible = entrada.checked;
        tabla.querySelectorAll('tr').forEach((fila) => {
          const celda = fila.cells[indice];
          if (celda) celda.style.display = visible ? '' : 'none';
        });
        estado[nombre] = visible;
        localStorage.setItem(clave, JSON.stringify(estado));
      };
      entrada.addEventListener('change', aplicar);
      aplicar();
    });

    boton.addEventListener('click', () => {
      const abierto = !panel.hidden;
      panel.hidden = abierto;
      boton.setAttribute('aria-expanded', String(!abierto));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    prepararBarra();
    prepararFilasDesplegables();
    prepararLotesDelDetalle();
    prepararSelectorDeColumnas();
    prepararTema();
  });
})();
