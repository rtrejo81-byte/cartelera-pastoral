/* =========================================================
   Cumpleaños y aniversarios
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { MONTHS, BIRTHDAY_KINDS } from '../config.js';
import { pageHead, emptyState } from '../ui.js';
import { birthdayCard } from '../cards.js';
import { esc, parseLocal, pluralize } from '../utils.js';

export default function birthdaysView(root) {
  const all = store.publicList('birthdays');
  const currentMonth = new Date().getMonth();
  const thisMonth = all.filter((b) => parseLocal(b.date)?.getMonth() === currentMonth);

  const order = Array.from({ length: 12 }, (_, i) => (currentMonth + i) % 12);
  const groups = order
    .map((month) => ({ month, items: all.filter((b) => parseLocal(b.date)?.getMonth() === month) }))
    .filter((g) => g.items.length);

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Celebramos juntos',
      title: 'Cumpleaños y aniversarios',
      subtitle: 'La vida de nuestra pastoral está hecha de personas y familias. Aquí celebramos sus fechas importantes.',
      actions: `<a class="btn btn-ghost" href="#/contactos">${icon('phone', 16)} Contactos</a>`,
    })}

    <section class="section-tight">
      <div class="wrap">
        ${
          all.length
            ? `
            <div class="birthday-summary">
              <div class="card card-pad-lg" style="background:linear-gradient(165deg,#FFFCF5,#FBF2E2);border-color:rgba(201,145,63,.35)">
                <p class="eyebrow" style="color:var(--gold-deep)">${icon('cake', 14)} ${esc(MONTHS[currentMonth])}</p>
                <h2 class="section-title" style="font-size:clamp(1.4rem,3vw,2rem)">Este mes celebramos</h2>
                <p class="section-sub">${thisMonth.length ? esc(pluralize(thisMonth.length, 'fecha especial', 'fechas especiales')) + ' en nuestra comunidad.' : 'No hay fechas registradas para este mes.'}</p>
                ${thisMonth.length ? `<div class="grid grid-2 mt-3">${thisMonth.map(birthdayCard).join('')}</div>` : ''}
              </div>
              <div class="card card-pad-lg">
                <p class="eyebrow eyebrow-plain">${icon('heart', 14)} Un detalle</p>
                <h3 class="card-title">Un mensaje a tiempo alegra el día</h3>
                <p class="card-text">Si conoces a alguien de la lista, escríbele. Un saludo de parte de la pastoral hace comunidad.</p>
                <a class="btn btn-light btn-sm mt-2" href="#/contactos">Ver coordinadores ${icon('arrow-right', 14)}</a>
              </div>
            </div>

            <div class="filters mt-4" role="group" aria-label="Filtrar celebraciones">
              <button type="button" class="filter-chip" data-kind="all" aria-pressed="true">Todas las fechas <span class="count">${all.length}</span></button>
              ${BIRTHDAY_KINDS.map((k) => `<button type="button" class="filter-chip" data-kind="${k.id}" aria-pressed="false">${esc(k.label)} <span class="count">${all.filter((b) => b.kind === k.id).length}</span></button>`).join('')}
            </div>

            <div class="stack" style="gap:2rem" id="bday-groups">
              ${groups
                .map(
                  (g) => `<section data-month="${g.month}">
                    <div class="between" style="margin-bottom:.8rem">
                      <h2 class="section-title" style="font-size:1.35rem;text-transform:capitalize">${esc(MONTHS[g.month])}</h2>
                      <span class="text-sm text-muted">${esc(pluralize(g.items.length, 'celebración', 'celebraciones'))}</span>
                    </div>
                    <div class="grid grid-2">${g.items.map((b) => `<div data-kind-item="${esc(b.kind || 'birthday')}">${birthdayCard(b)}</div>`).join('')}</div>
                  </section>`
                )
                .join('')}
            </div>`
            : emptyState({
                icon: 'cake',
                title: 'Aún no hay fechas registradas',
                text: 'Los coordinadores pueden agregar cumpleaños y aniversarios desde el panel de administración.',
              })
        }
      </div>
    </section>`;

  if (!all.length) return;

  let kind = 'all';
  root.querySelectorAll('[data-kind]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kind = btn.dataset.kind;
      root.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      root.querySelectorAll('[data-kind-item]').forEach((item) => {
        item.hidden = kind !== 'all' && item.dataset.kindItem !== kind;
      });
      root.querySelectorAll('[data-month]').forEach((section) => {
        const visible = Array.from(section.querySelectorAll('[data-kind-item]')).some((i) => !i.hidden);
        section.hidden = !visible;
      });
    });
  });
}
