/* =========================================================
   Recursos y documentos
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { RESOURCE_KINDS } from '../config.js';
import { pageHead, emptyState } from '../ui.js';
import { resourceCard } from '../cards.js';
import { esc, pluralize } from '../utils.js';

export default function resourcesView(root) {
  const list = store.publicList('resources');
  const groups = [];
  for (const item of list) {
    const key = item.category || 'General';
    let group = groups.find((g) => g.name === key);
    if (!group) {
      group = { name: key, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Materiales',
      title: 'Recursos para la familia',
      subtitle: 'Guías, fichas de inscripción, documentos y enlaces que acompañan el camino de nuestra pastoral.',
      actions: `<a class="btn btn-ghost" href="#/contactos">${icon('mail', 16)} Pedir un recurso</a>`,
    })}

    <section class="section-tight">
      <div class="wrap">
        ${
          list.length
            ? `<div class="notice-toolbar">
                <div class="search-box">
                  ${icon('search', 17)}
                  <input class="input" type="search" id="resource-search" placeholder="Buscar un recurso…" aria-label="Buscar recursos">
                </div>
                <div class="filters" style="margin:0" role="group" aria-label="Filtrar por tipo">
                  <button type="button" class="filter-chip" data-kind="all" aria-pressed="true">Todos <span class="count">${list.length}</span></button>
                  ${RESOURCE_KINDS.map((k) => {
                    const n = list.filter((r) => r.kind === k.id).length;
                    return n ? `<button type="button" class="filter-chip" data-kind="${k.id}" aria-pressed="false">${esc(k.label)} <span class="count">${n}</span></button>` : '';
                  }).join('')}
                </div>
              </div>

              <div class="stack mt-3" style="gap:2.4rem">
                ${groups
                  .map(
                    (g) => `<section data-cat-section="${esc(g.name)}">
                      <div class="between" style="margin-bottom:.9rem">
                        <h2 class="section-title" style="font-size:1.35rem">${esc(g.name)}</h2>
                        <span class="text-sm text-muted">${esc(pluralize(g.items.length, 'recurso', 'recursos'))}</span>
                      </div>
                      <div class="grid grid-3">
                        ${g.items
                          .map(
                            (r) => `<div data-kind-item="${esc(r.kind || 'doc')}">${resourceCard(r)}</div>`
                          )
                          .join('')}
                      </div>
                    </section>`
                  )
                  .join('')}
              </div>
              <div id="resource-empty" hidden class="mt-3">${emptyState({ icon: 'search', title: 'No encontramos ese recurso', text: 'Prueba con otra palabra o revisa todos los tipos.' })}</div>

              <div class="inline-note mt-4">
                ${icon('info', 16)}
                <span>¿Necesitas un material que no está aquí? Escríbele a un coordinador y lo agregamos para toda la comunidad.</span>
              </div>`
            : emptyState({
                icon: 'book',
                title: 'La biblioteca está vacía',
                text: 'Los coordinadores pueden agregar documentos, enlaces y formularios desde el panel.',
              })
        }
      </div>
    </section>`;

  if (!list.length) return;

  const search = root.querySelector('#resource-search');
  let kind = 'all';

  const apply = () => {
    const term = (search.value || '').trim().toLowerCase();
    let visible = 0;
    root.querySelectorAll('[data-kind-item]').forEach((item) => {
      const matchKind = kind === 'all' || item.dataset.kindItem === kind;
      const matchTerm = !term || item.textContent.toLowerCase().includes(term);
      const show = matchKind && matchTerm;
      item.hidden = !show;
      if (show) visible++;
    });
    root.querySelectorAll('[data-cat-section]').forEach((section) => {
      section.hidden = !Array.from(section.querySelectorAll('[data-kind-item]')).some((i) => !i.hidden);
    });
    root.querySelector('#resource-empty').hidden = visible > 0;
  };

  search.addEventListener('input', apply);
  root.querySelectorAll('[data-kind]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kind = btn.dataset.kind;
      root.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      apply();
    });
  });
}
