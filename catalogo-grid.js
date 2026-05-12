const CATEGORIAS_PRINCIPALES = ['Pasteles', 'Cupcakes', 'Galletas'];

const EMOJI_POR_CATEGORIA = {
  Pasteles: '🎂',
  Cupcakes: '🧁',
  Galletas: '🍪',
  Pies: '🥧',
  Cheesecakes: '🍰',
  Brownies: '🍫',
  'Banana Bread': '🍌',
  Personalizados: '✨',
};

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function precioDesde(tallas) {
  if (!tallas || !tallas.length) return 'A consultar';
  const precio = tallas[0].precio;
  return precio !== null ? `desde $${Number(precio).toFixed(2)}` : 'A consultar';
}

function buildCard(p) {
  const imgHtml = p.image
    ? `<img class="polaroid-photo" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.nombre)}" loading="lazy" />`
    : `<div class="polaroid-photo-placeholder">${EMOJI_POR_CATEGORIA[p.categoria] ?? '🍰'}</div>`;

  const tagsHtml = p.alergenos && p.alergenos.length
    ? p.alergenos.map(a => `<span class="tag">${escapeHtml(a)}</span>`).join('')
    : '';

  return `
    <a href="Producto.html?id=${encodeURIComponent(p.id)}" class="polaroid" style="text-decoration:none;color:inherit;cursor:pointer;">
      <article>
        ${imgHtml}
        <div class="polaroid-body">
          <h3>${escapeHtml(p.nombre)}</h3>
          ${tagsHtml ? `<div class="polaroid-tags">${tagsHtml}</div>` : ''}
          <p class="polaroid-desc">${escapeHtml(p.descripcion)}</p>
          <div class="polaroid-footer">
            <span class="price">${precioDesde(p.tallas)}</span>
          </div>
        </div>
      </article>
    </a>`;
}

(async () => {
  const grid = document.querySelector('.menu-grid');
  if (!grid) return;

  const categoria = grid.dataset.categoria;
  if (!categoria) return;

  let catalogo;
  try {
    const res = await fetch('catalogo.json');
    if (!res.ok) throw new Error();
    catalogo = await res.json();
  } catch {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;opacity:0.5;">No se pudo cargar el catálogo.</p>';
    return;
  }

  const productos = categoria === 'otros'
    ? catalogo.filter(p => !CATEGORIAS_PRINCIPALES.includes(p.categoria))
    : catalogo.filter(p => p.categoria === categoria);

  if (!productos.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;opacity:0.5;">No hay productos en esta categoría aún.</p>';
    return;
  }

  grid.innerHTML = productos.map(buildCard).join('');
})();
