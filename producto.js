(async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) { mostrarError('No se especificó un producto.'); return; }

  let catalogo;
  try {
    const res = await fetch('catalogo.json');
    catalogo = await res.json();
  } catch {
    mostrarError('No se pudo cargar el catálogo.');
    return;
  }

  const producto = catalogo.find(p => p.id === id);
  if (!producto) { mostrarError(`Producto "${id}" no encontrado.`); return; }

  poblarPagina(producto, catalogo);
})();

function poblarPagina(producto, catalogo) {
  // Título del documento
  document.title = `${producto.nombre} — Paula's Desserts`;

  // Breadcrumb
  document.getElementById('breadcrumb-categoria').textContent = producto.categoria;
  document.getElementById('breadcrumb-nombre').textContent = producto.nombre;

  // Imagen principal
  const img = document.getElementById('product-img');
  const placeholder = document.getElementById('product-img-placeholder');
  if (producto.image) {
    img.src = producto.image;
    img.alt = producto.nombre;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  }

  // Info básica
  document.getElementById('product-category').textContent = producto.categoria;
  document.getElementById('product-name').textContent = producto.nombre;
  document.getElementById('product-tagline').textContent = producto.descripcion;

  // Alérgenos
  const lista = document.getElementById('product-alergenos');
  lista.innerHTML = producto.alergenos.length
    ? producto.alergenos.map(a => `<li>${a}</li>`).join('')
    : '<li>Sin alérgenos declarados</li>';

  // Tallas y precio
  renderTallas(producto.tallas);

  // Relacionados
  renderRelacionados(producto.relacionados, catalogo);
}

function renderTallas(tallas) {
  const contenedor = document.getElementById('product-tallas');
  const precioEl = document.getElementById('product-price');

  contenedor.innerHTML = tallas.map((t, i) => `
    <div class="size-card${i === 0 ? ' selected' : ''}" data-precio="${t.precio}" data-index="${i}">
      <span class="size-label">${t.label}</span>
      <span class="size-desc">${t.desc}</span>
    </div>
  `).join('');

  const actualizarPrecio = (talla) => {
    precioEl.textContent = talla.precio !== null ? `$${Number(talla.precio).toFixed(2)}` : 'A consultar';
  };

  actualizarPrecio(tallas[0]);

  contenedor.addEventListener('click', (e) => {
    const card = e.target.closest('.size-card');
    if (!card) return;
    contenedor.querySelectorAll('.size-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    actualizarPrecio(tallas[Number(card.dataset.index)]);
  });
}

function renderRelacionados(ids, catalogo) {
  const grid = document.getElementById('related-grid');
  grid.innerHTML = '';

  ids.forEach(id => {
    const p = catalogo.find(x => x.id === id);
    if (!p) return;

    const imgHtml = p.image
      ? `<img class="polaroid-img" src="${p.image}" alt="${p.nombre}" />`
      : `<div class="polaroid-img" style="background:rgba(var(--primary-blue-rgb),0.06);display:flex;align-items:center;justify-content:center;color:rgba(var(--primary-blue-rgb),0.3);font-size:13px;">Sin foto</div>`;

    grid.insertAdjacentHTML('beforeend', `
      <a href="Producto.html?id=${p.id}" class="polaroid" style="text-decoration:none;color:inherit;">
        ${imgHtml}
        <div class="polaroid-label">
          <div class="product-name">${p.nombre}</div>
          <div class="product-desc">${p.categoria} · ${p.descripcion.split('.')[0]}</div>
        </div>
      </a>
    `);
  });
}

function mostrarError(msg) {
  document.querySelector('.product-hero').innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <p style="font-size:18px;color:var(--primary-blue);opacity:0.6;">${msg}</p>
      <a href="Menu.html" style="color:var(--primary-blue);font-size:14px;">← Volver al menú</a>
    </div>
  `;
}
