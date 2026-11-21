/* =========================================================
   Compartir QR: código generado en el navegador
   ========================================================= */

import { icon } from '../icons.js';
import { pageHead, toast } from '../ui.js';
import { esc } from '../utils.js';

const TARGETS = [
  { hash: '#/', label: 'Inicio', icon: 'home' },
  { hash: '#/calendario', label: 'Calendario', icon: 'calendar' },
  { hash: '#/compartir', label: 'Compartir', icon: 'quote' },
];

export default function qrView(root) {
  let target = TARGETS[0].hash;

  root.innerHTML = `
    ${pageHead({
      eyebrow: 'Invita a la comunidad',
      title: 'Comparte la cartelera',
      subtitle: 'Un código QR para que cualquier persona abra la cartelera con la cámara de su teléfono, sin buscar enlaces.',
      actions: `<a class="btn btn-ghost" href="#/compartir">${icon('quote', 16)} Ir al muro</a>
                <button type="button" class="btn btn-primary" data-qr-print>${icon('print', 16)} Imprimir QR</button>`,
    })}

    <section class="section-tight">
      <div class="wrap" style="padding-bottom:clamp(2.5rem,6vw,4rem)">
        <div class="qr-layout">
          <div class="qr-card">
            <p class="eyebrow" style="display:flex;justify-content:center">Escanea y comparte</p>
            <div class="qr-code" data-qr-box aria-live="polite"></div>
            <p class="qr-url"><a data-qr-url href="#/" target="_blank" rel="noopener"></a></p>
            <div class="qr-actions no-print">
              <button type="button" class="btn btn-light btn-sm" data-qr-copy>${icon('link', 15)} Copiar enlace</button>
              <button type="button" class="btn btn-light btn-sm" data-qr-download>${icon('download', 15)} Descargar QR</button>
              <button type="button" class="btn btn-light btn-sm" data-qr-wa>${icon('whatsapp', 15)} Enviar por WhatsApp</button>
            </div>
            <p class="field-hint">Apunta la cámara del teléfono al código. No necesita instalar nada.</p>
          </div>

          <aside class="qr-info">
            <h2>Una forma sencilla de invitar</h2>
            <p>Imprime el QR y pégalo en la entrada del templo, en el salón o en una invitación. También puedes compartir el enlace directo por WhatsApp.</p>

            <div class="qr-targets no-print" data-qr-targets>
              ${TARGETS.map(
                (item) =>
                  `<button type="button" class="btn ${item.hash === target ? 'btn-primary' : 'btn-ghost'} btn-sm" data-target="${esc(item.hash)}" aria-pressed="${item.hash === target}">${icon(item.icon, 15)} ${esc(item.label)}</button>`
              ).join('')}
            </div>

            <div class="info-list">
              <div class="info-item"><span class="ico">1</span><div><b>Abre la cámara</b><br>En iPhone o Android, apunta al código.</div></div>
              <div class="info-item"><span class="ico">2</span><div><b>Toca el aviso</b><br>El teléfono mostrará el enlace de la cartelera.</div></div>
              <div class="info-item"><span class="ico">3</span><div><b>Compártela</b><br>También puedes enviar el QR por WhatsApp o imprimirlo.</div></div>
            </div>

            <a class="btn btn-light btn-sm" href="#/contactos">${icon('phone', 15)} Ver contactos de la pastoral</a>
          </aside>
        </div>
      </div>
    </section>`;

  const box = root.querySelector('[data-qr-box]');
  const urlLink = root.querySelector('[data-qr-url]');
  const targetButtons = [...root.querySelectorAll('[data-target]')];

  const baseUrl = () => location.href.split('#')[0];
  const fullUrl = () => `${baseUrl()}${target}`;

  const render = () => {
    const url = fullUrl();
    urlLink.textContent = url;
    urlLink.href = url;

    if (typeof window.qrcode !== 'function') {
      box.innerHTML = '<p class="text-sm text-muted">No se pudo cargar el generador de QR. Recarga la página.</p>';
      return;
    }

    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      box.innerHTML = qr.createSvgTag({
        cellSize: 10,
        margin: 4,
        scalable: true,
        alt: `Código QR para abrir ${url}`,
      });
    } catch {
      box.innerHTML = '<p class="text-sm text-muted">No se pudo generar el código QR.</p>';
    }

    targetButtons.forEach((button) => {
      const active = button.dataset.target === target;
      button.classList.toggle('btn-primary', active);
      button.classList.toggle('btn-ghost', !active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const copyLink = async () => {
    const url = fullUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast('Enlace copiado. Ya puedes pegarlo donde quieras.', 'ok');
    } catch {
      const field = document.createElement('textarea');
      field.value = url;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand('copy');
        toast('Enlace copiado.', 'ok');
      } catch {
        toast('No se pudo copiar. Mantén pulsado el enlace para copiarlo.', 'error');
      }
      field.remove();
    }
  };

  const download = () => {
    const svg = box.querySelector('svg');
    if (!svg) {
      toast('El código QR aún no está listo.', 'error');
      return;
    }
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '1024');
    clone.setAttribute('height', '1024');
    const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const label = TARGETS.find((item) => item.hash === target)?.label || 'cartelera';
    link.href = url;
    link.download = `pastoral-familiar-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('QR descargado. Puedes imprimirlo o compartirlo.', 'ok');
  };

  const shareWhatsApp = () => {
    const text = `Comparte la cartelera de la Pastoral Familiar: ${fullUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  targetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      target = button.dataset.target;
      render();
    });
  });

  root.querySelector('[data-qr-copy]').addEventListener('click', copyLink);
  root.querySelector('[data-qr-download]').addEventListener('click', download);
  root.querySelector('[data-qr-wa]').addEventListener('click', shareWhatsApp);
  root.querySelector('[data-qr-print]').addEventListener('click', () => window.print());

  render();
}
