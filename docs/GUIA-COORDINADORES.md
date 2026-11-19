# Dar acceso a los coordinadores con Supabase

Esta guía deja a los 10 coordinadores actuales con cuenta propia para editar la cartelera. Se hace una sola vez; después solo se agregan o cambian personas.

> **Importante:** las contraseñas **no** se guardan en el proyecto ni en GitHub. Las defines tú al crear cada usuario y las compartes en privado.

---

## Cómo van a entrar

Para no depender de correos personales, cada coordinador entra con **su número de teléfono** y una contraseña.

La web convierte el teléfono en un correo interno:

```
503 + número  →  50376540943@coordinadores.pastoralfamiliar.org
```

Ese correo no recibe mensajes: es solo el identificador de Supabase. Por eso el usuario se crea con ese correo y con **Auto Confirm User** activado.

---

## 1. Crear el proyecto de Supabase

1. Entra a <https://supabase.com> e inicia sesión (puedes usar GitHub).
2. **New project**.
3. Nombre: `pastoral-familiar`.
4. Contraseña de base de datos: una fuerte; guárdala.
5. Región: la más cercana (`East US` funciona bien).
6. Plan **Free** → **Create new project**.
7. Espera 1–2 minutos.

---

## 2. Crear las tablas y cargar el contenido

1. **SQL Editor → New query**.
2. Pega **todo** `supabase/schema.sql` → **Run**. Debe decir *Success*.
3. **New query** → pega `supabase/seed.sql` → **Run**. Esto carga actividades, Santísimo, servicios, contactos reales y fotos de ejemplo.

---

## 3. Conectar la web

1. **Project Settings → API**.
2. Copia:
   - **Project URL**
   - **anon public**
3. Abre `js/config.js` y pégalos:

```js
export const SUPABASE = {
  url: 'https://TU-PROYECTO.supabase.co',
  anonKey: 'eyJ...',
};
```

4. Guarda, haz commit y push. GitHub Pages se actualiza solo.

> La `anon key` es pública por diseño. La seguridad la ponen las reglas RLS. **Nunca** uses aquí la `service_role`.

---

## 4. Crear los 10 usuarios

En Supabase: **Authentication → Users → Add user → Create new user**.

Para cada persona:

| Persona | Teléfono | Correo para crear el usuario | Rol |
| --- | --- | --- | --- |
| Ricardo Varela | 7654-0943 | `50376540943@coordinadores.pastoralfamiliar.org` | admin |
| Roberto Trejo | 7745-8014 | `50377458014@coordinadores.pastoralfamiliar.org` | admin |
| Edward Minero | 7616-3574 | `50376163574@coordinadores.pastoralfamiliar.org` | editor |
| Mariela | 7931-8852 | `50379318852@coordinadores.pastoralfamiliar.org` | editor |
| Juan Trejo | 7856-4788 | `50378564788@coordinadores.pastoralfamiliar.org` | editor |
| Gabriela Trejo | 7240-0130 | `50372400130@coordinadores.pastoralfamiliar.org` | editor |
| Isabel Luna | 7011-3964 | `50370113964@coordinadores.pastoralfamiliar.org` | editor |
| Krissia Avalos | 6955-6753 | `50369556753@coordinadores.pastoralfamiliar.org` | editor |
| Manuel Figueroa | 7885-0684 | `50378850684@coordinadores.pastoralfamiliar.org` | editor |
| Samuel Avelar | 6979-0977 | `50369790977@coordinadores.pastoralfamiliar.org` | editor |

- **Password**: una temporal para cada uno (mínimo 8 caracteres). Anótala en privado.
- **Auto Confirm User**: activado.
- No hace falta enviar correo.

> Si algún teléfono cambia, el usuario de Supabase se crea con el número nuevo y luego se actualiza su perfil con el SQL del paso 5.

---

## 5. Asignar nombres y roles

1. **SQL Editor → New query**.
2. Pega `supabase/coordinators.sql` → **Run**.
3. Al final debe mostrar los 10 perfiles con su rol.

Si un correo no coincide, ese perfil no se actualiza. Revisa que el correo del usuario sea exactamente el de la tabla.

---

## 6. Probar el acceso

1. Abre `/#/admin`.
2. Entra con el **teléfono** (por ejemplo `7654-0943`) y la contraseña temporal.
3. Debe aparecer el panel con el nombre de la persona.
4. Prueba crear una actividad y revisa que aparezca en el calendario de otro dispositivo.

