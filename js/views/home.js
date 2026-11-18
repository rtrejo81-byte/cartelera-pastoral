/* =========================================================
   Página de inicio
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { MONTHS } from '../config.js';
import { site, emptyState } from '../ui.js';
import { esc, fmtTime, relativeLabel, truncate } from '../utils.js';
import { activityCard, noticeCard, birthdayCard } from '../cards.js';

export default function homeView(root) {
  const s = site();
  const next = store.nextActivity();
  const upcoming = store.upcoming(4);
  const notices = store.publicList('notices').slice(0, 2);
  const month = new Date().getMonth();
  const birthdays = store.birthdaysInMonth(month).slice(0, 4);
  const contacts = store.publicList('contacts');

  const nextCard = next
    ? `
      <div class="next-card">
        <p class="eyebrow eyebrow-plain" style="margin-bottom:.45rem;color:var(--clay-deep)">${icon('sparkles', 13)} Próximo encuentro</p>
        <p class="text-sm text-muted" style="margin:0 0 .3rem">${esc(relativeLabel(next.starts_at))} · ${esc(fmtTime(next.starts_at))}</p>
        <h3 style="font-size:1.3rem;line-height:1.2;margin-bottom:.5rem">${esc(next.title)}</h3>
        <p class="text-sm text-muted" style="margin:0 0 .9rem;display:flex;align-items:center;gap:.3rem">
          ${icon('map-pin', 13)} ${esc(truncate(next.location || 'Por confirmar', 34))}
        </p>
        <a class="btn btn-primary btn-sm btn-block" href="#/calendario">${icon('calendar', 15)} Ver en el calendario</a>
      </div>`
    : `
      <div class="next-card">
        <p class="eyebrow eyebrow-plain" style="margin-bottom:.45rem;color:var(--clay-deep)">${icon('sparkles', 13)} Estamos organizando</p>
        <h3 style="font-size:1.25rem;line-height:1.25;margin-bottom:.5rem">Aún no hay actividades publicadas</h3>
        <p class="text-sm text-muted" style="margin:0 0 .9rem">¿Tienes una idea para la pastoral? Propónla y el equipo la revisará.</p>
        <a class="btn btn-clay btn-sm btn-block" href="#/proponer">${icon('plus', 15)} Proponer actividad</a>
      </div>`;

  root.innerHTML = `
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">${esc(s.parish)} · ${esc(s.city)}</p>
          <h1 class="hero-title">${esc(s.heroTitle)} <em>${esc(s.heroAccent)}</em></h1>
          <p class="hero-text">${esc(s.heroText)}</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg" href="#/calendario">${icon('calendar', 18)} Ver calendario</a>
            <a class="btn btn-ghost btn-lg" href="#/proponer">${icon('plus', 18)} Proponer actividad</a>
          </div>
          <div class="hero-meta">
            <div class="hero-stat"><b>${store.upcoming(99).length}</b><span>Actividades próximas</span></div>
            <div class="hero-stat"><b>${contacts.length}</b><span>Coordinadores</span></div>
            <div class="hero-stat"><b>${store.publicList('birthdays').length}</b><span>Celebraciones del año</span></div>
          </div>
        </div>
        <div class="hero-art" aria-label="Próxima actividad">
          <div class="arch" aria-hidden="true"></div>
          <span class="float-tag">${icon('heart', 13)} Pastoral Familiar</span>
          ${nextCard}
        </div>
      </div>
    </section>

    <section class="wrap" aria-label="Accesos rápidos">
      <div class="quickbar">
        ${quickLink('/calendario', 'calendar', 'Calendario', 'Mes y agenda')}
        ${quickLink('/avisos', 'megaphone', 'Avisos', 'Lo importante')}
        ${quickLink('/comunidad', 'users', 'Comunidad', 'Celebramos')}
        ${quickLink('/recursos', 'book', 'Recursos', 'Materiales')}
        ${quickLink('/galeria', 'image', 'Galería', 'Momentos')}
        ${quickLink('/oracion', 'heart', 'Oración', 'Oramos juntos')}
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="eyebrow">Agenda</p>
            <h2 class="section-title">Próximos encuentros</h2>
            <p class="section-sub">Todo lo que tenemos preparado para caminar juntos este tiempo.</p>
          </div>
          <a class="section-link" href="#/calendario">Ver calendario completo ${icon('arrow-right', 16)}</a>
        </div>
        ${
          upcoming.length
            ? `<div class="grid grid-2">${upcoming.map((a) => activityCard(a)).join('')}</div>`
            : emptyState({
                icon: 'calendar',
                title: 'Sin actividades por ahora',
                text: 'Cuando el equipo publique la próxima actividad, aparecerá aquí.',
                action: '<a class="btn btn-primary btn-sm mt-1" href="#/proponer">Proponer una actividad</a>',
              })
        }
      </div>
    </section>

    <section class="section section-tight">
      <div class="wrap">
        <div class="home-split">
          <div>
            <div class="section-head" style="margin-bottom:1.2rem">
              <div>
                <p class="eyebrow">Comunicados</p>
                <h2 class="section-title" style="font-size:clamp(1.5rem,2.8vw,2rem)">Avisos de la pastoral</h2>
              </div>
              <a class="section-link" href="#/avisos">Todos ${icon('arrow-right', 15)}</a>
            </div>
            ${
              notices.length
                ? `<div class="stack" style="gap:1rem">${notices.map((n) => noticeCard(n)).join('')}</div>`
                : emptyState({ icon: 'megaphone', title: 'No hay avisos publicados', text: 'Aquí verás los comunicados importantes del equipo.' })
            }
          </div>

          <aside class="home-aside">
            <div class="card card-pad-lg" style="background:linear-gradient(170deg,#FFFDF8,#FBF5EA)">
              <p class="eyebrow eyebrow-plain" style="color:var(--gold-deep)">${icon('cake', 14)} ${esc(MONTHS[month])}</p>
              <h3 class="card-title" style="font-size:1.25rem">Cumpleaños y aniversarios</h3>
              <p class="card-text mb-2">Nos alegra celebrar la vida de cada familia.</p>
              ${
                birthdays.length
                  ? `<div class="stack">${birthdays.map(birthdayCard).join('')}</div>`
                  : `<p class="text-sm text-muted">Este mes no hay celebraciones registradas.</p>`
              }
              <a class="section-link mt-3" href="#/cumpleanos">Ver todos ${icon('arrow-right', 15)}</a>
            </div>

            <a class="card card-hover" href="#/oracion" style="text-decoration:none;display:flex;gap:.9rem;align-items:flex-start">
              <span class="resource-icon is-link" style="background:var(--green-soft);color:var(--green-deep)">${icon('heart', 20)}</span>
              <span>
                <strong style="display:block;font-family:var(--font-display);font-size:1.05rem;color:var(--ink)">Oramos por ti</strong>
                <span class="text-sm text-muted">Deja tu intención y acompañémonos en la oración.</span>
              </span>
            </a>
          </aside>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="eyebrow">Explora</p>
            <h2 class="section-title">Mucho más que un calendario</h2>
            <p class="section-sub">La web puede crecer con la pastoral: cada sección vive por separado y se puede activar o desactivar cuando quieras.</p>
          </div>
        </div>
        <div class="grid grid-3">
          ${portalCard('/galeria', 'image', 'Galería', 'Revive los retiros, convivencias y celebraciones en fotos.')}
          ${portalCard('/recursos', 'book', 'Recursos', 'Guías, fichas de inscripción y materiales para las familias.')}
          ${portalCard('/comunidad', 'users', 'Comunidad', 'Cumpleaños, contactos y el espacio de oración en un solo lugar.')}
        </div>
      </div>
    </section>

    <section class="section section-tight">
      <div class="wrap">
        <div class="cta-band">
          <div>
            <p class="eyebrow" style="color:#E9C98E">¿Tienes una idea?</p>
            <h2>Cada actividad empieza con alguien que se anima</h2>
            <p>Propón una actividad para la pastoral. Los coordinadores la revisan y, al aprobarla, aparece en el calendario de todos.</p>
          </div>
          <div class="cluster">
            <a class="btn btn-clay btn-lg" href="#/proponer">${icon('plus', 17)} Proponer actividad</a>
            <a class="btn btn-ghost btn-lg" href="#/contactos" style="color:#F6EFE3;border-color:rgba(246,239,227,.35)">Hablar con un coordinador</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function quickLink(path, iconName, label, hint) {
  return `<a class="quickbar-item" href="#${path}">
    <span class="qicon">${icon(iconName, 18)}</span>
    <span>${esc(label)}<small>${esc(hint)}</small></span>
  </a>`;
}

function portalCard(path, iconName, title, text) {
  return `<a class="card card-hover portal-card" href="#${path}">
    <span class="portal-icon">${icon(iconName, 22)}</span>
    <h3 class="card-title">${esc(title)}</h3>
    <p class="card-text">${esc(text)}</p>
    <span class="section-link" style="margin-top:auto">Entrar ${icon('arrow-right', 15)}</span>
  </a>`;
}
