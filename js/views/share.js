/* =========================================================
   Muro de la comunidad: saludos, mensajes y videos
   Envío público → revisión de un coordinador → publicación.
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { pageHead, emptyState, openModal, closeModal, field, readForm, showFormError, setBusy, toast } from '../ui.js';
import { esc, fmtDateShort } from '../utils.js';

const HP_FIELD = 'website';
const MAX_MESSAGE = 600;

export default function shareView(root) {
  const ready = store.sharesReady;
  const posts = store.publicList('shares');

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Comunidad',
      title: 'Comparte con la comunidad',
      subtitle:
        'Un espacio para dejar un saludo, un mensaje o un video. Todo pasa por revisión antes de publicarse para cuidar a nuestra comunidad.',
      actions: ready
        ? `<button type="button" class="btn btn-primary" data-open-share>${icon('plus', 16)} Dejar un mensaje</button>
           <a class="btn btn-ghost" href="#/qr">${icon('qr', 16)} Compartir QR</a>`
        : `<a class="btn btn-ghost" href="#/contactos">${icon('phone', 16)} Contactar al equipo</a>`,
    })}

    <section class="section-tight">
      <div class="wrap" style="padding-bottom:clamp(2.5rem,6vw,4rem)">
        <div class="share-banner">
          <span class="share-banner-ico">${icon('heart', 22)}</span>
          <div>
            <h2>Un espacio para compartir</h2>
            <p>Saludos, agradecimientos, recuerdos y videos. Los mensajes se publican <b>después de que un coordinador los aprueba</b>; así cuidamos el tono y la privacidad.</p>
          </div>
        </div>

        ${
          !ready
            ? `<div class="inline-note" style="margin-bottom:1.2rem">${icon('info', 16)}<span>El muro se está preparando. En cuanto el administrador termine la configuración, podrás dejar tu mensaje.</span></div>`
            : ''
        }

        ${
          posts.length
            ? `<div class="share-grid">${posts.map(shareCard).join('')}</div>`
            : emptyState({
                icon: 'quote',
                title: ready ? 'Aún no hay mensajes publicados' : 'El muro se está preparando',
                text: ready
                  ? 'Sé el primero en dejar un saludo para la comunidad. Tu mensaje aparecerá aquí cuando sea aprobado.'
                  : 'Vuelve pronto para compartir un saludo.',
              })
        }
      </div>
    </section>`;

  root.querySelector('[data-open-share]')?.addEventListener('click', openShareForm);
}

function shareCard(s) {
  const name = String(s.name || '').trim() || 'Anónimo';
  const initial = name === 'Anónimo' ? icon('heart', 18) : esc(name.charAt(0).toUpperCase());
  return `<article class="share-card">
    <div class="share-card-head">
      <span class="share-avatar">${initial}</span>
      <div class="share-author">
        <b>${esc(name)}</b>
        <span>${esc(s.created_at ? fmtDateShort(s.created_at) : '')}</span>
      </div>
      <span class="share-quote" aria-hidden="true">${icon('quote', 22)}</span>
    </div>
    <p class="share-message">${esc(s.message || '')}</p>
    ${videoMarkup(s.video_url)}
  </article>`;
}

function safeVideoUrl(raw) {
  try {
    const url = new URL(String(raw || '').trim());
    return /^https?:$/.test(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function videoEmbedUrl(raw) {
  const safe = safeVideoUrl(raw);
  if (!safe) return '';
  const url = new URL(safe);
  const host = url.hostname.replace(/^www\./i, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : '';
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    let id = url.searchParams.get('v') || '';
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'shorts' || parts[0] === 'embed') id = parts[1] || '';
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : '';
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = url.pathname.match(/(\d{6,})/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : '';
  }
  return '';
}

function videoMarkup(raw) {
  const safe = safeVideoUrl(raw);
  if (!safe) return '';
  const embed = videoEmbedUrl(safe);
  if (embed) {
    return `<div class="share-video">
      <iframe src="${esc(embed)}" title="Video compartido" loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>`;
  }
  return `<a class="share-video-link" href="${esc(safe)}" target="_blank" rel="noopener">${icon('video', 16)} Ver video</a>`;
}

function openShareForm() {
  if (!store.sharesReady) {
    toast('El muro se está preparando. Intenta más tarde.', 'info');
    return;
  }

  const { el } = openModal({
    title: 'Dejar un mensaje',
    subtitle: 'Tu mensaje será revisado por un coordinador antes de publicarse.',
    body: `
      <form id="share-form" class="form-grid" novalidate>
        <input type="text" name="${HP_FIELD}" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        ${field({ label: 'Tu nombre (opcional)', name: 'name', maxlength: 60, placeholder: 'Cómo quieres aparecer; si lo dejas vacío, será Anónimo' })}
        ${field({
          label: 'Tu mensaje',
          name: 'message',
          type: 'textarea',
          rows: 5,
          required: true,
          maxlength: MAX_MESSAGE,
          placeholder: 'Un saludo, un agradecimiento, un recuerdo…',
          hint: `Máximo ${MAX_MESSAGE} caracteres.`,
        })}
        ${field({
          label: 'Enlace de video (opcional)',
          name: 'video_url',
          type: 'url',
          placeholder: 'https://youtube.com/watch?v=…',
          hint: 'YouTube, Vimeo o un enlace externo. El video no se sube a Supabase; solo se comparte el enlace.',
        })}
      </form>`,
    footer: `
      <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
      <button type="button" class="btn btn-primary" data-send>${icon('send', 16)} Enviar a revisión</button>`,
  });

  const form = el.querySelector('#share-form');
  const send = el.querySelector('[data-send]');

  send.addEventListener('click', async () => {
    const data = readForm(form);
    if (data[HP_FIELD]) return;
    const message = String(data.message || '').trim();
    const name = String(data.name || '').trim();
    const video = safeVideoUrl(data.video_url);

    if (message.length < 2) {
      showFormError(form, 'Escribe un mensaje antes de enviarlo.');
      return;
    }
    if (message.length > MAX_MESSAGE) {
      showFormError(form, `El mensaje no puede pasar de ${MAX_MESSAGE} caracteres.`);
      return;
    }
    if (data.video_url && !video) {
      showFormError(form, 'El enlace del video debe ser una dirección http(s) válida.');
      return;
    }

    setBusy(send, true, 'Enviando…');
    try {
      await store.submitPublic('shares', {
        name,
        message,
        video_url: video,
        status: 'pending',
      });
      closeModal({ silent: true });
      toast('Tu mensaje quedó en revisión. Un coordinador lo aprobará pronto.', 'ok', 7000);
    } catch (err) {
      setBusy(send, false);
      showFormError(form, err.message || 'No se pudo enviar el mensaje.');
    }
  });
}
