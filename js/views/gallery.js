/* =========================================================
   Galería de actividades
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { pageHead, emptyState } from '../ui.js';
import { albumCard } from '../cards.js';
import { esc, pluralize } from '../utils.js';

export default function galleryView(root) {
  const albums = store.publicList('albums');
  const totalPhotos = albums.reduce((sum, a) => sum + (Array.isArray(a.photos) ? a.photos.length : 0), 0);

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Memoria viva',
      title: 'Galería de la pastoral',
      subtitle: 'Retiros, convivencias y celebraciones. Los momentos que nos recuerdan que caminar juntos vale la pena.',
      actions: `<a class="btn btn-ghost" href="#/contactos">${icon('send', 16)} Compartir fotos</a>`,
    })}

    <section class="section-tight">
      <div class="wrap">
        ${
          albums.length
            ? `<div class="between" style="margin-bottom:1.2rem">
                <p class="text-sm text-muted" style="margin:0">${esc(pluralize(albums.length, 'álbum', 'álbumes'))} · ${esc(pluralize(totalPhotos, 'foto', 'fotos'))}</p>
                <span class="badge badge-outline">${icon('image', 12)} Toca un álbum para verlo</span>
              </div>
              <div class="album-grid">${albums.map(albumCard).join('')}</div>`
            : emptyState({
                icon: 'image',
                title: 'Aún no hay álbumes',
                text: 'Cuando el equipo suba las fotos de la próxima actividad, aparecerán aquí.',
              })
        }

        <div class="inline-note mt-4">
          ${icon('info', 16)}
          <span>Las fotos se suben desde el panel de administración. Si tomaste fotos en una actividad, compártelas con el equipo de comunicación.</span>
        </div>
      </div>
    </section>`;
}
