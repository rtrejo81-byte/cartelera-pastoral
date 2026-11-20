/* =========================================================
   Formularios del panel de administración
   Definidos por esquema: agregar un campo es agregar un objeto.
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import {
  CATEGORIES, COMMUNITIES, PRIORITIES, RESOURCE_KINDS, BIRTHDAY_KINDS, STATUS,
} from '../config.js';
import { RECURRENCES } from '../recurrence.js';
import { openModal, closeModal, field, readForm, showFormError, setBusy, toast } from '../ui.js';
import { esc, toDateInput, toDateTimeInput, uid, normalizeImageUrl, imageUrlProblem } from '../utils.js';

const statusOptions = Object.entries(STATUS).map(([value, meta]) => ({ value, label: meta.label }));

const TONES = [
  { value: 'sage', label: 'Verde salvia' },
  { value: 'clay', label: 'Terracota' },
  { value: 'gold', label: 'Dorado' },
  { value: 'teal', label: 'Azul petróleo' },
  { value: 'rose', label: 'Rosa' },
  { value: 'ink', label: 'Verde oscuro' },
];

export const FORMS = {
  activities: {
    label: 'Actividad',
    wide: true,
    fields: [
      { name: 'title', label: 'Nombre de la actividad', type: 'text', required: true, full: true },
      { name: 'category', label: 'Tipo', type: 'select', options: CATEGORIES.map((c) => ({ value: c.id, label: c.label })) },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
      { name: 'starts_at', label: 'Fecha y hora de inicio', type: 'datetime-local', required: true },
      { name: 'ends_at', label: 'Fecha y hora de fin', type: 'datetime-local' },
      { name: 'location', label: 'Lugar', type: 'text' },
      {
        name: 'community',
        label: 'Comunidad asignada',
        type: 'select',
        options: [{ value: '', label: 'Toda la pastoral' }, ...COMMUNITIES.map((c) => ({ value: c.value, label: c.value }))],
      },
      { name: 'responsible', label: 'Responsable', type: 'text' },
      { name: 'contact', label: 'Teléfono de informes', type: 'text' },
      { name: 'capacity', label: 'Cupo (0 = sin límite)', type: 'number', min: '0' },
      { name: 'recurrence', label: 'Se repite', type: 'select', options: RECURRENCES.map((r) => ({ value: r.id, label: r.label })) },
      { name: 'recurrence_until', label: 'Repetir hasta', type: 'date', hint: 'Opcional. Sin fecha, se repite de forma indefinida.' },
      { name: 'description', label: 'Descripción', type: 'textarea', full: true },
      { name: 'image_url', label: 'Imagen de la actividad (opcional)', type: 'image', full: true },
    ],
    defaults: { category: 'familiar', status: 'approved', capacity: 0, recurrence: 'none', image_url: '' },
  },

  notices: {
    label: 'Aviso',
    wide: true,
    fields: [
      { name: 'title', label: 'Título del aviso', type: 'text', required: true, full: true },
      { name: 'priority', label: 'Prioridad', type: 'select', options: PRIORITIES.map((p) => ({ value: p.id, label: p.label })) },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
      { name: 'published_at', label: 'Fecha de publicación', type: 'datetime-local' },
      { name: 'expires_at', label: 'Vigente hasta', type: 'datetime-local' },
      { name: 'author', label: 'Firma (quién lo publica)', type: 'text' },
      { name: 'pinned', label: 'Fijar arriba en la lista', type: 'checkbox' },
      { name: 'body', label: 'Contenido', type: 'textarea', rows: 6, full: true },
      { name: 'image_url', label: 'Imagen del aviso (opcional)', type: 'image', full: true },
    ],
    defaults: { priority: 'normal', status: 'approved', pinned: false, image_url: '' },
  },

  birthdays: {
    label: 'Celebración',
    fields: [
      { name: 'name', label: 'Nombre de la persona o familia', type: 'text', required: true, full: true },
      { name: 'kind', label: 'Tipo', type: 'select', options: BIRTHDAY_KINDS.map((k) => ({ value: k.id, label: k.label })) },
      { name: 'date', label: 'Fecha', type: 'date', required: true },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'note', label: 'Nota (área, parentesco…)', type: 'text', full: true },
    ],
    defaults: { kind: 'birthday' },
  },

  resources: {
    label: 'Recurso',
    fields: [
      { name: 'title', label: 'Nombre del recurso', type: 'text', required: true, full: true },
      { name: 'category', label: 'Categoría', type: 'text', placeholder: 'Ej. Formación, Liturgia…' },
      { name: 'kind', label: 'Tipo', type: 'select', options: RESOURCE_KINDS.map((k) => ({ value: k.id, label: k.label })) },
      { name: 'url', label: 'Enlace o archivo', type: 'url', required: true, full: true, placeholder: 'https://…' },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
      { name: 'description', label: 'Descripción', type: 'textarea', full: true },
    ],
    defaults: { kind: 'doc', status: 'approved', category: 'General' },
  },

  contacts: {
    label: 'Contacto',
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'role', label: 'Cargo o rol', type: 'text', placeholder: 'Ej. Coordinadora de formación' },
      { name: 'area', label: 'Área', type: 'text', placeholder: 'Ej. Formación' },
      { name: 'sort', label: 'Orden', type: 'number', min: '0' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'whatsapp', label: 'WhatsApp (con código de país)', type: 'text', placeholder: '50370000000' },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'notes', label: 'Notas', type: 'textarea', full: true },
    ],
    defaults: { sort: 99, area: 'Equipo' },
  },

  prayers: {
    label: 'Intención',
    fields: [
      { name: 'name', label: 'Nombre o seudónimo', type: 'text' },
      { name: 'visibility', label: 'Visibilidad', type: 'select', options: [{ value: 'public', label: 'Pública' }, { value: 'equipo', label: 'Solo equipo' }] },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
      { name: 'prayers', label: 'Amén acumulados', type: 'number', min: '0' },
      { name: 'text', label: 'Intención', type: 'textarea', rows: 5, required: true, full: true },
    ],
    defaults: { visibility: 'public', status: 'pending', prayers: 0 },
  },

  shares: {
    label: 'Mensaje',
    wide: true,
    fields: [
      { name: 'name', label: 'Nombre (opcional)', type: 'text', placeholder: 'Déjalo vacío para publicar como Anónimo' },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
      { name: 'message', label: 'Mensaje', type: 'textarea', rows: 5, required: true, full: true },
      { name: 'video_url', label: 'Enlace de video (opcional)', type: 'url', full: true, placeholder: 'https://youtube.com/watch?v=…', hint: 'YouTube, Vimeo o un enlace externo. No subas el archivo a Supabase.' },
    ],
    defaults: { status: 'approved' },
  },

  albums: {
    label: 'Álbum',
    wide: true,
    fields: [
      { name: 'title', label: 'Título del álbum', type: 'text', required: true },
      { name: 'date', label: 'Fecha', type: 'date', required: true },
      {
        name: 'community',
        label: 'Comunidad',
        type: 'select',
        options: [{ value: '', label: 'Toda la pastoral' }, ...COMMUNITIES.map((c) => ({ value: c.value, label: c.value }))],
      },
      { name: 'tone', label: 'Color de portada', type: 'select', options: TONES },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
      { name: 'description', label: 'Descripción', type: 'textarea', full: true },
    ],
    defaults: { tone: 'sage', status: 'approved', community: '' },
    photos: true,
  },

  holyHours: {
    label: 'Horario del Santísimo',
    fields: [
      { name: 'month', label: 'Mes', type: 'date', required: true, hint: 'Elige el día 1 del mes; se guarda el mes completo.' },
      { name: 'community', label: 'Comunidad', type: 'select', required: true, options: COMMUNITIES.map((c) => ({ value: c.value, label: c.value })) },
      { name: 'start_time', label: 'Hora de inicio', type: 'time', required: true },
      { name: 'end_time', label: 'Hora de fin', type: 'time', required: true },
      { name: 'sort', label: 'Orden', type: 'number', min: '0' },
    ],
    defaults: { sort: 0, community: COMMUNITIES[0].value },
  },

  serviceAssignments: {
    label: 'Servicio asignado',
    fields: [
      { name: 'date', label: 'Fecha de la misa', type: 'date', required: true },
      {
        name: 'kind',
        label: 'Servicio',
        type: 'select',
        options: [
          { value: 'viernes', label: 'Misa de comunidad (viernes)' },
          { value: 'domingo', label: 'Misa parroquial (domingo)' },
        ],
      },
      { name: 'community', label: 'Comunidad asignada', type: 'select', required: true, options: COMMUNITIES.map((c) => ({ value: c.value, label: c.value })) },
      { name: 'notes', label: 'Notas', type: 'text', full: true },
    ],
    defaults: { kind: 'viernes', community: COMMUNITIES[0].value },
  },
};

function valueFor(fieldDef, record) {
  const raw = record ? record[fieldDef.name] : fieldDef.defaultValue ?? undefined;
  if (fieldDef.type === 'datetime-local') return toDateTimeInput(raw);
  if (fieldDef.type === 'date') return toDateInput(raw);
  if (fieldDef.type === 'time') return String(raw || '').slice(0, 5);
  if (fieldDef.type === 'checkbox') return Boolean(raw);
  if (raw === null || raw === undefined) return '';
  return raw;
}

function fieldHTML(fieldDef, record) {
  const value = valueFor(fieldDef, record);
  if (fieldDef.type === 'image') {
    return `<div style="${fieldDef.full ? 'grid-column:1 / -1' : ''}">${imageFieldHTML(fieldDef, value)}</div>`;
  }
  const html =
    fieldDef.type === 'checkbox'
      ? field({ label: fieldDef.label, name: fieldDef.name, type: 'checkbox', value })
      : field({
          label: fieldDef.label,
          name: fieldDef.name,
          type: fieldDef.type,
          value,
          required: fieldDef.required,
          placeholder: fieldDef.placeholder || '',
          hint: fieldDef.hint || '',
          options: fieldDef.options,
          rows: fieldDef.rows || 4,
          min: fieldDef.min || '',
          max: fieldDef.max || '',
        });
  return `<div style="${fieldDef.full ? 'grid-column:1 / -1' : ''}">${html}</div>`;
}

function imageFieldHTML(fieldDef, value) {
  return `<div class="field">
    <label class="label" for="image-${esc(fieldDef.name)}">${esc(fieldDef.label)}</label>
    <div class="image-field">
      <div class="image-preview" data-image-preview>${value ? `<img src="${esc(value)}" alt="">` : icon('image', 26)}</div>
      <div class="image-field-body">
        <input class="input" id="image-${esc(fieldDef.name)}" name="${esc(fieldDef.name)}" type="url"
               value="${esc(value)}" placeholder="https://… o sube una imagen" data-image-url>
        <div class="cluster">
          <label class="btn btn-light btn-sm" style="cursor:pointer;margin:0">
            ${icon('upload', 15)} Subir imagen
            <input type="file" accept="image/*" hidden data-image-file>
          </label>
          <button type="button" class="btn btn-ghost btn-sm" data-image-clear>${icon('trash', 15)} Quitar</button>
        </div>
        <span class="field-hint">Se comprime a 1600 px. También puedes pegar un enlace directo de Drive o de otro sitio. Google Photos no sirve como imagen directa.</span>
      </div>
    </div>
  </div>`;
}

function bindImageFields(el) {
  el.querySelectorAll('[data-image-url]').forEach((input) => {
    const wrap = input.closest('.image-field');
    if (!wrap) return;
    const preview = wrap.querySelector('[data-image-preview]');
    const fileInput = wrap.querySelector('[data-image-file]');
    const clear = wrap.querySelector('[data-image-clear]');
    const update = () => {
      const url = input.value.trim();
      preview.innerHTML = url ? `<img src="${esc(url)}" alt="">` : icon('image', 26);
    };
    input.addEventListener('input', update);
    input.addEventListener('change', update);
    clear?.addEventListener('click', () => {
      input.value = '';
      update();
      input.focus();
    });
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      fileInput.disabled = true;
      try {
        toast('Subiendo imagen…', 'info', 2000);
        const url = await store.uploadImage(file);
        input.value = url;
        update();
        toast('Imagen lista. Guarda para publicar.', 'ok');
      } catch (err) {
        toast(err.message || 'No se pudo subir la imagen.', 'error', 6000);
      } finally {
        fileInput.disabled = false;
        fileInput.value = '';
      }
    });
  });
}

export function openRecordForm(name, record = null, { onSaved, defaults = null } = {}) {
  const spec = FORMS[name];
  if (!spec) return;

  const isEdit = Boolean(record && record.id);
  const initial = record || { ...(spec.defaults || {}), ...(defaults || {}) };
  const photos = name === 'albums' && record ? Array.isArray(record.photos) ? [...record.photos] : [] : [];
  const fields = spec.fields.filter((f) => f.type !== 'image' || store.imagesReady);

  const { el } = openModal({
    title: `${isEdit ? 'Editar' : 'Nuevo'} · ${spec.label}`,
    subtitle: isEdit ? 'Los cambios se publican al guardar.' : 'Completa los datos y guarda.',
    wide: spec.wide,
    body: `
      <form id="record-form" class="form-grid two" novalidate>
        ${fields.map((f) => fieldHTML(f, initial)).join('')}
        ${spec.photos ? photosEditorHTML(photos) : ''}
      </form>`,
    footer: `
      <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
      <button type="button" class="btn btn-primary" data-save>${icon('check', 16)} Guardar</button>`,
  });

  const form = el.querySelector('#record-form');
  const saveBtn = el.querySelector('[data-save]');

  if (spec.photos) bindPhotos(el, photos);
  bindImageFields(el);

  const save = async () => {
    const data = readForm(form);

    for (const f of fields) {
      if (f.required && (!data[f.name] || String(data[f.name]).trim() === '')) {
        showFormError(form, `El campo “${f.label}” es obligatorio.`);
        return;
      }
      if (f.type === 'image' && data[f.name]) {
        const problem = imageUrlProblem(data[f.name]);
        if (problem) {
          showFormError(form, problem);
          return;
        }
        data[f.name] = normalizeImageUrl(data[f.name]);
      }
    }
    if (name === 'activities' && data.starts_at && data.ends_at && data.ends_at < data.starts_at) {
      showFormError(form, 'La actividad no puede terminar antes de comenzar.');
      return;
    }

    const payload = {};
    for (const f of fields) {
      let value = data[f.name];
      if (f.type === 'checkbox') value = Boolean(value);
      else if (f.type === 'number') value = value === '' ? 0 : Number(value);
      else if (f.type === 'datetime-local' || f.type === 'date') value = value || null;
      if (name === 'holyHours' && f.name === 'month' && value) value = `${String(value).slice(0, 7)}-01`;
      payload[f.name] = value;
    }

    if (name === 'resources') payload.updated_at = new Date().toISOString();
    if (name === 'notices' && !payload.published_at) payload.published_at = new Date().toISOString();
    if (name === 'albums') {
      const rows = [...el.querySelectorAll('[data-photo-row]')];
      for (const row of rows) {
        const url = row.querySelector('[data-url]').value.trim();
        const problem = imageUrlProblem(url);
        if (problem) {
          showFormError(form, problem);
          return;
        }
      }
      payload.photos = rows
        .map((row) => ({
          id: row.dataset.photoId || uid('ph'),
          caption: row.querySelector('[data-caption]').value.trim(),
          url: normalizeImageUrl(row.querySelector('[data-url]').value.trim()),
        }))
        .filter((p) => p.caption || p.url);
    }

    setBusy(saveBtn, true);
    try {
      if (isEdit) {
        await store.update(name, record.id, payload);
        toast(`${spec.label} actualizado.`, 'ok');
      } else {
        await store.create(name, payload);
        toast(`${spec.label} creado.`, 'ok');
      }
      closeModal({ silent: true });
      onSaved?.();
    } catch (err) {
      setBusy(saveBtn, false);
      showFormError(form, err.message || 'No se pudo guardar.');
    }
  };

  saveBtn.addEventListener('click', save);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    save();
  });
}

function photosEditorHTML(photos) {
  return `<div style="grid-column:1 / -1" class="form-section">
    <div class="between" style="margin-bottom:.7rem">
      <p class="form-section-title" style="margin:0">Fotos del álbum</p>
      <div class="cluster">
        <label class="btn btn-light btn-sm" style="cursor:pointer;margin:0">
          ${icon('upload', 15)} Subir imágenes
          <input type="file" id="photo-upload" accept="image/*" multiple hidden>
        </label>
        <label class="btn btn-light btn-sm" style="cursor:pointer;margin:0">
          ${icon('camera', 15)} Tomar foto
          <input type="file" id="photo-camera" accept="image/*" capture="environment" hidden>
        </label>
        <button type="button" class="btn btn-ghost btn-sm" data-add-photo>${icon('plus', 15)} Agregar por enlace</button>
      </div>
    </div>
    <div id="photos-editor" class="stack" style="gap:.55rem">
      ${photos.map((p) => photoRowHTML(p)).join('')}
    </div>
    <p class="field-hint mt-1">Puedes pegar un enlace de imagen o subir archivos. Las fotos se muestran en la galería pública.</p>
  </div>`;
}

function photoRowHTML(p = {}) {
  const id = p.id || uid('ph');
  return `<div class="photo-row" data-photo-row data-photo-id="${esc(id)}">
    <div class="photo-thumb" data-thumb>${p.url ? `<img src="${esc(p.url)}" alt="">` : icon('image', 18)}</div>
    <div class="photo-fields">
      <input class="input" data-caption placeholder="Descripción de la foto" value="${esc(p.caption || '')}">
      <input class="input" data-url placeholder="https://… (opcional si subes el archivo)" value="${esc(p.url || '')}">
    </div>
    <button type="button" class="btn-icon" data-remove-photo aria-label="Quitar foto">${icon('trash', 16)}</button>
  </div>`;
}

function bindPhotos(el, initial) {
  const editor = el.querySelector('#photos-editor');
  if (!editor) return;
  if (!initial.length) editor.insertAdjacentHTML('beforeend', photoRowHTML());

  const wireRow = (row) => {
    row.querySelector('[data-remove-photo]').addEventListener('click', () => {
      if (el.querySelectorAll('[data-photo-row]').length === 1) {
        row.querySelector('[data-caption]').value = '';
        row.querySelector('[data-url]').value = '';
        row.querySelector('[data-thumb]').innerHTML = icon('image', 18);
        return;
      }
      row.remove();
    });
    const urlInput = row.querySelector('[data-url]');
    urlInput.addEventListener('change', () => {
      const url = urlInput.value.trim();
      row.querySelector('[data-thumb]').innerHTML = url ? `<img src="${esc(url)}" alt="">` : icon('image', 18);
    });
  };

  editor.querySelectorAll('[data-photo-row]').forEach(wireRow);

  el.querySelector('[data-add-photo]').addEventListener('click', () => {
    editor.insertAdjacentHTML('beforeend', photoRowHTML());
    wireRow(editor.lastElementChild);
    editor.lastElementChild.querySelector('[data-caption]').focus();
  });

  const upload = el.querySelector('#photo-upload');
  const camera = el.querySelector('#photo-camera');

  const addFiles = async (files, sourceInput) => {
    if (!files.length) return;
    sourceInput.disabled = true;
    try {
      for (const file of files) {
        toast(`Subiendo ${file.name}…`, 'info', 2000);
        const url = await store.uploadImage(file);
        const row = editor.querySelector('[data-photo-row]:last-child');
        if (row && !row.querySelector('[data-url]').value && !row.querySelector('[data-caption]').value) {
          row.querySelector('[data-url]').value = url;
          row.querySelector('[data-thumb]').innerHTML = `<img src="${esc(url)}" alt="">`;
        } else {
          editor.insertAdjacentHTML('beforeend', photoRowHTML({ url }));
          wireRow(editor.lastElementChild);
        }
      }
      toast('Imágenes listas. No olvides guardar el álbum.', 'ok');
    } catch (err) {
      toast(err.message || 'No se pudieron subir las imágenes.', 'error', 6000);
    } finally {
      sourceInput.disabled = false;
      sourceInput.value = '';
    }
  };

  upload?.addEventListener('change', () => addFiles(Array.from(upload.files || []), upload));
  camera?.addEventListener('change', () => addFiles(Array.from(camera.files || []), camera));
}
