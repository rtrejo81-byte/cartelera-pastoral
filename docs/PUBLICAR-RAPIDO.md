# Publicar en GitHub Pages en 5 minutos

Esta es la ruta corta. Para el detalle completo, con solución de problemas y dominio propio, usa [GUIA-DESPLIEGUE.md](GUIA-DESPLIEGUE.md).

---

## Antes de empezar

- Cuenta de GitHub.
- La carpeta `cartelera-pastoral` con todos los archivos.
- La web ya está probada y funciona servida desde una subcarpeta, así que no hay que cambiar rutas.

> Durante la revisión se queda en **modo demostración**. Es a propósito: nadie puede alterar el contenido compartido y las propuestas quedan solo en el navegador de cada persona.

---

## 1. Crear el repositorio

1. Entra a <https://github.com/new>.
2. **Repository name**: `cartelera-pastoral`.
3. Visibilidad: **Public**.
4. No marques README, `.gitignore` ni licencia.
5. **Create repository**.

---

## 2. Subir el contenido

1. En el repositorio vacío pulsa **uploading an existing file**.
2. Abre la carpeta `cartelera-pastoral` en el Explorador de Windows.
3. Selecciona **el contenido**, no la carpeta: `index.html`, `assets`, `js`, `docs`, `supabase`, `README.md`, `.nojekyll`.
4. Arrástralo a GitHub y pulsa **Commit changes**.

Debe quedar `index.html` en la **raíz** del repositorio.

> Si no ves `.nojekyll` porque Windows oculta los archivos que empiezan con punto, no pasa nada: el sitio funciona igual sin ese archivo.

### Alternativa con Git

```bash
cd cartelera-pastoral
git remote add origin https://github.com/TU-USUARIO/cartelera-pastoral.git
git push -u origin main
```

---

## 3. Activar Pages

1. **Settings** → **Pages**.
2. *Source*: **Deploy from a branch**.
3. *Branch*: `main` · *Folder*: `/ (root)`.
4. **Save**.

Espera 1–2 minutos. La dirección queda así:

```
https://TU-USUARIO.github.io/cartelera-pastoral/
```

---

## 4. Compartir solo con el equipo general

- Envía la URL por el grupo del equipo general, no a toda la pastoral todavía.
- Pídeles revisar sobre todo: **calendario**, **Santísimo**, **servicios** y **equipo y comunidades**.
- Usa la lista de [REVISION.md](REVISION.md) para recoger observaciones.

Mientras se publica, si están en la misma red WiFi pueden verla en:

```
http://192.168.1.69:8089
```

> Esa dirección depende de la red y de que esta computadora siga encendida; sirve para revisar hoy, no para compartir a largo plazo.

---

## 5. Después de la aprobación

1. Conectar Supabase.
2. Crear las cuentas:
   - Coordinador general → `admin`.
   - Responsables de eje → `editor`.
   - Coordinadores de comunidad → `editor`.
3. Cargar nombres, teléfonos y fotos reales.
4. Probar con dos coordinadores antes de abrirla a todos.

---

## Si algo falla

**404 al abrir la URL.**
Revisa que `index.html` esté en la raíz del repositorio y que Pages use `main` + `/ (root)`.

**Página en blanco.**
Suele ser que se subió la carpeta contenedora y `index.html` quedó un nivel abajo. Mueve el contenido a la raíz.

**Sin estilos.**
Faltó la carpeta `assets/`. Vuelve a subirla conservando el nombre exacto.

**Los cambios no aparecen.**
Espera dos minutos y recarga con `Ctrl + F5`.
