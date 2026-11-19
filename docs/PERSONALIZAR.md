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
  parish: 'Parroquia Monte Tabor',
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

**Logo:** el emblema oficial ya está integrado:

- `assets/img/logo-mark.png`: marca circular para cabecera, pie y acceso.
- `assets/img/favicon.png`: icono del navegador.
- `assets/img/logo-oficial.jpg`: archivo original completo (por si se necesita en impresos).

Si cambia el logo, reemplaza `logo-mark.png` por una versión circular y regenera el favicon a 64×64.

---

## 4. Actividades fijas que se repiten

La misa de comunidad de cada viernes y la misa parroquial del primer domingo no se crean una por una: son **reglas** que el calendario expande automáticamente.

En el panel → **Actividades**, al crear o editar una actividad:

- **Se repite**: `No se repite`, `Cada semana` o `Primer domingo de cada mes`.
- **Repetir hasta**: opcional. Sin fecha, la regla sigue indefinidamente.
- **Comunidad asignada**: para dejar claro qué comunidad sirve esa celebración.

La fecha y hora de la actividad son el **punto de partida** de la serie: de ahí se calculan las siguientes ocurrencias. En el calendario, cada ocurrencia conserva la misma información y se abre con la fecha correcta. No se duplican filas en la base de datos.

> Si cambias la hora de la misa, edita la actividad base y todas las ocurrencias futuras cambiarán. Las fechas pasadas no se reescriben.

La lógica vive en `js/recurrence.js`. Para agregar otra regla (por ejemplo, «todos los sábados»), añade una opción a `RECURRENCES` y un caso en `expandActivity`.

En el calendario, la fila **Comunidad** filtra las actividades por comunidad. Las misas de viernes toman la comunidad de la tabla de **Servicios**, así que el filtro también las muestra correctamente.

---

## 5. Santísimo y servicios de misa

### Santísimo

Es una sección aparte porque cambia **cada mes** y no es una actividad con hora única. El horario corresponde a los **domingos** del mes.

1. Panel → **Santísimo** → **Nuevo horario**.
2. Elige el mes (cualquier día de ese mes), la comunidad, la hora de inicio y la de fin.
3. Repite una fila por comunidad.
4. El orden define cómo se muestran en la página pública.

La página `/#/santisimo` tiene navegación por mes: si un mes aún no tiene horario, muestra un mensaje en lugar de una tabla vacía. Las cinco comunidades iniciales son las del cartel de noviembre; se pueden editar o borrar.

### Servicios de misa

Las misas son recurrentes, pero la comunidad que sirve cambia cada semana. Eso se administra en **Panel → Servicios**:

- **Fecha** de la misa.
- **Servicio**: misa de comunidad (viernes) o misa parroquial (domingo).
- **Comunidad asignada**.

El calendario cruza la fecha de cada ocurrencia con esta tabla y muestra la comunidad en el detalle de la actividad. Si una fecha no tiene asignación, la misa aparece igual, sin comunidad. En la página de Comunidad se listan las próximas asignaciones.

> Las misas recurrentes ya traen la hora: viernes 6:00 p. m. y primer domingo 5:00 p. m. Cambia la actividad base si la parroquia ajusta el horario.

---

## 6. Agregar un tipo de actividad

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

## 7. Agregar un campo a las actividades

Ejemplo: un campo «¿Requiere inscripción?».

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

## 8. Agregar una sección nueva

Ejemplo: una página «Nosotros».

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

Ya aparece en el menú, en el menú móvil y en el pie. Si usas iconos existentes (`calendar`, `megaphone`, `heart`, `book`, `image`, `phone`, `users`, `sun`…), no necesitas nada más. Para un icono nuevo, agrégalo al objeto `PATHS` de `js/icons.js`.

---

## 9. Contenido de ejemplo

El modo demo arranca con datos de `js/seed.js`. Si cambias la estructura de los datos, sube `SEED_VERSION` para que los navegadores vuelvan a sembrar:

```js
export const SEED_VERSION = 10;
```

En Supabase, el contenido de ejemplo es opcional: `supabase/seed.sql`.

---

## 10. Galería de fotos

Hay dos vistas:

- `/#/galeria`: todos los álbumes de la pastoral.
- `/#/fotos`: un espacio por comunidad, con su botón **Subir fotos**.

Cada comunidad puede subir las fotos que necesite, eligiéndolas del teléfono o tomándolas con la cámara. El álbum queda ligado a esa comunidad y aparece también en la galería general. En modo demo las fotos se guardan comprimidas en el navegador (límite de unos 5 MB); con Supabase se guardan en el bucket `media`.

También se puede administrar desde el panel → **Galería**:

1. Crea un álbum (título, fecha, comunidad, color de portada).
2. Pulsa **Subir imágenes** o pega un enlace.
3. Escribe una descripción por foto.
4. Guarda.

Si quieres usar fotos alojadas en otro lugar (Drive, Flickr, etc.), pega el enlace directo a la imagen en el campo de URL. Debe terminar en `.jpg`, `.png` o `.webp` y ser accesible sin iniciar sesión.

---

## 11. Imprimir la cartelera

En `/#/calendario` pulsa **Imprimir**. El CSS de impresión (`assets/css/calendar.css`) oculta menús, botones y pie, y deja el calendario en blanco y negro para fotocopiar.

También puedes descargar el mes en `.ics` y compartirlo por WhatsApp: se abre en Google Calendar, Apple Calendar o Outlook.

---

## 12. Buenas prácticas

- **Prueba primero en modo demo** (sin Supabase) y luego conecta la nube.
- **No cambies los nombres de los campos** de `store.js` sin actualizar la base de datos: son el contrato entre la web y Supabase.
- **No pongas la clave `service_role`** en el frontend. Solo la `anon`.
- **Haz respaldos** antes de cambios grandes: en Supabase, Database → Backups; en demo, exporta el contenido de `localStorage` desde la consola si te importa.
- **Mantén las secciones separadas**: si una sección nueva falla, el calendario debe seguir funcionando. La app ya muestra un mensaje de error solo en la sección afectada.
- **Prueba en el teléfono**: la mayoría de las visitas de una pastoral llegarán desde WhatsApp.

---

## 13. Mapa mental del código

```
config.js     → qué existe (secciones, categorías, textos)
store.js      → de dónde vienen los datos (demo o Supabase)
recurrence.js → cómo se repiten las actividades fijas
ui.js         → piezas visuales comunes (cabecera, modales, campos)
cards.js      → cómo se ve una actividad, aviso, contacto…
views/*.js    → una pantalla = un archivo
app.js        → qué archivo se muestra según la ruta
```

Si respetas esa separación, puedes agregar secciones durante años sin tocar el calendario.
