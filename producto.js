/**
 * Página de producto del catálogo clásico.
 * Catálogo: fetch(catalogo.json) en http(s), o window.__PD_CATALOGO desde catalogo.embed.js (file://).
 */

const WHATSAPP_NUM = '593980191040';

const PERSONALIZADO_PLACEHOLDER_ID = 'pasteles-personalizados';

const state = {
  producto: null,
  selectedTalla: null,
  selectedEnvase: null,
};

async function loadCatalogo() {
  const useNetwork =
    window.location.protocol === 'http:' || window.location.protocol === 'https:';

  if (useNetwork) {
    try {
      const res = await fetch('catalogo.json', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (_) {}
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
      'No se pudo cargar el catálogo. En <code>producto.html</code>, incluye <code>&lt;script src=&quot;catalogo.embed.js&quot;&gt;&lt;/script&gt;</code> <strong>antes</strong> de <code>producto.js</code>, o abre el sitio con un servidor (por ejemplo <code>npx serve .</code>).'
    );
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    window.location.replace('index.html');
    return;
  }

  const producto = catalogo.find((p) => p.id === id);
  if (!producto) {
    mostrarError(`No encontramos el producto «${escapeHtml(id)}». <a href="index.html">Volver al inicio</a>`);
    return;
  }

  poblarPagina(producto, catalogo);
})();


function categoriaToHref(categoria) {
  const c = (categoria || '').toLowerCase();
  if (c.includes('pastel')) return 'pasteles.html';
  if (c.includes('cupcake')) return 'cupcakes.html';
  if (c.includes('gallet')) return 'galletas.html';
  return 'otros.html';
}

function poblarPagina(producto, catalogo) {
  state.producto = producto;

  document.title = `${producto.nombre} — Paula's Desserts`;

  const related = document.getElementById('related-section');
  if (related) related.hidden = false;

  document.getElementById('breadcrumb-nombre').textContent = producto.nombre;
  const crumbCat = document.getElementById('breadcrumb-categoria');
  if (crumbCat) {
    crumbCat.textContent = producto.categoria || 'Menú';
    crumbCat.href = categoriaToHref(producto.categoria);
  }

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

  const esConsulta = producto.id === PERSONALIZADO_PLACEHOLDER_ID;
  aplicarModoConsulta(esConsulta);

  if (!esConsulta) {
    renderTallas(producto.tallas);
    renderEnvases(producto);

    document.getElementById('product-personalizacion')
      ?.addEventListener('change', () => actualizarWhatsApp(producto));
    document.getElementById('product-personalizacion')
      ?.addEventListener('input', () => actualizarWhatsApp(producto));

    document.getElementById('btn-guardar')
      ?.addEventListener('click', () => guardarPedido(producto));

    actualizarWhatsApp(producto);
  }

  renderRelacionados(producto.relacionados || [], catalogo);
}

function aplicarModoConsulta(activo) {
  const consultaBlock = document.getElementById('product-consulta-block');
  if (consultaBlock) consultaBlock.hidden = !activo;

  ['#product-personalizacion .form-section', '#product-personalizacion .cta-row'].forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => { el.hidden = activo; });
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function val(id) {
  const el = document.getElementById(id);
  return el && 'value' in el ? String(el.value || '').trim() : '';
}

const ENTREGA_LABEL = {
  retiro: 'Retiro en local',
  delivery: 'Delivery',
  coord: 'A coordinar',
};

function renderTallas(tallas) {
  const contenedor = document.getElementById('product-tallas');
  const precioEl = document.getElementById('product-price');
  const tallasCopy = tallas && tallas.length ? tallas : null;

  const setSelectedTalla = (talla, index) => {
    state.selectedTalla = talla;
    precioEl.textContent =
      talla.precio !== null && talla.precio !== undefined
        ? `$${Number(talla.precio).toFixed(2)}`
        : 'A consultar';
    contenedor.querySelectorAll('.size-card').forEach((c, j) => {
      c.classList.toggle('selected', j === index);
      c.setAttribute('aria-checked', j === index ? 'true' : 'false');
      c.tabIndex = j === index ? 0 : -1;
    });
    actualizarWhatsApp(state.producto);
  };

  if (!tallasCopy) {
    contenedor.innerHTML = '<p class="custom-hint">Consulta tamaños y precios por WhatsApp o en tienda.</p>';
    precioEl.textContent = '—';
    state.selectedTalla = null;
    return;
  }

  contenedor.innerHTML = tallasCopy
    .map(
      (t, i) => `
    <div class="size-card${i === 0 ? ' selected' : ''}" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-index="${i}">
      <span class="size-label">${escapeHtml(t.label)}</span>
      <span class="size-desc">${escapeHtml(t.desc || '')}</span>
    </div>`
    )
    .join('');

  setSelectedTalla(tallasCopy[0], 0);

  contenedor.onclick = (e) => {
    const card = e.target.closest('.size-card');
    if (!card) return;
    setSelectedTalla(tallasCopy[Number(card.dataset.index)], Number(card.dataset.index));
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
        setSelectedTalla(tallasCopy[Number(card.dataset.index)], Number(card.dataset.index));
      }
    }
  };
}

