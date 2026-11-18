/* =========================================================
   Adoración al Santísimo · horario mensual por comunidad
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { pageHead, emptyState } from '../ui.js';
import {
  esc, fmtClock, fmtMonthYear, pluralize,
} from '../utils.js';

function monthFromParam(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  return { year: Number(match[1]), month: Number(match[2]) - 1 };
}

const pad = (n) => String(n).padStart(2, '0');

export default function santisimoView(root, ctx) {
  const { year, month } = monthFromParam(ctx?.params?.get('mes'));
  const cursor = new Date(year, month, 1);
  const key = `${year}-${pad(month + 1)}`;
  const hours = store.holyHoursFor(key);
  const isCurrentMonth = (() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month;
  })();

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const link = (date) => `#/santisimo?mes=${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Adoración',
      title: 'Horario del Santísimo',
      subtitle:
        'Una hora de acompañamiento a Jesús Sacramentado, asignada a cada comunidad de la Pastoral Familiar. Los horarios cambian mes a mes.',
      actions: `<a class="btn btn-ghost" href="#/calendario">${icon('calendar', 16)} Ver calendario</a>
                <a class="btn btn-primary" href="#/contactos">${icon('phone', 16)} Consultar mi turno</a>`,
    })}

    <section class="section-tight">
      <div class="wrap">
        <div class="holy-layout">
          <div>
            <div class="holy-card">
              <div class="holy-monthbar">
                <a class="btn-icon" href="${link(prev)}" aria-label="Mes anterior">${icon('chevron-left', 18)}</a>
                <div class="holy-month">
                  <h2>${esc(fmtMonthYear(cursor))}</h2>
                  <span>${hours.length ? esc(pluralize(hours.length, 'comunidad', 'comunidades')) : 'Horario pendiente'}</span>
                </div>
                <a class="btn-icon" href="${link(next)}" aria-label="Mes siguiente">${icon('chevron-right', 18)}</a>
                ${!isCurrentMonth ? `<a class="btn btn-ghost btn-sm" href="#/santisimo">Este mes</a>` : ''}
              </div>

              ${
                hours.length
                  ? `<div class="holy-list">
                      ${hours
                        .map(
                          (item, index) => `
                          <div class="holy-row">
                            <span class="holy-num">${pad(index + 1)}</span>
                            <span class="holy-time">
                              ${esc(fmtClock(item.start_time))}
                              <small>hasta ${esc(fmtClock(item.end_time))}</small>
                            </span>
                            <span class="holy-community">${esc(item.community)}</span>
                          </div>`
                        )
                        .join('')}
                    </div>
                    <div class="holy-foot">
                      ${icon('info', 14)}
                      <span>Cada comunidad cubre su hora completa. Si no puedes asistir, coordina un cambio con tu responsable.</span>
                    </div>`
                  : `<div style="padding:1.2rem">
                      ${emptyState({
                        icon: 'sun',
                        title: 'El horario de este mes aún no está publicado',
                        text: 'El equipo de la pastoral lo actualiza cada mes. Mientras tanto, puedes consultar el calendario o escribir a un coordinador.',
                        action: '<a class="btn btn-ghost btn-sm mt-1" href="#/contactos">Ver contactos</a>',
                      })}
                    </div>`
              }
            </div>

            <p class="text-sm text-muted mt-2" style="padding-inline:.3rem">
              ${icon('repeat', 13)} El horario se publica por mes: revisa siempre la pestaña del mes que corresponde.
            </p>
          </div>

          <aside class="stack holy-aside" style="gap:1rem">
            <div class="card card-pad-lg" style="background:linear-gradient(170deg,#FFFCF4,#F8EEDC);border-color:rgba(201,145,63,.35)">
              <span class="resource-icon" style="background:var(--gold-soft);color:var(--gold-deep);margin-bottom:.8rem">${icon('sun', 22)}</span>
              <h3 class="card-title">Una hora con Jesús</h3>
              <p class="card-text">La adoración no es un turno más: es un tiempo para estar con quien nos espera. Tu comunidad cuenta contigo.</p>
              <div class="holy-quote">
                “Entre todas las devociones, la de adorar a Jesús Sacramentado es la primera, después de los Sacramentos; la más apreciada por Dios y la más útil para nosotros”.
                <cite>San Alfonso María de Ligorio</cite>
              </div>
            </div>

            <div class="card">
              <h3 class="card-title" style="font-size:1.05rem">¿Cómo funciona?</h3>
              <ul class="holy-steps">
                <li><span>1</span> Cada mes se publica el horario asignado a las comunidades.</li>
                <li><span>2</span> Tu comunidad cubre una hora completa de adoración.</li>
                <li><span>3</span> Si no puedes, coordina el cambio con tu responsable.</li>
              </ul>
              <a class="section-link mt-2" href="#/contactos">Hablar con un coordinador ${icon('arrow-right', 15)}</a>
            </div>
          </aside>
        </div>
      </div>
    </section>`;
}
