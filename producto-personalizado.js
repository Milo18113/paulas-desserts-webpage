/**
 * Página de personalización de producto base.
 * Lee ?base=<id> y carga el producto base desde productos-base.json.
 */

const WHATSAPP_NUM = '593980191040';

const SABORES_OPCIONES = [
  { label: 'Clásico (según producto)', value: 'clasico' },
  { label: 'Chocolate', value: 'chocolate' },
  { label: 'Vainilla', value: 'vainilla' },
  { label: 'Red velvet', value: 'red-velvet' },
  { label: 'Frutos rojos / berries', value: 'frutos-rojos' },
  { label: 'Limón / cítricos', value: 'limon' },
  { label: 'Dulce de leche / caramelo', value: 'ddl' },
  { label: 'Café / mocha', value: 'mocha' },
  { label: 'Matcha / té', value: 'matcha' },
  { label: 'Sin preferencia', value: 'sin-pref' },
  { label: 'Otro (detallar abajo)', value: 'otro' },
];

const DIET_OPCIONES = [
  { id: 'sin-azucar', label: 'Sin azúcar' },
  { id: 'gluten-free', label: 'Gluten free' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'sin-frutos-secos', label: 'Sin frutos secos' },
  { id: 'bajo-dulce', label: 'Bajo en dulce' },
];

const state = {
  producto: null,
  selectedTalla: null,
  selectedSabor: null,
  selectedEnvase: null,
  dietSelected: new Set(),
};

async function loadProductosBase() {
  const res = await fetch('productos-base.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('PRODUCTOS_BASE_UNAVAILABLE');
  return await res.json();
}

(async () => {
  let productos;
  try {
    productos = await loadProductosBase();
  } catch {
    mostrarError(
      'No se pudieron cargar los productos base. Abre el sitio con un servidor local (por ejemplo <code>npx serve .</code> o Live Server).'
    );
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get('base');

  if (!id) {
    window.location.replace('menu_personalizacion.html');
    return;
  }

  const producto = productos.find((p) => p.id === id);
  if (!producto) {
    mostrarError(`No encontramos el producto base «${escapeHtml(id)}». <a href="menu_personalizacion.html">Ver listado</a>`);
    return;
  }

  poblarPagina(producto);
})();


function poblarPagina(producto) {
  state.producto = producto;
  state.dietSelected = new Set();

  document.title = `${producto.nombre} — Paula's Desserts`;

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

  const tipoLine = document.getElementById('product-tipo-line');
  if (tipoLine) tipoLine.textContent = `${producto.nombre} · ${producto.categoria}`;

  renderTallas(producto.tallas);
  renderSabores();
  renderEnvases(producto);
  renderDietChips();

  const panel = document.getElementById('product-personalizacion');
  const sync = () => updatePersonalizacionResumen(producto);
  if (panel) {
    initAccordionBlurOnce(panel);
    panel.addEventListener('input', sync);
    panel.addEventListener('change', (e) => {
      sync();
      onPanelAccordionChange(e.target);
    });
  }

  const btnGuardar = document.getElementById('btn-guardar');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', () => guardarPersonalizacion(producto));
  }

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

function val(id) {
  const el = document.getElementById(id);
  return el && 'value' in el ? String(el.value || '').trim() : '';
}

function getFormExtras() {
  return {
    cantidad: getCantidad(),
    tema: val('field-tema'),
    colores: val('field-colores'),
    texto: val('field-texto'),
    entrega: val('field-entrega') || 'coord',
    notasExtra: val('field-notas-extra'),
  };
}

const ENTREGA_LABEL = {
  retiro: 'Retiro en local',
  delivery: 'Delivery',
  coord: 'A coordinar',
};

function clipPreview(s, max = 44) {
  const t = String(s || '').trim();
  if (!t) return '';
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function setAccordionPreviewText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function scheduleCloseDetails(det) {
  if (!det || typeof det.matches !== 'function' || !det.matches('details.form-accordion')) return;
  clearTimeout(det._accCloseT);
  det._accCloseT = setTimeout(() => {
    det.open = false;
  }, 420);
}

function detailsByAcc(name) {
  return document.querySelector(`details.form-accordion[data-acc="${name}"]`);
}

let dietAccordionCloseTimer = null;
function scheduleDietAccordionClose() {
  clearTimeout(dietAccordionCloseTimer);
  dietAccordionCloseTimer = setTimeout(() => {
    const det = detailsByAcc('diet');
    if (det) scheduleCloseDetails(det);
  }, 780);
}

function updateAccordionPreviews() {
  const x = getFormExtras();

  const t = state.selectedTalla;
  setAccordionPreviewText('acc-preview-talla', t ? t.label : '…');

  setAccordionPreviewText('acc-preview-sabor', state.selectedSabor ? state.selectedSabor.label : '…');

  setAccordionPreviewText('acc-preview-tema', clipPreview(x.tema) || 'Sin indicar');
  setAccordionPreviewText('acc-preview-colores', clipPreview(x.colores) || 'Sin indicar');
  setAccordionPreviewText('acc-preview-texto', clipPreview(x.texto) || 'Sin indicar');

  setAccordionPreviewText('acc-preview-entrega', ENTREGA_LABEL[x.entrega] || '…');

  const diets = [...state.dietSelected];
  setAccordionPreviewText('acc-preview-diet', diets.length ? clipPreview(diets.join(', '), 48) : 'Ninguna');

  const envBlock = document.getElementById('product-envase-block');
  if (envBlock && envBlock.hidden) {
    setAccordionPreviewText('acc-preview-envase', '—');
  } else {
    setAccordionPreviewText('acc-preview-envase', state.selectedEnvase ? state.selectedEnvase.label : '…');
  }

  setAccordionPreviewText('acc-preview-notas', clipPreview(x.notasExtra) || 'Sin notas');
}

function onPanelAccordionChange(target) {
  if (!target || !target.id) return;
  if (target.id === 'field-entrega') {
    const det = target.closest('details.form-accordion');
    if (det) scheduleCloseDetails(det);
  }
}

function initAccordionBlurOnce(panel) {
  if (!panel || panel.dataset.accBlur === '1') return;
  panel.dataset.accBlur = '1';
  const textFieldIds = new Set(['field-tema', 'field-colores', 'field-texto', 'field-notas-extra']);
  panel.addEventListener(
    'blur',
    (e) => {
      const t = e.target;
      if (!t || !textFieldIds.has(t.id)) return;
      const det = t.closest('details.form-accordion');
      if (det) scheduleCloseDetails(det);
    },
    true
  );
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
          ? 'Precio según la presentación elegida (porciones ≈ personas).'
          : 'El precio cambia según el tamaño / porciones.';
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
    scheduleCloseDetails(detailsByAcc('talla'));
  };

  contenedor.onkeydown = (e) => {
    const cards = [...contenedor.querySelectorAll('.size-card')];
    const current = cards.findIndex((c) => c.classList.contains('selected'));
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(cards.length - 1, current + 1);
      setSelectedTalla(tallasCopy[next], next);
      cards[next]?.focus();
      scheduleCloseDetails(detailsByAcc('talla'));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, current - 1);
      setSelectedTalla(tallasCopy[prev], prev);
      cards[prev]?.focus();
      scheduleCloseDetails(detailsByAcc('talla'));
    } else if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.size-card');
      if (card) {
        e.preventDefault();
        const idx = Number(card.dataset.index);
        setSelectedTalla(tallasCopy[idx], idx);
        scheduleCloseDetails(detailsByAcc('talla'));
      }
    }
  };
}

