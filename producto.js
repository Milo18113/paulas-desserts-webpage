/**
 * Página de producto / personalización.
 * - Con http(s): intenta fetch('catalogo.json'); si falla, usa window.__PD_CATALOGO (catalogo.embed.js).
 * - Con file://: el navegador bloquea fetch a disco; hace falta catalogo.embed.js antes de este script.
 */

const WHATSAPP_NUM = '593980191040';

const state = {
  producto: null,
  selectedTalla: null,
  selectedOpcion: null,
};

async function loadCatalogo() {
  const useNetwork =
    window.location.protocol === 'http:' || window.location.protocol === 'https:';

  if (useNetwork) {
    try {
      const res = await fetch('catalogo.json', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (_) {
      /* seguir al respaldo */
    }
  }

  if (Array.isArray(window.__PD_CATALOGO) && window.__PD_CATALOGO.length) {
    return window.__PD_CATALOGO;
  }

  throw new Error('CATALOGO_UNAVAILABLE');
}

(async () => {
  let catalogo;
  try {
    catalogo = await loadCatalogo();
  } catch {
    mostrarError(
      'No se pudo cargar el catálogo. Asegúrate de que en <code>Producto.html</code> va <strong>antes</strong> de <code>producto.js</code> la línea: <code>&lt;script src=&quot;catalogo.embed.js&quot;&gt;&lt;/script&gt;</code> (archivo generado desde <code>catalogo.json</code>). O abre el sitio con un servidor, por ejemplo <code>npx serve .</code>'
    );
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    mostrarSelectorProductos(catalogo);
    return;
  }

  const producto = catalogo.find((p) => p.id === id);
  if (!producto) {
    mostrarError(`No encontramos el producto «${escapeHtml(id)}». <a href="Producto.html">Ver listado</a>`);
    return;
  }

  poblarPagina(producto, catalogo);
})();

function mostrarSelectorProductos(catalogo) {
  document.title = "Personalizar — Paula's Desserts";

  const breadcrumb = document.getElementById('breadcrumb-nav');
  if (breadcrumb) {
    breadcrumb.innerHTML =
      '<a href="Menu.html">Menú</a><span class="breadcrumb-sep" aria-hidden="true">›</span><span class="breadcrumb-current">Elegir producto</span>';
  }

  const related = document.getElementById('related-section');
  if (related) related.hidden = true;

  const hero = document.getElementById('product-hero');
  if (!hero) return;

  hero.innerHTML = `
    <div class="product-picker">
      <h2 class="product-picker-title">¿Qué quieres personalizar?</h2>
      <p class="product-picker-lead">
        Elige un producto para ver foto, precios por tamaño y opciones de sabor o estilo. Luego podrás copiar el pedido o enviarlo por WhatsApp.
      </p>
      <div class="product-picker-grid">
        ${catalogo
          .map((p) => {
            const desc = escapeHtml(
              ((p.descripcion || '').split('.')[0] || p.categoria || '').trim().slice(0, 100)
            );
            const img = p.image
              ? `<img src="${escapeHtml(p.image)}" alt="" loading="lazy" width="320" height="240" />`
              : `<div class="product-picker-noimg" aria-hidden="true">Sin foto</div>`;
            return `
          <a class="product-picker-card" href="Producto.html?id=${encodeURIComponent(p.id)}">
            <div class="product-picker-img-wrap">${img}</div>
            <div class="product-picker-body">
              <span class="product-picker-cat">${escapeHtml(p.categoria)}</span>
              <span class="product-picker-name">${escapeHtml(p.nombre)}</span>
              <span class="product-picker-desc">${desc}</span>
            </div>
          </a>`;
          })
          .join('')}
      </div>
    </div>
  `;
}

function poblarPagina(producto, catalogo) {
  state.producto = producto;

  document.title = `${producto.nombre} — Paula's Desserts`;

  const related = document.getElementById('related-section');
  if (related) related.hidden = false;

  document.getElementById('breadcrumb-categoria').textContent = producto.categoria;
  document.getElementById('breadcrumb-nombre').textContent = producto.nombre;

  const img = document.getElementById('product-img');
  const placeholder = document.getElementById('product-img-placeholder');
  if (producto.image) {
    img.onload = () => {
      img.classList.add('is-visible');
      if (placeholder) placeholder.style.display = 'none';
    };
    img.onerror = () => {
      img.classList.remove('is-visible');
      img.removeAttribute('src');
      if (placeholder) {
        placeholder.textContent = 'No se pudo cargar la imagen';
        placeholder.style.display = '';
      }
    };
    img.src = producto.image;
    img.alt = producto.nombre;
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-visible');
      if (placeholder) placeholder.style.display = 'none';
    }
  } else {
    img.removeAttribute('src');
    img.classList.remove('is-visible');
    if (placeholder) {
      placeholder.textContent = 'Sin imagen aún';
      placeholder.style.display = '';
    }
  }

  document.getElementById('product-category').textContent = producto.categoria;
  document.getElementById('product-name').textContent = producto.nombre;
  document.getElementById('product-tagline').textContent = producto.descripcion || '';

  const lista = document.getElementById('product-alergenos');
  lista.innerHTML =
    producto.alergenos && producto.alergenos.length
      ? producto.alergenos.map((a) => `<li>${escapeHtml(a)}</li>`).join('')
      : '<li>Sin alérgenos declarados en ficha</li>';

  renderTallas(producto.tallas);
  renderOpcionesExtra(producto);

  const btnScroll = document.getElementById('btn-personalizar-scroll');
  const panel = document.getElementById('product-personalizacion');
  if (btnScroll && panel) {
    btnScroll.addEventListener('click', () => {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      requestAnimationFrame(() => {
        const firstChip = panel.querySelector('.chip');
        const firstSize =
          panel.querySelector('.size-card.selected') || panel.querySelector('.size-card');
        if (firstChip) firstChip.focus();
        else if (firstSize) firstSize.focus();
      });
    });
  }

  const btnGuardar = document.getElementById('btn-guardar');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', () => guardarPersonalizacion(producto));
  }

  const notasEl = document.getElementById('product-notas');
  if (notasEl) {
    notasEl.addEventListener('input', () => updatePersonalizacionResumen(producto));
  }

  const cantidadEl = document.getElementById('product-cantidad');
  if (cantidadEl) {
    cantidadEl.addEventListener('input', () => updatePersonalizacionResumen(producto));
    cantidadEl.addEventListener('change', () => updatePersonalizacionResumen(producto));
  }

  renderRelacionados(producto.relacionados || [], catalogo);
  updatePersonalizacionResumen(producto);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getCantidad() {
  const el = document.getElementById('product-cantidad');
  const n = parseInt(el && el.value, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.min(99, n);
}

function renderTallas(tallas) {
  const contenedor = document.getElementById('product-tallas');
  const precioEl = document.getElementById('product-price');
  const noteEl = document.getElementById('product-price-note');

  const tallasCopy = tallas && tallas.length ? tallas : null;

  const setSelectedTalla = (talla, index) => {
    state.selectedTalla = talla;
    precioEl.textContent =
      talla.precio !== null && talla.precio !== undefined
        ? `$${Number(talla.precio).toFixed(2)}`
        : 'A consultar';
    if (noteEl) {
      noteEl.textContent =
        !tallasCopy || tallasCopy.length <= 1
          ? 'Precio orientativo por presentación.'
          : 'Según el tamaño elegido.';
    }
    contenedor.querySelectorAll('.size-card').forEach((c, j) => {
      c.classList.toggle('selected', j === index);
      c.setAttribute('aria-checked', j === index ? 'true' : 'false');
      c.tabIndex = j === index ? 0 : -1;
    });
    updatePersonalizacionResumen(state.producto);
  };

  if (!tallasCopy) {
    contenedor.innerHTML =
      '<p class="custom-hint">Consulta tamaños y precios por WhatsApp o en tienda.</p>';
    precioEl.textContent = '—';
    if (noteEl) noteEl.textContent = '';
    state.selectedTalla = null;
    return;
  }

  contenedor.innerHTML = tallasCopy
    .map(
      (t, i) => `
    <div class="size-card${i === 0 ? ' selected' : ''}" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-index="${i}">
      <span class="size-label">${escapeHtml(t.label)}</span>
      <span class="size-desc">${escapeHtml(t.desc || '')}</span>
    </div>
  `
    )
    .join('');

  setSelectedTalla(tallasCopy[0], 0);

  contenedor.onclick = (e) => {
    const card = e.target.closest('.size-card');
    if (!card) return;
    const idx = Number(card.dataset.index);
    setSelectedTalla(tallasCopy[idx], idx);
  };

  contenedor.onkeydown = (e) => {
    const cards = [...contenedor.querySelectorAll('.size-card')];
    const current = cards.findIndex((c) => c.classList.contains('selected'));
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(cards.length - 1, current + 1);
      setSelectedTalla(tallasCopy[next], next);
      cards[next]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, current - 1);
      setSelectedTalla(tallasCopy[prev], prev);
      cards[prev]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.size-card');
      if (card) {
        e.preventDefault();
        const idx = Number(card.dataset.index);
        setSelectedTalla(tallasCopy[idx], idx);
      }
    }
  };
}

