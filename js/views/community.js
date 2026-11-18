/* =========================================================
   Comunidad: punto de encuentro de las secciones
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { MONTHS } from '../config.js';
import { pageHead, emptyState } from '../ui.js';
import { birthdayCard, albumCard } from '../cards.js';
import { esc, parseLocal, pluralize } from '../utils.js';

export default function communityView(root) {
  const month = new Date().getMonth();
  const birthdays = store.birthdaysInMonth(month);
  const albums = store.publicList('albums').slice(0, 3);
  const contacts = store.publicList('contacts');
  const prayers = store.publicList('prayers');
  const services = store.upcomingServiceAssignments(5);

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Nuestra gente',
      title: 'La comunidad de la Pastoral Familiar',
      subtitle: 'Celebramos la vida, guardamos la memoria y nos sostenemos en la oración. Este es el espacio donde todo eso se encuentra.',
    })}

    <section class="section-tight">
      <div class="wrap">
        <div class="grid grid-3">
          ${featureCard('/cumpleanos', 'cake', 'Cumpleaños y aniversarios', 'Cada vida y cada historia de amor merece celebrarse.', `${birthdays.length} este mes`, 'gold')}
          ${featureCard('/galeria', 'image', 'Galería', 'Los retiros, convivencias y celebraciones que hemos vivido.', `${albums.length} álbumes`, 'clay')}
          ${featureCard('/contactos', 'phone', 'Directorio', 'Las personas que coordinan cada área, con sus datos de contacto.', `${contacts.length} coordinadores`, 'sage')}
        </div>

        <div class="contact-strip mt-3">
          <div>
            <p class="eyebrow" style="margin-bottom:.35rem">Adoración</p>
            <h3>Horario del Santísimo</h3>
            <p>Una hora de acompañamiento a Jesús Sacramentado, asignada a cada comunidad. El horario se renueva mes a mes.</p>
          </div>
          <a class="btn btn-primary" href="#/santisimo">${icon('sun', 16)} Ver horario del mes</a>
        </div>

        ${
          services.length
            ? `<div class="card card-pad-lg mt-3">
                <div class="between">
                  <div>
                    <p class="eyebrow" style="margin-bottom:.35rem">Servicios</p>
                    <h3 class="card-title" style="font-size:1.3rem">Misas de comunidad</h3>
                    <p class="card-text">Viernes, 6:00 p. m. Cada comunidad se encarga del servicio litúrgico en su fecha.</p>
                  </div>
                  <a class="btn btn-light btn-sm" href="#/calendario">${icon('calendar', 15)} Ver calendario</a>
                </div>
                <div class="service-list">
                  ${services
                    .map((s) => {
                      const d = parseLocal(s.date);
                      return `<div class="service-row">
                        <span class="service-date">${d.getDate()}<small>${esc(d.toLocaleDateString('es', { month: 'short' }).replace('.', ''))}</small></span>
                        <span class="service-community">${esc(s.community)}</span>
                        <span class="badge ${s.kind === 'domingo' ? 'badge-green' : 'badge-gold'}">${s.kind === 'domingo' ? 'Domingo' : 'Viernes'}</span>
                      </div>`;
                    })
                    .join('')}
                </div>
              </div>`
            : ''
        }
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="eyebrow">${esc(MONTHS[month])}</p>
            <h2 class="section-title">Celebramos este mes</h2>
            <p class="section-sub">Un saludo a tiempo alegra el día de alguien de nuestra comunidad.</p>
          </div>
          <a class="section-link" href="#/cumpleanos">Ver todo el año ${icon('arrow-right', 16)}</a>
        </div>
        ${
          birthdays.length
            ? `<div class="grid grid-2">${birthdays.slice(0, 6).map(birthdayCard).join('')}</div>`
            : emptyState({
                icon: 'cake',
                title: 'Sin celebraciones este mes',
                text: 'Consulta el calendario de cumpleaños completo del año.',
                action: '<a class="btn btn-ghost btn-sm mt-1" href="#/cumpleanos">Ver cumpleaños</a>',
              })
        }
      </div>
    </section>

    <section class="section section-tight">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="eyebrow">Memoria</p>
            <h2 class="section-title">Los últimos momentos</h2>
          </div>
          <a class="section-link" href="#/galeria">Ver galería ${icon('arrow-right', 16)}</a>
        </div>
        ${
          albums.length
            ? `<div class="album-grid">${albums.map(albumCard).join('')}</div>`
            : emptyState({ icon: 'image', title: 'Aún no hay fotos', text: 'Los álbumes aparecerán aquí cuando el equipo comparta las fotos.' })
        }
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="prayer-band">
          <div class="prayer-band-copy">
            <p class="eyebrow" style="color:#E9C98E">Oración</p>
            <h2>Oramos unos por otros</h2>
            <p>Deja tu intención, o acompáñanos diciendo “Amén” por las intenciones de los demás. Nadie debería cargar solo lo que le pesa.</p>
            <div class="cluster mt-3">
              <a class="btn btn-clay" href="#/oracion">${icon('heart', 16)} Dejar mi intención</a>
              <span class="text-sm" style="color:rgba(246,239,227,.7)">${esc(pluralize(prayers.length, 'intención compartida', 'intenciones compartidas'))}</span>
            </div>
          </div>
          <div class="prayer-band-art" aria-hidden="true">${icon('heart', 96)}</div>
        </div>
      </div>
    </section>`;
}

function featureCard(path, iconName, title, text, meta, tone) {
  return `<a class="feature-card tone-${tone}" href="#${path}">
    <span class="feature-icon">${icon(iconName, 24)}</span>
    <span class="feature-meta">${esc(meta)}</span>
    <h2>${esc(title)}</h2>
    <p>${esc(text)}</p>
    <span class="feature-arrow">Entrar ${icon('arrow-right', 16)}</span>
  </a>`;
}
