# DESIGN.md — Paula's Desserts

Sistema de diseño del proyecto. Este archivo es la fuente de verdad para tokens de color, tipografía, componentes compartidos y convenciones visuales. Cualquier cambio global se decide aquí primero y luego se refleja en `styles.css`.

---

## Paleta de colores

| Token CSS | Valor hex | Uso |
|-----------|-----------|-----|
| `--color-bg` | `#f4ede2` | Fondo general de todas las páginas |
| `--color-primary` | `#1c3b80` | Azul principal — nav, textos sobre fondo claro, botones navy |
| `--color-secondary` | `#2f5b9e` | Azul medio — fondos de contraste (footer, hero de SobreNosotros) |
| `--color-accent` | `#7ba5d0` | Azul claro de énfasis — botones CTA, botón "Personaliza" |
| `--color-text` | `#1f1f1f` | Texto de cuerpo sobre fondo claro |
| `--color-white` | `#ffffff` | Blanco puro — fondos de cards, texto sobre fondo oscuro |
| `--color-bg-soft` | `#f5f0eb` | Crema ligeramente más oscura — fondo de secciones secundarias |

---

## Tipografía

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--font-heading` | `'DM Serif Display', serif` | Títulos de sección, nombres de productos, headings |
| `--font-body` | `Helvetica, Arial, sans-serif` | Texto de párrafo, etiquetas, nav, botones |

**Nota sobre Handelson:** la fuente display del logo/brand (`HANDELSON THREE`) se usa solo en el nombre "Paula's Desserts" dentro del header y footer. No se define como variable CSS global porque depende de disponibilidad local — se aplica directamente donde se necesita con un fallback serif.

---

## Header y Footer

El header y footer de **todas las páginas** sigue el estilo de `SobreNosotros.html` / `stylesHomepage.css`:
- Fondo `--color-bg` (crema), borde inferior sutil
- Logo (ícono) + nombre "Paula's Desserts" en Handelson a la izquierda
- Nav links en `--font-body`, uppercase, `--color-primary`, a la derecha

**Breakpoints de la nav** siguen el patrón de `Catalogo.html`:
- Desktop: logo y links en la misma fila, separados
- `≤ 760px`: padding horizontal se reduce a `20px`; si los links no caben, se pasan a segunda línea o se colapsan

El footer también sigue el estilo de `SobreNosotros.html`: fondo `--color-bg`, línea de dashes a los lados del logo centrado.

---

## Botones

Todos los botones del proyecto y su estilo esperado:

| Botón | Página(s) | Propósito | Estilo |
|-------|-----------|-----------|--------|
| **"PERSONALIZA AHORA"** (hero CTA) | `index.html` | CTA principal del landing, lleva a personalización | Fondo `--color-bg`, texto `--color-primary`, borde `--color-bg`, `border-radius: 11px`. Hover: invierte colores. |
| **"¡Personalizar!"** (nav CTA) | `Catalogo.html` | Acceso rápido a personalización desde la nav | Fondo `--color-primary`, texto `--color-bg`, `border-radius: 4px`, padding pequeño. |
| **"Personaliza tu postre"** (debajo de imagen) | `Producto.html` | CTA secundario en página de producto | Fondo `--color-accent`, texto `--color-primary`, ancho completo, sin border-radius. |
| **"Guardar"** (btn-primary) | `Producto.html` | Confirmar selección de tamaño/opciones | Fondo `--color-primary`, texto `--color-bg`, sin border-radius. |
| **Size cards** (Pequeño / Mediano / Grande) | `Producto.html` | Selector de tamaño de producto | Borde `--color-primary` con opacidad, sin fondo. Seleccionado/hover: fondo `--color-primary`, texto `--color-bg`. |
| **Chips de opción** | `Producto.html` (personalización) | Selección de variantes del producto | Borde pill (`border-radius: 20px`), sin fondo. Seleccionado/hover: fondo `--color-primary`, texto `--color-bg`. |

**Regla general:** `--color-accent` es exclusivo para el CTA de personalización. Los demás botones alternan entre `--color-primary` sólido y outlined.

---

## Sombras

**Referencia canónica:** las sombras del polaroid de `Catalogo.html`.

```css
/* Reposo */
box-shadow: 0 2px 8px rgba(13,54,134,0.10), 0 1px 2px rgba(0,0,0,0.06);

/* Hover */
box-shadow: 0 6px 18px rgba(13,54,134,0.14), 0 2px 4px rgba(0,0,0,0.08);
```

Todos los elementos que tengan sombra en el proyecto (cards de categoría, polaroids de catálogo, cards de producto relacionado, etc.) deben usar estos dos valores exactos. No inventar variantes nuevas.

---

## Espaciado de secciones

El padding interno de cada sección principal (hero, catálogo, producto, sobre nosotros) es **variable por página** — cada una lo define según su layout. No hay un token global de spacing de sección.

Lo que sí es consistente:
- Padding horizontal en desktop: `48px`
- Padding horizontal en móvil (`≤ 760px`): `20px`

---

## Implementación en styles.css

```css
:root {
  --color-bg:        #f4ede2;
  --color-primary:   #1c3b80;
  --color-secondary: #2f5b9e;
  --color-accent:    #7ba5d0;
  --color-text:      #1f1f1f;
  --color-white:     #ffffff;
  --color-bg-soft:   #f5f0eb;

  --font-heading: 'DM Serif Display', serif;
  --font-body:    Helvetica, Arial, sans-serif;
}
```

---

## Estado de migración

Páginas que ya usan `styles.css` correctamente:
- `index.html` ✅
- `SobreNosotros.html` ✅

Páginas con estilos inline pendientes de migrar a `styles.css`:
- `Catalogo.html` — pendiente de Agustina
- `Producto.html` — pendiente de Milo
