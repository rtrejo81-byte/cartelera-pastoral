# Fotos y almacenamiento

## Cuánto espacio hay

El proyecto está en el **plan Free de Supabase**. Los límites actuales son:

| Recurso | Plan Free |
| --- | --- |
| Almacenamiento de archivos | **1 GB** |
| Archivo máximo por subida | **50 MB** |
| Salida (egress) al mes | **5 GB** (+5 GB en caché) |
| Base de datos | 500 MB |
| Proyectos gratuitos | 2 |
| Pausa por inactividad | Después de 1 semana sin uso |

Fuentes: [Supabase Pricing](https://supabase.com/pricing) y [Storage upload limits](https://supabase.com/docs/guides/storage/uploads/file-limits).

La base de datos **no** guarda las fotos: guarda solo la dirección. Las imágenes viven en el bucket `media`.

## Cuántas fotos caben

La web comprime cada foto a un máximo de **1600 px** y calidad 82 %, en **WebP** (o JPEG si el navegador es antiguo). Una foto típica de teléfono queda entre **200 y 450 KB**.

También puedes tomar fotos directamente con la cámara del teléfono: el botón **“Tomar foto”** abre la cámara trasera y cada toque agrega una foto más al mismo álbum. Puedes tomar todas las que necesites y quitar las que no te gusten antes de publicar.

| Tamaño promedio | Fotos aproximadas en 1 GB |
| --- | --- |
| 200 KB | ~5,000 |
| 300 KB | ~3,400 |
| 450 KB | ~2,300 |

Sin compresión, una foto de 4 MB solo permitiría ~250. Por eso la compresión está activada también al subir a Supabase.

> No hay un límite fijo de fotos por álbum: puedes seleccionar varias o tomarlas con la cámara del teléfono. El límite real es el **1 GB** del plan y la compresión automática.
>
> Al **eliminar un álbum** o quitar una foto desde el panel, la web también borra el archivo del bucket `media` para liberar espacio. Los archivos que se hayan subido antes de este cambio, o los que se borren directamente en la base de datos, hay que limpiarlos a mano en **Storage → media**.

## Medidor de espacio

En **Panel → Ajustes → Almacenamiento de fotos** hay una barra con:

- los **MB usados** y el porcentaje del 1 GB;
- cuántos archivos hay en el bucket;
- cuánto espacio libre queda.

La barra se pone **dorada** al 70 % y **roja** al 90 %. El botón **Actualizar** vuelve a leer el bucket. El cálculo incluye también archivos antiguos que hayan quedado sin álbum, así que sirve para detectar basura acumulada.

## Enlaces externos (Drive, Flickr, etc.)

Sí se pueden usar. En **Fotos por comunidad → Subir fotos** hay un campo:

> “O pega un enlace directo a una imagen”

También se pueden agregar desde **Panel → Galería → Editar álbum → Agregar por enlace**.

### Cómo obtener un enlace directo de Google Drive

1. En Drive, clic derecho sobre la foto → **Compartir** → **Cualquier persona con el enlace** (lector).
2. Copia el enlace. Se ve así:

```
https://drive.google.com/file/d/ARCHIVO_ID/view?usp=sharing
```

3. Convierte ese enlace a uno directo:

```
https://drive.google.com/uc?export=view&id=ARCHIVO_ID
```

o, si el primero no carga:

```
https://lh3.googleusercontent.com/d/ARCHIVO_ID
```

4. Pega el enlace directo en el campo y publica.
5. Abre la página en una ventana de incógnito para comprobar que la imagen se ve sin iniciar sesión.

**Limitaciones de Drive:**
- Si el archivo deja de ser público, la foto desaparece de la web.
- Drive no es un CDN: puede tardar o bloquear la carga.
- Los enlaces de la página de Drive (`/file/d/.../view`) **no** funcionan como imagen; hay que usar el formato directo.
- Los enlaces de Google Photos normalmente no sirven como imagen directa.

Los enlaces externos **no consumen** los 1 GB de Supabase, pero tampoco están respaldados por la web. Úsalos para material muy pesado o videos; para las fotos de la pastoral, subirlas a Supabase es más estable.

## Buenas prácticas

- **Guarda los originales** en tu computadora o en Drive. Supabase no reemplaza un respaldo.
- **Borra fotos antiguas** cuando se acerque el límite: Panel → Galería → eliminar álbum. Ojo: eliminar el álbum **no** borra el archivo del bucket; también hay que borrarlo en **Storage → media**.
- Revisa el consumo en **Supabase → Storage** y en **Organization → Usage**.
- Si algún día se llena, el plan Pro incluye 100 GB por unos $25/mes. Para una pastoral, 1 GB con compresión debería alcanzar para miles de fotos.

## Qué pasa si se llena

La subida falla y la web muestra un error. No se pierde nada de lo ya publicado. Puedes:
1. Borrar fotos antiguas en Storage.
2. Seguir usando enlaces externos.
3. Pasar al plan Pro.
