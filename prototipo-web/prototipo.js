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
    const rutas = /stock-productos|stock-lotes|logistica-rutas-activas|logistica-historial-rutas/;
    if (!rutas.test(location.pathname)) return;

    document.querySelectorAll('tr.fila-padre').forEach((fila) => {
      const filasHijas = [];
      let siguiente = fila.nextElementSibling;
      while (siguiente && !siguiente.classList.contains('fila-padre')) {
        if (siguiente.classList.contains('fila-hija') || siguiente.classList.contains('fila-total')) {
          filasHijas.push(siguiente);
        }
        siguiente = siguiente.nextElementSibling;
      }
      if (!filasHijas.length) return;

      fila.classList.add('fila-desplegable');
      fila.tabIndex = 0;
      fila.setAttribute('aria-expanded', 'false');
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
      filasHijas.forEach((filaHija) => filaHija.classList.add('fila-oculta'));
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

  document.addEventListener('DOMContentLoaded', () => {
    prepararBarra();
    prepararFilasDesplegables();
    prepararTema();
  });
})();
