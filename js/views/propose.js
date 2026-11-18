/* =========================================================
   Propuesta pública de actividades
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { CATEGORIES } from '../config.js';
import { pageHead, field, readForm, showFormError, setBusy, site } from '../ui.js';
import { esc, uid, ymd } from '../utils.js';

const HP_FIELD = 'website';

export default function proposeView(root, ctx) {
  const sent = ctx?.params?.get('enviada') === '1';
  const s = site();
  const todayStr = ymd(new Date());

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Participa',
      title: 'Propón una actividad',
      subtitle: 'Las ideas de la comunidad son las que hacen crecer a la pastoral. Cuéntanos qué te gustaría organizar y el equipo lo revisará.',
      actions: `<a class="btn btn-ghost" href="#/calendario">${icon('calendar', 16)} Ver calendario</a>`,
    })}

    <section class="section-tight">
      <div class="wrap">
        <div class="form-layout">
          ${
            sent
              ? `<div class="form-panel" style="text-align:center">
                  <span class="empty-icon" style="margin-inline:auto;background:var(--ok-soft);color:var(--ok);width:64px;height:64px">${icon('check-circle', 30)}</span>
                  <h2 class="section-title" style="font-size:1.7rem;margin-top:1rem">¡Gracias por proponer!</h2>
                  <p class="section-sub" style="margin-inline:auto">Tu actividad quedó registrada como <b>pendiente de revisión</b>. Un coordinador la revisará y, al aprobarla, aparecerá automáticamente en el calendario de todos.</p>
                  <div class="inline-note mt-3" style="text-align:left">
                    ${icon('info', 16)}
                    <span>Si necesitas que se publique pronto, escribe a <b>${esc(s.email)}</b> o llama a un coordinador desde la sección de contactos.</span>
                  </div>
                  <div class="cluster" style="justify-content:center;margin-top:1.4rem">
                    <a class="btn btn-ghost" href="#/proponer">${icon('plus', 15)} Proponer otra</a>
                    <a class="btn btn-primary" href="#/calendario">${icon('calendar', 15)} Ir al calendario</a>
                  </div>
                </div>`
              : formHTML(todayStr)
          }

          <aside class="info-panel">
            <p class="eyebrow">Cómo funciona</p>
            <h3>De tu idea al calendario</h3>
            <p class="text-sm text-muted">Tres pasos sencillos para que tu actividad llegue a toda la comunidad.</p>
            <div class="info-list">
              <div class="info-item"><span class="ico">1</span><div><b>Envías tu propuesta</b><br>Con fecha, hora, lugar y una breve descripción.</div></div>
              <div class="info-item"><span class="ico">2</span><div><b>El equipo la revisa</b><br>Confirma que no choque con otra actividad y te contacta si hace falta algo.</div></div>
              <div class="info-item"><span class="ico">3</span><div><b>Aparece en el calendario</b><br>Se publica y todos pueden verla, agregarla a su teléfono y compartirla.</div></div>
            </div>
            <hr>
            <p class="field-hint" style="margin:0">¿Prefieres proponerla en persona? Escríbele a ${esc(s.email)} o visítanos. ${esc(s.meetingSchedule)}</p>
            <a class="btn btn-light btn-sm mt-2" href="#/contactos">${icon('phone', 15)} Ver contactos</a>
          </aside>
        </div>
      </div>
    </section>`;

  if (!sent) bindForm(root);
}

function formHTML(todayStr) {
  return `<div class="form-panel">
    <form id="propose-form" class="form-grid" novalidate>
      <input type="text" name="${HP_FIELD}" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">

      <div class="form-section">
        <p class="form-section-title">Quién propone</p>
        <div class="field-row">
          ${field({ label: 'Tu nombre', name: 'submitted_by', required: true, placeholder: 'Nombre y apellido', autocomplete: 'name' })}
          ${field({ label: 'Teléfono o correo', name: 'contact', placeholder: 'Para contactarte si hace falta', autocomplete: 'tel' })}
        </div>
      </div>

      <div class="form-section">
        <p class="form-section-title">La actividad</p>
        ${field({ label: 'Nombre de la actividad', name: 'title', required: true, placeholder: 'Ej. Taller de comunicación en familia' })}
        <div class="field-row mt-2">
          ${field({
            label: 'Tipo de actividad',
            name: 'category',
            type: 'select',
            value: 'familiar',
            options: CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
          })}
          ${field({ label: 'Responsable', name: 'responsible', placeholder: 'Persona o comisión que la organiza' })}
        </div>
      </div>

      <div class="form-section">
        <p class="form-section-title">Cuándo y dónde</p>
        <div class="field-row">
          ${field({ label: 'Fecha', name: 'date', type: 'date', required: true, min: todayStr })}
          <div></div>
        </div>
        <div class="field-row mt-2">
          ${field({ label: 'Hora de inicio', name: 'start', type: 'time', required: true })}
          ${field({ label: 'Hora de fin', name: 'end', type: 'time', hint: 'Opcional' })}
        </div>
        <div class="field-row mt-2">
          ${field({ label: 'Lugar', name: 'location', placeholder: 'Ej. Salón parroquial', hint: 'Si aún no está confirmado, déjalo vacío.' })}
          ${field({ label: 'Cupo', name: 'capacity', type: 'number', min: '0', placeholder: '0', hint: 'Personas. 0 = sin límite.' })}
        </div>
      </div>

      <div class="form-section">
        <p class="form-section-title">Detalles</p>
        ${field({
          label: 'Descripción',
          name: 'description',
          type: 'textarea',
          rows: 4,
          placeholder: '¿De qué se trata? ¿Qué deben llevar? ¿A quién está dirigida?',
          hint: 'Máximo 800 caracteres.',
        })}
        <label class="check mt-2">
          <input type="checkbox" name="confirm" required>
          <span>Confirmo que la información es correcta y que soy parte de la Pastoral Familiar o cuento con el respaldo de un coordinador.</span>
        </label>
      </div>

      <div class="form-actions">
        <a class="btn btn-ghost" href="#/calendario">Cancelar</a>
        <button type="submit" class="btn btn-primary btn-lg">${icon('send', 16)} Enviar propuesta</button>
      </div>
    </form>
  </div>`;
}

function bindForm(root) {
  const form = root.querySelector('#propose-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = readForm(form);

    if (data[HP_FIELD]) {
      location.hash = '#/proponer?enviada=1';
      return;
    }

    if (!data.submitted_by || data.submitted_by.length < 3) {
      showFormError(form, 'Escribe tu nombre para que el equipo sepa quién propone.');
      return;
    }
    if (!data.title || data.title.length < 5) {
      showFormError(form, 'El nombre de la actividad debe tener al menos 5 caracteres.');
      return;
    }
    if (!data.date || !data.start) {
      showFormError(form, 'Indica la fecha y la hora de inicio de la actividad.');
      return;
    }
    if (data.end && data.end <= data.start) {
      showFormError(form, 'La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
    if (!data.confirm) {
      showFormError(form, 'Marca la casilla de confirmación para continuar.');
      return;
    }

    const payload = {
      id: uid('act'),
      title: data.title.trim(),
      description: (data.description || '').trim().slice(0, 800),
      category: data.category || 'familiar',
      starts_at: `${data.date}T${data.start}`,
      ends_at: data.end ? `${data.date}T${data.end}` : null,
      location: (data.location || '').trim(),
      responsible: (data.responsible || data.submitted_by).trim(),
      contact: (data.contact || '').trim(),
      capacity: Number(data.capacity) || 0,
      status: 'pending',
      submitted_by: data.submitted_by.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const button = form.querySelector('button[type="submit"]');
    setBusy(button, true, 'Enviando…');
    try {
      await store.create('activities', payload);
      location.hash = '#/proponer?enviada=1';
    } catch (err) {
      setBusy(button, false);
      showFormError(form, err.message || 'No se pudo enviar tu propuesta. Inténtalo de nuevo.');
    }
  });
}