function renderSabores() {
  const contenedor = document.getElementById('product-sabores');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  SABORES_OPCIONES.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip chip-sabor${i === 0 ? ' selected' : ''}`;
    btn.dataset.value = op.value;
    btn.textContent = op.label;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.setAttribute('role', 'radio');
    contenedor.appendChild(btn);
  });

  state.selectedSabor = SABORES_OPCIONES[0];

  contenedor.onclick = (e) => {
    const chip = e.target.closest('.chip-sabor');
    if (!chip) return;
    contenedor.querySelectorAll('.chip-sabor').forEach((c) => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    chip.classList.add('selected');
    chip.setAttribute('aria-pressed', 'true');
    state.selectedSabor = SABORES_OPCIONES.find((o) => o.value === chip.dataset.value) || null;
    updatePersonalizacionResumen(state.producto);
    scheduleCloseDetails(detailsByAcc('sabor'));
  };

  updatePersonalizacionResumen(state.producto);
}

function obtenerOpcionesEnvase(producto) {
  if (Array.isArray(producto.envases) && producto.envases.length) {
    return producto.envases.map((label) => ({
      label: String(label),
      value: String(label).toLowerCase().replace(/\s+/g, '-'),
    }));
  }

  const id = (producto.id || '').toLowerCase();

  if (id === 'cupcake') {
    return [
      { label: 'Caja estándar', value: 'caja-estandar' },
      { label: 'Caja regalo', value: 'caja-regalo' },
      { label: 'Sin preferencia', value: 'sin-pref' },
    ];
  }

  if (id === 'galleta') {
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
    contenedor.innerHTML = '';
    state.selectedEnvase = null;
    updatePersonalizacionResumen(producto);
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
    updatePersonalizacionResumen(state.producto);
    scheduleCloseDetails(detailsByAcc('envase'));
  };

  updatePersonalizacionResumen(state.producto);
}

function renderDietChips() {
  const contenedor = document.getElementById('diet-chips');
  if (!contenedor) return;

  state.dietSelected = new Set();
  contenedor.innerHTML = '';

  DIET_OPCIONES.forEach((d) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip chip-diet';
    btn.dataset.dietId = d.id;
    btn.textContent = d.label;
    btn.setAttribute('aria-pressed', 'false');
    contenedor.appendChild(btn);
  });

  contenedor.onclick = (e) => {
    const chip = e.target.closest('.chip-diet');
    if (!chip) return;
    const id = chip.dataset.dietId;
    const opt = DIET_OPCIONES.find((x) => x.id === id);
    if (!opt) return;

    if (state.dietSelected.has(opt.label)) {
      state.dietSelected.delete(opt.label);
      chip.classList.remove('selected');
      chip.setAttribute('aria-pressed', 'false');
    } else {
      state.dietSelected.add(opt.label);
      chip.classList.add('selected');
      chip.setAttribute('aria-pressed', 'true');
    }
    updatePersonalizacionResumen(state.producto);
    scheduleDietAccordionClose();
  };
}

function buildMensajePedido(producto) {
  const x = getFormExtras();
  const precioUnit =
    state.selectedTalla && state.selectedTalla.precio !== null && state.selectedTalla.precio !== undefined
      ? `$${Number(state.selectedTalla.precio).toFixed(2)}`
      : 'A consultar';

  const saborTxt = state.selectedSabor ? state.selectedSabor.label : '—';
  const envaseTxt = state.selectedEnvase ? state.selectedEnvase.label : '—';
  const tallaTxt = state.selectedTalla
    ? `${state.selectedTalla.label} (${state.selectedTalla.desc || 'porciones'}) — ${precioUnit}`
    : 'A definir';

  const dietas =
    state.dietSelected.size > 0 ? [...state.dietSelected].join(', ') : 'Ninguna indicada';

  const line = (label, val) => (val ? `\n- ${label}: ${val}` : '');

  const msg = [
    "Hola Paula's Desserts!",
    '',
    '=== PERSONALIZACIÓN DE PEDIDO ===',
    `- Tipo de producto: ${producto.nombre} (${producto.categoria})`,
    `- Cantidad de unidades: ${x.cantidad}`,
    `- Tamaño / porciones: ${tallaTxt}`,
    `- Sabor: ${saborTxt}`,
    `- Empaque / presentación: ${envaseTxt}`,
    line('Tema o diseño', x.tema),
    line('Colores', x.colores),
    line('Texto personalizado', x.texto),
    '',
    `- Entrega: ${ENTREGA_LABEL[x.entrega] || x.entrega}`,
    '',
    `- Preferencias dietéticas: ${dietas}`,
    line('Extras u otras notas', x.notasExtra),
    '',
    '(Generado desde la web — podés editar antes de enviar)',
  ].join('\n');

  return msg;
}

function updatePersonalizacionResumen(producto) {
  const resumenEl = document.getElementById('product-personalizacion-resumen');
  const wa = document.getElementById('btn-whatsapp');
  updateAccordionPreviews();
  if (!resumenEl || !producto) return;

  if (!state.selectedTalla) {
    resumenEl.textContent = 'Elegí un tamaño / porciones para ver el precio.';
    if (wa) wa.setAttribute('href', '#');
    return;
  }

  const x = getFormExtras();
  const precio =
    state.selectedTalla.precio !== null && state.selectedTalla.precio !== undefined
      ? `$${Number(state.selectedTalla.precio).toFixed(2)}`
      : 'A consultar';

  const sabor = state.selectedSabor ? state.selectedSabor.label : '—';
  const dietas = state.dietSelected.size ? [...state.dietSelected].join(' · ') : '—';

  resumenEl.textContent = `${x.cantidad}× ${producto.nombre} · ${state.selectedTalla.label} (${precio}) · Sabor: ${sabor} · Dietas: ${dietas}`;

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
      resumenEl.textContent = 'Listo: copiamos el pedido al portapapeles.';
    }
  } catch {
    window.prompt('Copia tu solicitud:', mensaje);
    if (resumenEl) {
      resumenEl.textContent = 'Copiá el texto desde el cuadro que apareció.';
    }
  }

  setTimeout(() => {
    if (btn) btn.disabled = false;
    updatePersonalizacionResumen(producto);
  }, 1800);
}

function mostrarError(msg) {
  const hero = document.getElementById('product-hero') || document.querySelector('.product-hero');
  if (!hero) return;
  hero.innerHTML = `
    <div class="product-error" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <p style="font-size:17px;color:var(--color-primary);opacity:0.9;font-family:var(--font-body);max-width:46ch;margin:0 auto 20px;line-height:1.55;">${msg}</p>
      <p style="margin:0;"><a href="menu_personalizacion.html" style="color:var(--color-primary);font-size:15px;font-weight:700;font-family:var(--font-body);">← Volver a personalización</a></p>
    </div>
  `;
}