function renderOpcionesExtra(producto) {
  const contenedor = document.getElementById('product-opciones');
  const wrap = document.getElementById('product-opciones-wrap');
  if (!contenedor || !wrap) return;

  const opciones = obtenerOpcionesExtra(producto);

  if (!opciones.length) {
    wrap.classList.add('is-hidden');
    contenedor.innerHTML = '';
    state.selectedOpcion = null;
    updatePersonalizacionResumen(producto);
    return;
  }

  wrap.classList.remove('is-hidden');
  contenedor.innerHTML = '';
  opciones.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip${i === 0 ? ' selected' : ''}`;
    btn.dataset.value = op.value;
    btn.textContent = op.label;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    contenedor.appendChild(btn);
  });

  state.selectedOpcion = opciones[0] || null;

  contenedor.onclick = (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    contenedor.querySelectorAll('.chip').forEach((c) => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    chip.classList.add('selected');
    chip.setAttribute('aria-pressed', 'true');
    state.selectedOpcion = opciones.find((o) => o.value === chip.dataset.value) || null;
    updatePersonalizacionResumen(producto);
  };

  updatePersonalizacionResumen(producto);
}

function obtenerOpcionesExtra(producto) {
  const cat = (producto.categoria || '').toLowerCase();

  if (cat.includes('personal')) {
    return [
      { label: 'Sabor a tu gusto', value: 'sabor-a-tu-gusto' },
      { label: 'Relleno elegido', value: 'relleno-elegido' },
      { label: 'Decoración personalizada', value: 'decoracion-personalizada' },
      { label: 'Sin alérgenos (si aplica)', value: 'sin-alergenos' },
    ];
  }

  if (cat.includes('cupcake')) {
    return [
      { label: 'Vainilla', value: 'vainilla' },
      { label: 'Chocolate', value: 'chocolate' },
      { label: 'Frutilla', value: 'frutilla' },
      { label: 'Personalizado', value: 'personalizado' },
    ];
  }

  if (cat.includes('gallet')) {
    return [
      { label: 'Clásicas', value: 'clasicas' },
      { label: 'Royal icing', value: 'royal-icing' },
      { label: 'Con chispas', value: 'con-chispas' },
      { label: 'Personalizadas', value: 'galletas-personalizadas' },
    ];
  }

  if (cat.includes('pastel')) {
    return [
      { label: 'Chocolate', value: 'chocolate' },
      { label: 'Vainilla', value: 'vainilla' },
      { label: 'Frutos rojos', value: 'frutos-rojos' },
      { label: 'Con merengue', value: 'con-merengue' },
      { label: 'Personalizado', value: 'personalizado' },
    ];
  }

  if (cat.includes('pie') || cat.includes('pies')) {
    return [
      { label: 'Clásico', value: 'clasico' },
      { label: 'Extra merengue', value: 'extra-merengue' },
      { label: 'Menos azúcar', value: 'menos-azucar' },
      { label: 'Personalizado', value: 'personalizado' },
    ];
  }

  if (cat.includes('cheesecake')) {
    return [
      { label: 'Clásico', value: 'clasico' },
      { label: 'Extra topping', value: 'extra-topping' },
      { label: 'Personalizado', value: 'personalizado' },
    ];
  }

  if (cat.includes('brown') || cat.includes('banana')) {
    return [
      { label: 'Clásico', value: 'clasico' },
      { label: 'Extra indulgente', value: 'extra-indulgente' },
      { label: 'Frutos rojos', value: 'frutos-rojos' },
      { label: 'Personalizado', value: 'personalizado' },
    ];
  }

  return [
    { label: 'Clásico', value: 'clasico' },
    { label: 'Personalizado', value: 'personalizado' },
  ];
}

function buildMensajePedido(producto) {
  const cantidad = getCantidad();
  const precio =
    state.selectedTalla && state.selectedTalla.precio !== null && state.selectedTalla.precio !== undefined
      ? `$${Number(state.selectedTalla.precio).toFixed(2)} c/u`
      : 'A consultar';

  const opcionTexto = state.selectedOpcion ? state.selectedOpcion.label : 'Sin variante';
  const notas = (document.getElementById('product-notas')?.value || '').trim();
  const notasLine = notas ? `\n- Notas: ${notas}` : '';

  const tallaLine = state.selectedTalla
    ? `${state.selectedTalla.label} (${precio})`
    : 'A definir';

  return [
    "Hola Paula's Desserts!",
    'Quiero pedir / personalizar:',
    `- Producto: ${producto.nombre} (${producto.categoria})`,
    `- Cantidad: ${cantidad}`,
    `- Tamaño / presentación: ${tallaLine}`,
    `- Opción (sabor / estilo): ${opcionTexto}`,
    notasLine,
    '',
    '(Mensaje generado desde la web — puedes editarlo antes de enviar)',
  ].join('\n');
}

function updatePersonalizacionResumen(producto) {
  const resumenEl = document.getElementById('product-personalizacion-resumen');
  const wa = document.getElementById('btn-whatsapp');
  if (!resumenEl || !producto) return;

  if (!state.selectedTalla) {
    resumenEl.textContent = 'Selecciona un tamaño o consulta disponibilidad.';
    if (wa) wa.setAttribute('href', '#');
    return;
  }

  const precio =
    state.selectedTalla.precio !== null && state.selectedTalla.precio !== undefined
      ? `$${Number(state.selectedTalla.precio).toFixed(2)}`
      : 'A consultar';

  const opcionTexto = state.selectedOpcion ? state.selectedOpcion.label : 'Sin variante';
  const notas = (document.getElementById('product-notas')?.value || '').trim();
  const notasPart = notas ? ` · Notas: «${notas.slice(0, 80)}${notas.length > 80 ? '…' : ''}»` : '';
  const cantidad = getCantidad();

  resumenEl.textContent = `Tu selección: ${cantidad}× ${producto.nombre} · ${opcionTexto} · ${state.selectedTalla.label} · ${precio}${notasPart}`;

  if (wa) {
    wa.href = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(buildMensajePedido(producto))}`;
  }
}

