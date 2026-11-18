# Personalizar y hacer crecer el proyecto

La idea central es que **el calendario no se rompa** cuando agregues o cambies cosas. Por eso cada sección vive en su propio archivo, los datos pasan siempre por `store.js` y casi todo lo configurable está en `config.js` o en el panel.

---

## 1. Lo fácil: desde el panel

Entra a `/#/admin` → **Ajustes**. Sin tocar código puedes cambiar:

- Nombre de la pastoral, parroquia y ciudad.
- Correo, teléfono, WhatsApp y dirección.
- Título de la portada y palabra destacada.
- Frase del pie de página.
- Redes sociales.
- Qué secciones aparecen en el menú y en el pie.

Los cambios se guardan en la tabla `settings` (o en el navegador en modo demo) y se aplican al instante.

---

## 2. Textos y valores por defecto

Si quieres cambiar lo que aparece la primera vez (antes de que alguien guarde ajustes), edita `js/config.js`:

```js
export const SITE = {
  name: 'Pastoral Familiar',
  parish: 'Parroquia San José',
  heroTitle: 'Caminemos juntos como',
  heroAccent: 'familia',
  heroText: 'Un solo lugar para encontrarnos…',
  ...
};
```

El panel sobrescribe estos valores sin borrarlos: si algún día restableces los ajustes, vuelven los de `config.js`.

---

## 3. Colores y tipografía

Todo el diseño usa variables CSS al inicio de `assets/css/base.css`:

```css
:root {
  --cream: #FBF7F0;   /* fondo general */
  --paper: #FFFFFF;   /* tarjetas */
  --ink: #17322C;     /* texto principal */
  --green: #1F4D42;   /* color de marca */
  --clay: #C0643C;    /* acento cálido */
  --gold: #C9913F;    /* detalles y celebraciones */
  --font-display: "Fraunces", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;
}
```

Cambia esos valores y toda la web se adapta. Para usar otra tipografía:

1. Cambia el `<link>` de Google Fonts en `index.html`.
2. Actualiza `--font-display` y `--font-sans`.

Para el logo, reemplaza `assets/img/logo.svg` y `assets/img/favicon.svg` manteniendo los nombres.

---

## 4. Agregar un tipo de actividad

En `js/config.js`, agrega un objeto a `CATEGORIES`:

```js
export const CATEGORIES = [
  // …las que ya existen
  { id: 'misiones', label: 'Misiones', color: '#5B4B8A', bg: '#EEEAF7' },
];
```

Aparece automáticamente en:

- El filtro del calendario y su leyenda.
- El formulario de propuesta.
- El formulario del panel.
- Las tarjetas y los colores del calendario.

No hay que tocar CSS ni base de datos.

---

## 5. Agregar un campo a las actividades

Ejemplo: un campo “¿Requiere inscripción?”.

**Paso 1. Base de datos** (solo si usas Supabase), en SQL Editor:

```sql
alter table public.activities
add column if not exists requires_signup boolean not null default false;
```

En modo demo no hace falta: los objetos se guardan tal cual.

**Paso 2. Formulario del panel**, en `js/views/admin-forms.js`, dentro de `FORMS.activities.fields`:

```js
{ name: 'requires_signup', label: 'Requiere inscripción', type: 'checkbox' },
```

**Paso 3. Mostrarlo donde quieras**, por ejemplo en `js/cards.js` dentro de `activityDetailHTML`:

```js
${a.requires_signup ? `<span class="badge badge-clay">Requiere inscripción</span>` : ''}
```

El guardado es automático: `openRecordForm` lee todos los campos del formulario y `store.js` envía el objeto a Supabase o al navegador.

---

## 6. Agregar una sección nueva

Ejemplo: una página “Nosotros”.

**Paso 1.** Crea `js/views/nosotros.js`:

```js
import { pageHead } from '../ui.js';

export default function nosotrosView(root) {
  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Quiénes somos',
      title: 'Nuestra pastoral',
      subtitle: 'Un grupo de familias que camina junta.',
    })}
    <section class="section-tight">
      <div class="wrap wrap-narrow">
        <p>Escribe aquí la historia de la pastoral…</p>
      </div>
    </section>`;
}
```

**Paso 2.** En `js/app.js`:

```js
import nosotrosView from './views/nosotros.js';

const ROUTES = {
  // …
  '/nosotros': nosotrosView,
};

const TITLES = {
  // …
  '/nosotros': 'Nosotros',
};
```

**Paso 3.** En `js/config.js`, agrega la sección:

```js
{ id: 'nosotros', path: '/nosotros', label: 'Nosotros', icon: 'users', nav: true },
```

Ya aparece en el menú, en el menú móvil y en el pie. Si usas iconos existentes (`calendar`, `megaphone`, `heart`, `book`, `image`, `phone`, `users`…), no necesitas nada más. Para un icono nuevo, agrégalo al objeto `PATHS` de `js/icons.js`.

---

## 7. Contenido de ejemplo

El modo demo arranca con datos de `js/seed.js`. Si cambias la estructura de los datos, sube `SEED_VERSION` para que los navegadores vuelvan a sembrar:

```js
export const SEED_VERSION = 5;
```

En Supabase, el contenido de ejemplo es opcional: `supabase/seed.sql`.

---

## 8. Galería de fotos

Desde el panel → **Galería**:

1. Crea un álbum (título, fecha, color de portada).
2. Pulsa **Subir imágenes** o pega un enlace.
3. Escribe una descripción por foto.
4. Guarda.

Con Supabase, las imágenes se guardan en el bucket `media`. En modo demo se guardan comprimidas en el navegador (no subas muchas: el límite es de unos 5 MB).

Si quieres usar fotos alojadas en otro lugar (Drive, Flickr, etc.), pega el enlace directo a la imagen en el campo de URL. Debe terminar en `.jpg`, `.png` o `.webp` y ser accesible sin iniciar sesión.

---

## 9. Imprimir la cartelera

En `/#/calendario` pulsa **Imprimir**. El CSS de impresión (`assets/css/calendar.css`) oculta menús, botones y pie, y deja el calendario en blanco y negro para fotocopiar.

También puedes descargar el mes en `.ics` y compartirlo por WhatsApp: se abre en Google Calendar, Apple Calendar o Outlook.

---

## 10. Buenas prácticas

- **Prueba primero en modo demo** (sin Supabase) y luego conecta la nube.
- **No cambies los nombres de los campos** de `store.js` sin actualizar la base de datos: son el contrato entre la web y Supabase.
- **No pongas la clave `service_role`** en el frontend. Solo la `anon`.
- **Haz respaldos** antes de cambios grandes: en Supabase, Database → Backups; en demo, exporta el contenido de `localStorage` desde la consola si te importa.
- **Mantén las secciones separadas**: si una sección nueva falla, el calendario debe seguir funcionando. La app ya muestra un mensaje de error solo en la sección afectada.
- **Prueba en el teléfono**: el 70 % de las visitas de una pastoral serán desde WhatsApp.

---

## 11. Mapa mental del código

```
config.js   → qué existe (secciones, categorías, textos)
store.js    → de dónde vienen los datos (demo o Supabase)
ui.js       → piezas visuales comunes (cabecera, modales, campos)
cards.js    → cómo se ve una actividad, aviso, contacto…
views/*.js  → una pantalla = un archivo
app.js      → qué archivo se muestra según la ruta
```

Si respetas esa separación, puedes agregar secciones durante años sin tocar el calendario.
