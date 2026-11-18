/* =========================================================
   Directorio de contactos
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { pageHead, emptyState, site } from '../ui.js';
import { personCard } from '../cards.js';
import { esc, pluralize, whatsappUrl } from '../utils.js';

const AREA_INFO = {
  'Equipo general': 'Coordina los ejes que sostienen la pastoral.',
  Comunidades: 'Cada comunidad tiene su coordinador y su hora de servicio.',
};

export default function contactsView(root) {
  const list = store.publicList('contacts');
  const s = site();
  const areas = [];
  for (const person of list) {
    const key = person.area || 'Equipo';
    let area = areas.find((a) => a.name === key);
    if (!area) {
      area = { name: key, items: [] };
      areas.push(area);
    }
    area.items.push(person);
  }

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Directorio',
      title: 'Equipo y comunidades',
      subtitle:
        'La Pastoral Familiar se organiza en cinco ejes y cinco comunidades. Aquí encontrarás a quién dirigirte en cada área.',
      actions: `${s.whatsapp ? `<a class="btn btn-primary" href="${whatsappUrl(s.whatsapp, 'Hola, escribo desde la web de la Pastoral Familiar.')}" target="_blank" rel="noopener">${icon('whatsapp', 16)} Escribir al equipo</a>` : `<a class="btn btn-ghost" href="#/proponer">${icon('plus', 16)} Proponer actividad</a>`}`,
    })}

    <section class="section-tight">
      <div class="wrap">
        ${
          list.length
            ? `<div class="stack" style="gap:2.2rem">
                ${areas
                  .map(
                    (area) => `<section>
                      <div class="between" style="margin-bottom:.9rem">
                        <div>
                          <h2 class="section-title" style="font-size:1.35rem">${esc(area.name)}</h2>
                          ${AREA_INFO[area.name] ? `<p class="section-sub" style="margin-top:.25rem">${esc(AREA_INFO[area.name])}</p>` : ''}
                        </div>
                        <span class="text-sm text-muted">${esc(pluralize(area.items.length, 'puesto', 'puestos'))}</span>
                      </div>
                      <div class="grid grid-3">${area.items.map(personCard).join('')}</div>
                    </section>`
                  )
                  .join('')}
              </div>`
            : emptyState({
                icon: 'users',
                title: 'Aún no hay contactos publicados',
                text: 'El equipo puede agregarlos desde el panel de administración.',
              })
        }

        <div class="contact-strip mt-4">
          <div>
            <h3>¿Quieres sumarte a un servicio?</h3>
            <p>Hay lugar para ti en los ejes de matrimonios, jóvenes, encuentro y convivencia, tema fijo, o en tu comunidad. Escríbenos y te contamos cómo participar.</p>
          </div>
          <div class="cluster">
            ${s.email ? `<a class="btn btn-light" href="mailto:${esc(s.email)}">${icon('mail', 16)} ${esc(s.email)}</a>` : ''}
            ${s.whatsapp ? `<a class="btn btn-primary" href="${whatsappUrl(s.whatsapp, 'Hola, quiero sumarme a un servicio de la Pastoral Familiar.')}" target="_blank" rel="noopener">${icon('whatsapp', 16)} Escribir al equipo</a>` : `<a class="btn btn-primary" href="#/proponer">${icon('plus', 16)} Proponer actividad</a>`}
          </div>
        </div>
      </div>
    </section>`;
}