function obtenerOpcionesEnvase(producto) {
  if (Array.isArray(producto.envases) && producto.envases.length) {
    return producto.envases.map((label) => ({
      label: String(label),
      value: String(label).toLowerCase().replace(/\s+/g, '-'),
    }));
  }

  const cat = (producto.categoria || '').toLowerCase();

  if (cat.includes('cupcake')) {
    return [
      { label: 'Caja estándar', value: 'caja-estandar' },
      { label: 'Caja regalo', value: 'caja-regalo' },
      { label: 'Sin preferencia', value: 'sin-pref' },
    ];
  }

  if (cat.includes('gallet') || cat.includes('brown') || cat.includes('cookie')) {
    return [
      { label: 'Bolsa / empaque simple', value: 'bolsa' },
      { label: 'Caja regalo', value: 'caja-regalo' },
      { label: 'Bandeja', value: 'bandeja' },
    ];
  }

  return [
    { label: 'Presentación habitual', value: 'estandar' },
    { label: 'Base + domo', value: 'domo' },
    { label: 'Caja transporte', value: 'caja-transporte' },
    { label: 'A coordinar por WhatsApp', value: 'coord-wa' },
  ];
}

function renderEnvases(producto) {
  const contenedor = document.getElementById('product-envases');
  const block = document.getElementById('product-envase-block');
  if (!contenedor || !block) return;

  const opciones = obtenerOpcionesEnvase(producto);

  if (!opciones.length) {
    block.hidden = true;
    state.selectedEnvase = null;
    return;
  }

  block.hidden = false;
  contenedor.innerHTML = '';
  opciones.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip chip-envase${i === 0 ? ' selected' : ''}`;
    btn.dataset.value = op.value;
    btn.textContent = op.label;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.setAttribute('role', 'radio');
    contenedor.appendChild(btn);
  });

  state.selectedEnvase = opciones[0];

  contenedor.onclick = (e) => {
    const chip = e.target.closest('.chip-envase');
    if (!chip) return;
    contenedor.querySelectorAll('.chip-envase').forEach((c) => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    chip.classList.add('selected');
    chip.setAttribute('aria-pressed', 'true');
    state.selectedEnvase = opciones.find((o) => o.value === chip.dataset.value) || null;
    actualizarWhatsApp(state.producto);
  };
}

function buildMensajePedido(producto) {
  const entrega = val('field-entrega') || 'coord';
  const notasExtra = val('field-notas-extra');

  const precioUnit =
    state.selectedTalla && state.selectedTalla.precio !== null && state.selectedTalla.precio !== undefined
      ? `$${Number(state.selectedTalla.precio).toFixed(2)}`
      : 'A consultar';

  const tallaTxt = state.selectedTalla
    ? `${state.selectedTalla.label} (${state.selectedTalla.desc || 'porciones'}) — ${precioUnit}`
    : 'A definir';

  const envaseTxt = state.selectedEnvase ? state.selectedEnvase.label : '—';
  const line = (label, v) => (v ? `\n- ${label}: ${v}` : '');

  return [
    "Hola Paula's Desserts!",
    '',
    '=== PEDIDO ===',
    `- Producto: ${producto.nombre} (${producto.categoria})`,
    `- Tamaño / porciones: ${tallaTxt}`,
    `- Empaque / presentación: ${envaseTxt}`,
    '',
    `- Entrega: ${ENTREGA_LABEL[entrega] || entrega}`,
    line('Extras u otras notas', notasExtra),
    '',
    '(Generado desde la web — podés editar antes de enviar)',
  ].join('\n');
}

function actualizarWhatsApp(producto) {
  const wa = document.getElementById('btn-whatsapp');
  if (!wa || !producto) return;
  wa.href = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(buildMensajePedido(producto))}`;
}

async function guardarPedido(producto) {
  const btn = document.getElementById('btn-guardar');
  const mensaje = buildMensajePedido(producto);
  if (btn) btn.disabled = true;

  try {
    await navigator.clipboard.writeText(mensaje);
  } catch {
    window.prompt('Copia tu solicitud:', mensaje);
  }

  setTimeout(() => { if (btn) btn.disabled = false; }, 1800);
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
      `<a href="producto.html?id=${encodeURIComponent(p.id)}" class="polaroid">
        ${imgHtml}
        <div class="polaroid-label">
          <div class="product-name">${escapeHtml(p.nombre)}</div>
          <div class="product-desc">${escapeHtml(p.categoria)} · ${escapeHtml(desc)}</div>
        </div>
      </a>`
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
      <p style="margin:0 0 12px;"><a href="index.html" style="color:var(--color-primary);font-size:15px;font-weight:700;font-family:var(--font-body);">← Volver al inicio</a></p>
      <p style="margin:0;"><a href="menu_personalizacion.html" style="color:var(--color-primary);font-size:14px;font-weight:600;font-family:var(--font-body);">Ir a personalización</a></p>
    </div>
  `;
}
