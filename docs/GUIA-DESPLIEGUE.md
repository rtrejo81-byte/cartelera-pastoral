# Guía de despliegue en GitHub Pages

Esta guía te lleva de la carpeta en tu computadora a una dirección web pública, paso a paso. No necesitas instalar nada para la opción A.

---

## Antes de empezar

- Una cuenta en [GitHub](https://github.com) (gratis).
- La carpeta `cartelera-pastoral` con todos los archivos.
- 10 minutos.

> **Importante:** GitHub Pages publica archivos estáticos. La web funcionará en **modo demostración** hasta que conectes Supabase (ver [GUIA-SUPABASE.md](GUIA-SUPABASE.md)). Eso es normal y no impide publicarla.

---

## Opción A · Subir desde el navegador (recomendada)

### 1. Crear el repositorio

1. Entra a GitHub y pulsa **+ → New repository**.
2. Nombre: `cartelera-pastoral` (o el que prefieras).
3. Visibilidad: **Public** (Pages gratuito requiere repositorio público).
4. **No** marques “Add a README file”, ni `.gitignore`, ni licencia.
5. Pulsa **Create repository**.

### 2. Subir los archivos

1. En el repositorio vacío pulsa **uploading an existing file**.
2. Abre la carpeta `cartelera-pastoral` en el Explorador de Windows.
3. Selecciona **todo el contenido** (`Ctrl + E` o `Ctrl + A`), no la carpeta.
4. Arrástralo a la zona de GitHub.
5. Espera a que termine la lista y pulsa **Commit changes**.

Debe quedar así en la raíz del repositorio:

```
index.html
assets/
js/
docs/
supabase/
README.md
```

> Si ves una carpeta `cartelera-pastoral/` dentro del repositorio, `index.html` quedó un nivel abajo y la web dará 404. En ese caso borra y vuelve a subir el contenido, no la carpeta.

### 3. Activar GitHub Pages

1. En el repositorio: **Settings** (arriba).
2. Menú izquierdo: **Pages**.
3. En *Build and deployment → Source* elige **Deploy from a branch**.
4. *Branch*: `main` · *Folder*: `/ (root)` · **Save**.
5. Espera 1–2 minutos y recarga la página de Pages. Aparecerá:

```
Your site is live at https://TU-USUARIO.github.io/cartelera-pastoral/
```

### 4. Abrir la web

Entra a esa dirección. Si ves el logo y la portada, ya está publicada.

Si aparece **404**, revisa:
- Que `index.html` esté en la raíz del repositorio.
- Que hayas esperado el tiempo de publicación (Actions → último workflow en verde).
- Que la rama sea `main` (o `master`, según tu repositorio).

---

## Opción B · Subir con Git desde la terminal

Necesitas Git instalado. En la carpeta del proyecto:

```bash
cd cartelera-pastoral
git init
git add .
git commit -m "Cartelera Pastoral Familiar"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/cartelera-pastoral.git
git push -u origin main
```

Luego activa Pages como en el paso 3 de la opción A.

Para actualizar más adelante:

```bash
git add .
git commit -m "Actualizo actividades"
git push
```

---

## Actualizar el contenido

Tienes tres caminos:

| Qué quieres cambiar | Cómo |
| --- | --- |
| Actividades, avisos, cumpleaños, contactos, fotos | Panel de administración, en `/#/admin` (con Supabase conectado). |
| Textos de la portada, parroquia, contacto, secciones visibles | Panel → **Ajustes**. |
| Colores, logo, estructura o código | Editar archivos y subirlos de nuevo (o `git push`). |

GitHub Pages tarda entre 30 segundos y 2 minutos en reflejar los cambios. Si no los ves, recarga con `Ctrl + F5`.

---

## Dominio propio (opcional)

Si la parroquia tiene un dominio, por ejemplo `pastoralfamiliar.org`:

1. En **Settings → Pages → Custom domain** escribe el dominio y guarda.
2. En el proveedor del dominio crea estos registros DNS:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `TU-USUARIO.github.io` |

3. Espera la propagación (puede tardar horas) y activa **Enforce HTTPS**.

También puedes usar un subdominio: crea un `CNAME` con el valor `TU-USUARIO.github.io`.

---

## Problemas comunes

**La página está en blanco.**
Suele ser que los archivos quedaron dentro de una subcarpeta, o que abriste `index.html` con doble clic (`file://`). La web debe abrirse desde GitHub Pages o desde un servidor local (`python -m http.server`). Abre la consola del navegador (`F12`) para ver el error exacto.

**Se ve el texto pero sin estilos.**
Faltan archivos de `assets/css/` o se subieron con otro nombre. Verifica que las carpetas conserven exactamente el nombre y las mayúsculas (GitHub distingue mayúsculas en Linux).

**Los cambios no aparecen.**
Espera dos minutos y recarga sin caché. Si editaste desde el panel con Supabase, los cambios son inmediatos; si editaste archivos, Pages debe reconstruir.

**El panel dice “Modo demostración”.**
Falta conectar Supabase. Sigue [GUIA-SUPABASE.md](GUIA-SUPABASE.md).

**Quiero que el repositorio sea privado.**
GitHub Pages en repositorios privados requiere un plan de pago. Para una pastoral, un repositorio público está bien: no contiene contraseñas, solo la *anon key* de Supabase, que está diseñada para ser pública y protegida por las reglas RLS.

---

## Checklist de publicación

- [ ] `index.html` está en la raíz del repositorio.
- [ ] Pages está activo en la rama correcta.
- [ ] La URL carga la portada y el calendario.
- [ ] Probé el botón “Proponer actividad”.
- [ ] Probé el panel en `/#/admin`.
- [ ] (Cuando toque) Supabase conectado y sin banner de demo.
- [ ] Un coordinador real pudo iniciar sesión desde su teléfono.