async function guardarPersonalizacion(producto) {
  const resumenEl = document.getElementById('product-personalizacion-resumen');
  const btn = document.getElementById('btn-guardar');
  if (!state.selectedTalla) return;

  const mensaje = buildMensajePedido(producto);

  if (btn) btn.disabled = true;

  try {
    await navigator.clipboard.writeText(mensaje);
    if (resumenEl) {
      resumenEl.textContent =
        'Listo: copiamos tu pedido al portapapeles. Pégalo en WhatsApp o envía con el botón verde.';
    }
  } catch {
    window.prompt('Copia tu solicitud:', mensaje);
    if (resumenEl) {
      resumenEl.textContent = 'Selección lista. Si no se copió sola, copia desde el cuadro que apareció.';
    }
  }

  setTimeout(() => {
    if (btn) btn.disabled = false;
    updatePersonalizacionResumen(producto);
  }, 1800);
}

function renderRelacionados(ids, catalogo) {
  const grid = document.getElementById('related-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!ids || !ids.length) {
    grid.innerHTML = '<p class="custom-hint">Pronto más recomendaciones.</p>';
    return;
  }

  ids.forEach((id) => {
    const p = catalogo.find((x) => x.id === id);
    if (!p) return;

    const desc = (p.descripcion || '').split('.')[0] || p.categoria;
    const imgHtml = p.image
      ? `<img class="polaroid-img" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.nombre)}" loading="lazy" />`
      : `<div class="polaroid-img polaroid-img--empty" role="img" aria-label="Sin foto">Sin foto</div>`;

    grid.insertAdjacentHTML(
      'beforeend',
      `
      <a href="Producto.html?id=${encodeURIComponent(p.id)}" class="polaroid">
        ${imgHtml}
        <div class="polaroid-label">
          <div class="product-name">${escapeHtml(p.nombre)}</div>
          <div class="product-desc">${escapeHtml(p.categoria)} · ${escapeHtml(desc)}</div>
        </div>
      </a>
    `
    );
  });
}

function mostrarError(msg) {
  const hero = document.getElementById('product-hero') || document.querySelector('.product-hero');
  const related = document.getElementById('related-section');
  if (related) related.hidden = true;
  if (!hero) return;
  hero.innerHTML = `
    <div class="product-error" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <p style="font-size:17px;color:var(--color-primary);opacity:0.9;font-family:var(--font-body);max-width:46ch;margin:0 auto 20px;line-height:1.55;">${msg}</p>
      <p style="margin:0 0 12px;"><a href="Menu.html" style="color:var(--color-primary);font-size:15px;font-weight:700;font-family:var(--font-body);">← Volver al menú</a></p>
      <p style="margin:0;"><a href="Producto.html" style="color:var(--color-primary);font-size:14px;font-weight:600;font-family:var(--font-body);">Ver todos los productos</a></p>
    </div>
  `;
}
