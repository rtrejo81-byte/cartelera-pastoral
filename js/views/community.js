/* =========================================================
   Comunidad: punto de encuentro de las secciones
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { MONTHS } from '../config.js';
import { pageHead, emptyState } from '../ui.js';
import { birthdayCard, albumCard } from '../cards.js';
import { esc, pluralize } from '../utils.js';

export default function communityView(root) {
  const month = new Date().getMonth();
  const birthdays = store.birthdaysInMonth(month);
  const albums = store.publicList('albums').slice(0, 3);
  const contacts = store.publicList('contacts');
  const prayers = store.publicList('prayers');

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
          ${featureCard('/contactos', 'phone', 'Directorio', 'Las personas que coordinan cada área, con sus datos de contacto.', `${contacts.length} coordinadores`, 'green')}
        </div>
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
