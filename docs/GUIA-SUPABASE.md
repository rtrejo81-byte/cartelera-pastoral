# Guía de Supabase

Supabase es la pieza que convierte la web en una **cartelera viva**: base de datos, usuarios y fotos, con plan gratuito. Sin esto, la web funciona en modo demostración guardando todo en el navegador de cada persona.

Tiempo estimado: 20–30 minutos.

---

## 1. Crear la cuenta y el proyecto

1. Entra a <https://supabase.com> y crea una cuenta (puedes usar GitHub o correo).
2. Pulsa **New project**.
3. Completa:
   - **Name**: `cartelera-pastoral`
   - **Database Password**: una contraseña fuerte. Guárdala, la necesitarás para tareas avanzadas.
   - **Region**: la más cercana (por ejemplo `East US` para Centroamérica).
   - **Plan**: Free.
4. **Create new project** y espera 1–2 minutos mientras se prepara.

---

## 2. Crear las tablas y la seguridad

1. En el menú izquierdo abre **SQL Editor**.
2. Pulsa **New query**.
3. Abre el archivo [`supabase/schema.sql`](../supabase/schema.sql) de este proyecto, copia **todo** su contenido y pégalo en el editor.
4. Pulsa **Run** (o `Ctrl + Enter`).

Debe aparecer **“Success. No rows returned”**. Ese único archivo crea:

- Las tablas: actividades, avisos, cumpleaños, recursos, contactos, álbumes, oración, **horario del Santísimo**, **servicios asignados**, ajustes y perfiles.
- Las reglas de seguridad (RLS): el público solo ve lo aprobado; solo los coordinadores escriben.
- Los perfiles automáticos al crear usuarios.
- El contador de “Amén”.
- La sincronización en vivo (Realtime).
- El espacio de imágenes (`media`) en Storage.

> **¿Ya tenías el proyecto instalado?** Vuelve a ejecutar `schema.sql` completo. Es idempotente y agrega lo nuevo: las columnas `recurrence`, `recurrence_until` y `community` en actividades, y las tablas `holy_hours` y `service_assignments`.

### Contenido inicial (opcional)

Si no quieres que la web empiece vacía:

1. **New query**.
2. Pega el contenido de [`supabase/seed.sql`](../supabase/seed.sql).
3. **Run**.

Puedes editar o borrar todo después desde el panel.

---

## 3. Conectar la web

1. En Supabase, abre **Project Settings** (engranaje) → **API**.
2. Copia dos valores:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** (en *Project API keys*)
3. Abre el archivo [`js/config.js`](../js/config.js) y pégalos:

```js
export const SUPABASE = {
  url: 'https://abcdefgh.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

4. Guarda y vuelve a publicar la web (sube el archivo a GitHub o haz `git push`).

Al recargar, el banner amarillo de “Modo demostración” desaparece y el panel pide correo y contraseña de verdad.

> La **anon key** es pública por diseño. No es una contraseña: solo identifica tu proyecto. La seguridad la ponen las políticas RLS del paso 2. **Nunca** pongas aquí la clave `service_role`.

---

## 4. Crear los usuarios coordinadores

1. Menú izquierdo: **Authentication** → **Users**.
2. Pulsa **Add user** → **Create new user**.
3. Escribe nombre, correo y contraseña.
4. Activa **Auto Confirm User** (para que no tenga que confirmar por correo) y crea.

Repite para cada coordinador. Cada uno entrará en `/#/admin` con ese correo y contraseña.

> Si prefieres que se registren solos, puedes activar el registro público en **Authentication → Providers → Email**, pero para un grupo pequeño es más seguro crearlos tú.

---

## 5. Dar permisos de administrador al primero

Los usuarios nuevos entran con rol `viewer` (solo lectura). Para que puedan publicar:

1. **SQL Editor → New query**.
2. Ejecuta, cambiando el correo:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'tu-correo@ejemplo.org');
```

3. Verifica con:

```sql
select p.full_name, u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at;
```

Roles disponibles:

| Rol | Permisos |
| --- | --- |
| `admin` | Todo, incluido gestionar perfiles. |
| `editor` / `coordinador` | Crear, editar, aprobar y borrar contenido. |
| `viewer` | Solo lectura del panel. |

---

## 6. Verificar Realtime y Storage

**Realtime** (que los cambios aparezcan sin recargar):

1. **Database → Replication** (o *Publications*).
2. Debe existir la publicación `supabase_realtime` con las tablas del proyecto.
3. Si falta alguna, ejecuta en SQL Editor:

```sql
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.notices;
alter publication supabase_realtime add table public.prayer_requests;
```

**Storage** (fotos de la galería):

1. **Storage** → debe existir el bucket **`media`** marcado como **Public**.
2. Si no existe, vuelve a ejecutar la sección 8 de `schema.sql`.

Sin el bucket público, las fotos se suben pero no se ven.

---

## 7. Probar de punta a punta

1. Abre la web publicada en una ventana normal.
2. Entra a `/#/admin` con el usuario administrador.
3. Crea una actividad con fecha futura y guárdala.
4. Abre la web en una ventana de incógnito o en tu teléfono: la actividad debe aparecer.
5. Envía una propuesta desde “Proponer actividad” (en incógnito) y apruébala desde el panel.
6. Sube una foto a un álbum y comprueba que se ve en la galería.
7. Revisa que la **misa de comunidad** aparezca todos los viernes y la **misa parroquial** el primer domingo del mes.
8. Agrega un horario en **Panel → Santísimo** y verifícalo en `/#/santisimo`.
9. Asigna una comunidad a un viernes en **Panel → Servicios** y comprueba que aparezca en el detalle de esa misa.

Si todo eso funciona, la cartelera ya es colaborativa.

---

## 8. Problemas frecuentes

**“La tabla no existe” o error `42P01`.**
No se ejecutó `schema.sql` completo. Vuelve al paso 2 y ejecútalo de nuevo (es idempotente).

**“No tienes permiso para esta acción” / error `42501`.**
Tu usuario no tiene rol de editor. Ejecuta el `update` del paso 5 y vuelve a iniciar sesión.

**“Correo o contraseña incorrectos”.**
Verifica el usuario en Authentication → Users. Si dice “correo no confirmado”, edita el usuario y marca **Confirm email**.

**Las imágenes no se ven.**
El bucket `media` no es público, o faltan las políticas de Storage. Ejecuta de nuevo la sección 8 de `schema.sql`.

**Los cambios no se actualizan solos en otros dispositivos.**
Realtime no está activo para esas tablas (paso 6). La web igual se actualiza al recargar.

**Supabase pausó el proyecto.**
Los proyectos gratuitos se pausan tras varios días sin uso. Entra al dashboard y pulsa **Restore**. Se reactiva en un minuto.

**¿Cómo respaldo la información?**
**Database → Backups** (el plan gratuito incluye respaldos diarios). También puedes exportar una tabla a CSV desde el Table Editor.

---

## 9. Límites y costos

El plan gratuito de Supabase incluye, al momento de escribir esta guía:

- 500 MB de base de datos.
- 1 GB de almacenamiento de archivos.
- Usuarios ilimitados.
- Proyectos pausados por inactividad.

Para una pastoral familiar, de sobra. Revisa los límites actuales en <https://supabase.com/pricing>.

Cuando el grupo crezca, el siguiente paso natural es el plan Pro, pero no es necesario para empezar.

---

## 10. Si algo se complica

Vuelve al **modo demo**: vacía `SUPABASE.url` en `js/config.js` y la web seguirá funcionando con datos locales. Nunca te quedas sin cartelera.
