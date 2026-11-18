/* =========================================================
   Intenciones de oración
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { pageHead, emptyState, field, readForm, showFormError, setBusy, toast } from '../ui.js';
import { esc, fmtDateShort, pluralize, uid } from '../utils.js';

const PRAYED_KEY = 'pf_intenciones_oradas';
const HP_FIELD = 'website';

function prayedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(PRAYED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function savePrayed(set) {
  try {
    localStorage.setItem(PRAYED_KEY, JSON.stringify([...set]));
  } catch {
    /* sin almacenamiento */
  }
}

export default function prayerView(root, ctx) {
  const sent = ctx?.params?.get('enviada') === '1';
  const prayers = store.publicList('prayers');
  const prayed = prayedSet();

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Oración',
      title: 'Oramos unos por otros',
      subtitle: 'Comparte tu intención con la comunidad o solo con el equipo de la pastoral. Cada petición es leída y acompañada con respeto.',
      actions: `<a class="btn btn-ghost" href="#/contactos">${icon('phone', 16)} Hablar con alguien</a>`,
    })}

    <section class="section-tight">
      <div class="wrap">
        <div class="form-layout">
          <div>
            ${
              sent
                ? `<div class="form-panel" style="text-align:center">
                    <span class="empty-icon" style="margin-inline:auto;background:var(--ok-soft);color:var(--ok)">${icon('check-circle', 26)}</span>
                    <h2 class="section-title" style="font-size:1.6rem;margin-top:.8rem">Recibimos tu intención</h2>
                    <p class="section-sub" style="margin-inline:auto">Gracias por confiarnos lo que llevas en el corazón. El equipo de la pastoral la revisará y la compartirá con la comunidad si así lo elegiste.</p>
                    <div class="cluster" style="justify-content:center;margin-top:1.4rem">
                      <a class="btn btn-ghost" href="#/oracion">${icon('plus', 15)} Enviar otra</a>
                      <a class="btn btn-primary" href="#/">${icon('home', 15)} Volver al inicio</a>
                    </div>
                  </div>`
                : formHTML()
            }

            <div class="section-head mt-4" style="margin-bottom:1rem">
              <div>
                <p class="eyebrow">Comunidad</p>
                <h2 class="section-title" style="font-size:clamp(1.4rem,2.8vw,1.9rem)">Intenciones compartidas</h2>
              </div>
              <span class="text-sm text-muted">${esc(pluralize(prayers.length, 'intención', 'intenciones'))}</span>
            </div>

            ${
              prayers.length
                ? `<div class="stack" style="gap:.9rem">${prayers
                    .map((p) => {
                      const done = prayed.has(p.id);
                      return `<article class="prayer-card">
                        <p class="prayer-text">${esc(p.text)}</p>
                        <div class="prayer-foot">
                          <span>${icon('user', 12)} ${esc(p.name || 'Anónimo')} · ${esc(fmtDateShort(p.created_at))}</span>
                          <button type="button" class="prayer-amen ${done ? 'is-done' : ''}" data-amen="${esc(p.id)}" ${done ? 'disabled' : ''}>
                            ${icon('heart', 13)} <span data-count="${esc(p.id)}">${p.prayers || 0}</span> ${done ? 'Amén' : 'Amén'}
                          </button>
                        </div>
                      </article>`;
                    })
                    .join('')}</div>`
                : emptyState({
                    icon: 'heart',
                    title: 'Aún no hay intenciones compartidas',
                    text: 'Sé el primero en dejar una intención o en acompañar a alguien con tu oración.',
                  })
            }
          </div>

          <aside class="info-panel" style="position:sticky;top:calc(var(--header-h) + 1rem)">
            <h3>${icon('lock', 16)} Un espacio cuidado</h3>
            <p class="text-sm text-muted">Puedes elegir que tu intención sea visible para toda la comunidad o solo para el equipo de la pastoral.</p>
            <div class="info-list">
              <div class="info-item"><span class="ico">${icon('heart', 16)}</span><div><b>Con respeto</b><br>Nadie es obligado a compartir detalles personales.</div></div>
              <div class="info-item"><span class="ico">${icon('users', 16)}</span><div><b>En comunidad</b><br>Rezamos por cada intención en nuestras reuniones.</div></div>
              <div class="info-item"><span class="ico">${icon('lock', 16)}</span><div><b>Revisión previa</b><br>El equipo revisa los envíos antes de publicarlos, para cuidar a todos.</div></div>
            </div>
            <p class="field-hint mt-3">Si es una situación urgente, llama directamente a un coordinador desde la sección de contactos.</p>
          </aside>
        </div>
      </div>
    </section>`;

  if (!sent) bindForm(root);

  root.querySelectorAll('[data-amen]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.amen;
      const set = prayedSet();
      if (set.has(id)) return;
      set.add(id);
      savePrayed(set);
      btn.classList.add('is-done');
      btn.disabled = true;
      const countEl = root.querySelector(`[data-count="${id}"]`);
      if (countEl) countEl.textContent = String(Number(countEl.textContent || 0) + 1);
      try {
        await store.incrementPrayer(id);
        toast('Gracias por acompañar con tu oración.', 'ok');
      } catch {
        /* el contador local ya se actualizó */
      }
    });
  });
}

function formHTML() {
  return `<div class="form-panel">
    <h2 class="section-title" style="font-size:1.5rem">Deja tu intención</h2>
    <p class="section-sub" style="margin-bottom:1.2rem">Escríbela con tus palabras. Puedes firmarla o dejarla en el anonimato.</p>
    <form id="prayer-form" class="form-grid" novalidate>
      <input type="text" name="${HP_FIELD}" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      ${field({ label: 'Tu nombre', name: 'name', placeholder: 'Opcional · puede quedar en anónimo', autocomplete: 'name' })}
      ${field({ label: 'Tu intención', name: 'text', type: 'textarea', rows: 5, required: true, placeholder: 'Señor, te pedimos por…', hint: 'Máximo 600 caracteres. Evita datos sensibles de otras personas.' })}
      ${field({
        label: '¿Quién puede verla?',
        name: 'visibility',
        type: 'select',
        value: 'public',
        options: [
          { value: 'public', label: 'Compartirla con toda la comunidad' },
          { value: 'equipo', label: 'Solo para el equipo de la pastoral' },
        ],
      })}
      <p class="field-hint">Antes de publicarse, el equipo revisa el mensaje para cuidar la privacidad de todos.</p>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${icon('send', 16)} Enviar intención</button>
      </div>
    </form>
  </div>`;
}

function bindForm(root) {
  const form = root.querySelector('#prayer-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = readForm(form);
    if (data[HP_FIELD]) {
      location.hash = '#/oracion?enviada=1';
      return;
    }
    if (!data.text || data.text.trim().length < 10) {
      showFormError(form, 'Cuéntanos un poco más: tu intención debe tener al menos 10 caracteres.');
      return;
    }
    if (data.text.length > 600) {
      showFormError(form, 'La intención es muy larga. Resúmela a 600 caracteres.');
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    setBusy(button, true, 'Enviando…');
    try {
      await store.create('prayers', {
        id: uid('pray'),
        name: (data.name || '').trim() || 'Anónimo',
        text: data.text.trim(),
        visibility: data.visibility === 'equipo' ? 'equipo' : 'public',
        status: 'pending',
        prayers: 0,
        created_at: new Date().toISOString(),
      });
      location.hash = '#/oracion?enviada=1';
    } catch (err) {
      setBusy(button, false);
      showFormError(form, err.message || 'No se pudo enviar tu intención. Inténtalo de nuevo.');
    }
  });
}
