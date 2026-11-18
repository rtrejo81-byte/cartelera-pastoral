/* =========================================================
   Avisos y comunicados
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { pageHead, emptyState } from '../ui.js';
import { noticeCard } from '../cards.js';
import { esc, pluralize } from '../utils.js';

export default function noticesView(root) {
  const notices = store.publicList('notices');
  const pinnedCount = notices.filter((n) => n.pinned).length;

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Comunicados',
      title: 'Avisos de la pastoral',
      subtitle: 'Lo que necesitas saber: inscripciones, cambios de lugar, fechas importantes y agradecimientos de nuestra comunidad.',
      actions: `<a class="btn btn-ghost" href="#/calendario">${icon('calendar', 16)} Ver calendario</a>
                <a class="btn btn-primary" href="#/proponer">${icon('plus', 16)} Proponer actividad</a>`,
    })}

    <section class="section-tight">
      <div class="wrap">
        ${
          notices.length
            ? `<div class="notice-toolbar">
                <div class="search-box">
                  ${icon('search', 17)}
                  <input class="input" type="search" id="notice-search" placeholder="Buscar en los avisos…" aria-label="Buscar avisos">
                </div>
                <div class="filters" style="margin:0" role="group" aria-label="Filtrar avisos">
                  <button type="button" class="filter-chip" data-filter="all" aria-pressed="true">Todos <span class="count">${notices.length}</span></button>
                  <button type="button" class="filter-chip" data-filter="importante" aria-pressed="false">Importantes</button>
                  <button type="button" class="filter-chip" data-filter="urgente" aria-pressed="false">Urgentes</button>
                </div>
                <p class="text-sm text-muted" style="margin:0">${esc(pluralize(notices.length, 'aviso publicado', 'avisos publicados'))}${pinnedCount ? ` · ${pinnedCount} fijado${pinnedCount > 1 ? 's' : ''}` : ''}</p>
              </div>
              <div class="grid grid-2" id="notice-list" style="margin-top:1.2rem">
                ${notices.map((n) => noticeCard(n)).join('')}
              </div>
              <div id="notice-empty" hidden>${emptyState({ icon: 'search', title: 'Ningún aviso coincide', text: 'Prueba con otra palabra o cambia el filtro.' })}</div>`
            : emptyState({
                icon: 'megaphone',
                title: 'Todavía no hay avisos',
                text: 'Cuando el equipo publique un comunicado, aparecerá en esta sección.',
              })
        }
      </div>
    </section>`;

  if (!notices.length) return;

  const cards = Array.from(root.querySelectorAll('#notice-list .notice-card'));
  const search = root.querySelector('#notice-search');
  let filter = 'all';

  const apply = () => {
    const term = (search.value || '').trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const priority = card.dataset.priority;
      const matchFilter = filter === 'all' || priority === filter || (filter === 'importante' && (priority === 'importante' || priority === 'urgente'));
      const matchTerm = !term || card.textContent.toLowerCase().includes(term);
      const show = matchFilter && matchTerm;
      card.hidden = !show;
      if (show) visible++;
    });
    root.querySelector('#notice-empty').hidden = visible > 0;
  };

  search.addEventListener('input', apply);
  root.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      root.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      apply();
    });
  });
}
