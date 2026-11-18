/* =========================================================
   Fotos por comunidad
   Cada comunidad tiene su espacio y puede subir un álbum.
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { COMMUNITIES } from '../config.js';
import {
  pageHead, openModal, closeModal, field, readForm,
  showFormError, setBusy, toast,
} from '../ui.js';
import { albumCard } from '../cards.js';
import { esc, ymd, uid, pluralize } from '../utils.js';

const TONE_OPTIONS = [
  { value: 'sage', label: 'Verde' },
  { value: 'clay', label: 'Terracota' },
  { value: 'gold', label: 'Dorado' },
  { value: 'teal', label: 'Azul petróleo' },
  { value: 'rose', label: 'Rosa' },
];

export default function photosView(root) {
  const albums = store.publicList('albums');
  const general = albums.filter((a) => !a.community);
  const canUpload = store.canEdit() || store.mode === 'demo';

  const block = (title, description, items, communityValue = '') => `
    <section class="community-gallery">
      <div class="between community-gallery-head">
        <div>
          <p class="eyebrow">${communityValue ? 'Comunidad' : 'Toda la pastoral'}</p>
          <h2 class="section-title" style="font-size:1.5rem">${esc(title)}</h2>
          <p class="section-sub" style="margin-top:.2rem">${esc(description)}</p>
        </div>
        ${
          communityValue
            ? canUpload
              ? `<button type="button" class="btn btn-primary btn-sm" data-upload="${esc(communityValue)}">${icon('upload', 15)} Subir fotos</button>`
              : `<a class="btn btn-ghost btn-sm" href="#/admin">${icon('lock', 15)} Entrar como coordinador</a>`
            : ''
        }
      </div>
      ${
        items.length
          ? `<div class="album-grid">${items.map(albumCard).join('')}</div>`
          : `<div class="gallery-empty">
              <span class="empty-icon">${icon('image', 22)}</span>
              <p>Aún no hay fotos de ${communityValue ? esc(title) : 'esta sección'}.</p>
              ${
                communityValue && canUpload
                  ? `<button type="button" class="btn btn-light btn-sm" data-upload="${esc(communityValue)}">${icon('upload', 15)} Subir las primeras</button>`
                  : ''
              }
            </div>`
      }
    </section>`;

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Memoria de las comunidades',
      title: 'Fotos de las comunidades',
      subtitle:
        'Cada comunidad tiene su propio álbum. Las fotos se comparten con toda la pastoral y quedan guardadas en la galería.',
      actions: `<a class="btn btn-ghost" href="#/galeria">${icon('image', 16)} Ver galería general</a>`,
    })}

    <section class="section-tight">
      <div class="wrap">
        ${
          !canUpload
            ? `<div class="inline-note mb-3">${icon('lock', 16)}<span>Para subir fotos necesitas iniciar sesión como coordinador. <a href="#/admin">Entrar al panel</a>.</span></div>`
            : store.mode === 'demo'
              ? `<div class="inline-note mb-3">${icon('sparkles', 16)}<span><b>Modo demostración:</b> las fotos se guardan solo en este navegador. Al conectar Supabase quedarán disponibles para toda la pastoral.</span></div>`
              : ''
        }

        ${general.length ? block('Toda la pastoral', 'Momentos que reúnen a todas las comunidades.', general) : ''}
        ${COMMUNITIES.map((c) =>
          block(
            c.label,
            'Fotos y recuerdos de nuestra comunidad.',
            albums.filter((a) => a.community === c.value),
            c.value
          )
        ).join('')}
      </div>
    </section>`;

  root.querySelectorAll('[data-upload]').forEach((button) => {
    button.addEventListener('click', () => openUpload(button.dataset.upload));
  });
}

function openUpload(communityValue) {
  const community = COMMUNITIES.find((c) => c.value === communityValue);
  if (!community) return;
  if (!(store.canEdit() || store.mode === 'demo')) {
    location.hash = '#/admin';
    return;
  }

  const { el } = openModal({
    title: `Subir fotos · ${community.label}`,
    subtitle: 'Se creará un álbum nuevo y se publicará en la galería.',
    wide: true,
    body: `
      <form id="photos-form" class="form-grid" novalidate>
        ${field({ label: 'Título del álbum', name: 'title', required: true, value: `Fotos de ${community.label}`, max: '120' })}
        <div class="field-row">
          ${field({ label: 'Fecha', name: 'date', type: 'date', value: ymd(new Date()) })}
          ${field({ label: 'Color de portada', name: 'tone', type: 'select', value: community.tone, options: TONE_OPTIONS })}
        </div>
        ${field({ label: 'Descripción', name: 'description', type: 'textarea', rows: 2, placeholder: '¿Qué actividad fue?' })}
        <div class="field">
          <label class="label" for="photos-files">Fotos (archivos)</label>
          <input class="input" type="file" id="photos-files" accept="image/*" multiple>
          <span class="field-hint">Hasta 4 fotos por vez. Se comprimen a 1600 px para ahorrar espacio.</span>
          <span class="field-hint" id="photos-count">No has seleccionado fotos.</span>
        </div>
        ${field({
          label: 'O pega un enlace directo a una imagen',
          name: 'photo_url',
          type: 'url',
          placeholder: 'https://…',
          hint: 'Drive, Flickr u otro sitio. No ocupa espacio en Supabase; el archivo debe ser público y el enlace debe abrir la imagen directamente.',
        })}
      </form>`,
    footer: `
      <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
      <button type="button" class="btn btn-primary" data-save>${icon('upload', 16)} Publicar fotos</button>`,
  });

  const form = el.querySelector('#photos-form');
  const input = el.querySelector('#photos-files');
  const count = el.querySelector('#photos-count');
  const saveBtn = el.querySelector('[data-save]');

  input.addEventListener('change', () => {
    const files = Array.from(input.files || []);
    count.textContent = files.length
      ? `${pluralize(files.length, 'foto seleccionada', 'fotos seleccionadas')}: ${files.map((f) => f.name).join(', ')}`
      : 'No has seleccionado fotos.';
  });

  saveBtn.addEventListener('click', async () => {
    const data = readForm(form);
    const files = Array.from(input.files || []);
    const externalUrl = String(data.photo_url || '').trim();
    if (!data.title || data.title.trim().length < 3) {
      showFormError(form, 'Escribe un título para el álbum.');
      return;
    }
    if (!files.length && !externalUrl) {
      showFormError(form, 'Selecciona al menos una foto o pega un enlace directo.');
      return;
    }
    if (files.length > 4) {
      showFormError(form, 'Por ahora se pueden subir hasta 4 fotos por álbum.');
      return;
    }
    if (files.some((f) => !f.type.startsWith('image/'))) {
      showFormError(form, 'Uno de los archivos no es una imagen.');
      return;
    }
    if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
      showFormError(form, 'El enlace debe comenzar con http:// o https://');
      return;
    }

    setBusy(saveBtn, true, 'Guardando fotos…');
    try {
      const photos = [];
      for (const file of files) {
        const url = await store.uploadImage(file);
        photos.push({
          id: uid('ph'),
          caption: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          url,
        });
      }
      if (externalUrl) {
        photos.push({ id: uid('ph'), caption: 'Enlace externo', url: externalUrl });
      }
      await store.create('albums', {
        title: data.title.trim(),
        description: (data.description || '').trim(),
        date: data.date || ymd(new Date()),
        tone: data.tone || community.tone,
        community: community.value,
        status: 'approved',
        photos,
      });
      closeModal({ silent: true });
      toast('Fotos publicadas. ¡Gracias por compartirlas!', 'ok');
    } catch (err) {
      setBusy(saveBtn, false);
      showFormError(form, err.message || 'No se pudieron subir las fotos.');
    }
  });
}