Si dice *“Correo/teléfono o contraseña incorrectos”*:
- Verifica que el usuario exista y esté confirmado.
- Revisa que el correo sea `503` + los 8 dígitos.
- Restablece la contraseña desde Authentication → Users.

---

## 7. Cambiar la contraseña temporal
Cada coordinador, al entrar:

1. **Ajustes → Mi contraseña**.
2. Escribe la nueva contraseña dos veces.
3. **Actualizar contraseña**.

Así la temporal deja de servir.

---

## Si alguien olvida su contraseña

Como las cuentas usan un correo interno (no reciben mensajes), **no sirve** el botón “Reset password” que envía correo. El administrador debe asignar una nueva.

### Opción A · Recrear el usuario (la más simple)

1. **Authentication → Users**.
2. Busca el correo interno de la persona, por ejemplo `50376540943@coordinadores.pastoralfamiliar.org`.
3. Menú de tres puntos → **Delete user**.
4. **Add user → Create new user** con el mismo correo, una contraseña temporal nueva y **Auto Confirm User**.
5. Ejecuta de nuevo `coordinators.sql` para devolverle nombre y rol.
6. Comparte la temporal en privado y pídele cambiarla en **Ajustes → Mi contraseña**.

No se pierde el contenido que haya publicado: las actividades, fotos y avisos no dependen del usuario.

### Opción B · Admin API (sin borrar la cuenta)

Requiere la clave `service_role`, que **nunca** debe ir en la web ni en GitHub. Desde una computadora de confianza:

```bash
curl -X PUT "https://fpipersxktkkctwdesgs.supabase.co/auth/v1/admin/users/USER_ID" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password":"NuevaTemporal123"}'
```

El `USER_ID` se ve en Authentication → Users o en la URL del usuario. Si no te sientes cómodo con esto, usa la Opción A.

### Recomendaciones

- Que haya **dos administradores** (Ricardo y Roberto) para que siempre haya quien restablezca.
- No compartas la `service_role` por WhatsApp ni la pongas en el proyecto.
- Si más adelante quieren recuperación automática, se pueden usar correos reales o agregar una función de recuperación; hoy no es necesaria para 10 personas.

---

## Roles y permisos actuales

| Rol | Puede |
| --- | --- |
| `admin` (Ricardo y Roberto) | Todo, incluido administrar Supabase. |
| `editor` (los demás) | Crear, editar y borrar todo el contenido: actividades, avisos, fotos, Santísimo y servicios. |
| `viewer` | Solo lectura del panel. |

Todos los editores pueden editar todo. Si más adelante quieres que cada coordinador de comunidad edite **solo su comunidad**, se puede agregar esa restricción; hoy priorizamos que el equipo pueda publicar sin bloqueos.

---

## Fotos y almacenamiento

El plan Free incluye **1 GB** para fotos, **50 MB** por archivo y **5 GB** de salida al mes. La web comprime cada foto a 1600 px en WebP antes de subirla, así que una foto típica queda en 200–450 KB: caben aproximadamente **2,300 a 5,000 fotos**.

También se pueden usar **enlaces externos** (Drive, Flickr) sin consumir ese 1 GB, pero el enlace debe abrir la imagen directamente y ser público. Detalles y conversión de enlaces de Drive: [FOTOS-Y-ALMACENAMIENTO.md](FOTOS-Y-ALMACENAMIENTO.md).

---

## Cambios de enero

Cuando cambien coordinadores:

1. **Contenido visible**: panel → **Contactos**, editar nombre/teléfono/rol. No requiere SQL.
2. **Acceso**:
   - Persona nueva: crear usuario en Authentication con su teléfono y correr el `insert/update` de `coordinators.sql` para esa persona.
   - Persona que sale: Authentication → Users → desactivar o borrar; su perfil se elimina en cascada.
3. Si cambia un teléfono, se crea el usuario nuevo y se actualiza el perfil; el anterior se desactiva.

---

## Problemas frecuentes

**“La tabla no existe”.**
No se ejecutó `schema.sql` completo.

**“No tienes permiso para esta acción”.**
El perfil no tiene rol de editor. Ejecuta `coordinators.sql` y vuelve a iniciar sesión.

**El login con teléfono falla.**
El correo del usuario debe ser exactamente `503` + 8 dígitos + `@coordinadores.pastoralfamiliar.org`. Revisa también que esté **confirmado**.

**Las fotos no se ven.**
El bucket `media` debe existir y ser público; lo crea `schema.sql`.

**Quiero usar correos reales en vez de teléfonos.**
Se puede: se crean los usuarios con su correo real y se entra escribiendo el correo. La app acepta ambas formas.
