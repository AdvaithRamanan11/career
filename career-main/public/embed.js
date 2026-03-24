/**
 * CareerIQ — JavaScript Widget Loader (embed.js)
 * Version 1.1
 *
 * Mounts CareerIQ into any <div> on the host page via a sandboxed iFrame.
 * The host page never receives student data; all interaction stays inside
 * the iFrame pointing at advaithramanan11.github.io/career.
 *
 * Usage:
 *   <div id="careeriq-widget"></div>
 *   <script
 *     src="https://advaithramanan11.github.io/career/embed.js"
 *     data-target="careeriq-widget"
 *     data-height="750">
 *   </script>
 *
 * Attributes:
 *   data-target   ID of the host <div> to mount into  (default: "careeriq-widget")
 *   data-height   Fixed height in px, or omit for auto-resize               (default: auto)
 */

(function () {
  'use strict';

  var ORIGIN = 'https://advaithramanan11.github.io';
  var MIN_HEIGHT = 600;
  var DEFAULT_HEIGHT = 750;

  // ── Find the <script> tag that loaded this file ──────────────────────────
  // Works even if the script is deferred or async.
  var scripts = document.querySelectorAll('script[src*="embed.js"]');
  var thisScript = scripts[scripts.length - 1];

  var targetId = (thisScript && thisScript.getAttribute('data-target')) || 'careeriq-widget';
  var fixedHeight = thisScript && thisScript.getAttribute('data-height');

  // ── Find or create the mount point ───────────────────────────────────────
  var container = document.getElementById(targetId);
  if (!container) {
    console.warn('[CareerIQ] No element found with id="' + targetId + '". ' +
      'Add <div id="' + targetId + '"></div> before this script tag.');
    return;
  }

  // ── Build the iFrame ─────────────────────────────────────────────────────
  var iframe = document.createElement('iframe');

  iframe.src = ORIGIN;
  iframe.title = 'CareerIQ — College Income & Loan ROI Predictor';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allowfullscreen', 'false');

  // Permissions: minimal surface — no camera, mic, geolocation, or payment.
  iframe.setAttribute('allow', 'fullscreen');

  // Sandbox: allow scripts and same-origin so the React app runs,
  // but block popups, top-navigation, and form submission to the host.
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox');

  iframe.style.cssText = [
    'width:100%',
    'border:none',
    'border-radius:12px',
    'display:block',
    'overflow:hidden',
    'height:' + (fixedHeight ? fixedHeight + 'px' : DEFAULT_HEIGHT + 'px'),
    'transition:height 0.2s ease',
  ].join(';');

  container.appendChild(iframe);

  // ── Auto-resize via postMessage ───────────────────────────────────────────
  // The CareerIQ app posts { type: 'careeriq:resize', height: N } whenever
  // its content height changes. We update the iFrame height in response,
  // unless the host has pinned a fixed height via data-height.
  if (!fixedHeight) {
    window.addEventListener('message', function (event) {
      // Security: only accept messages from the CareerIQ origin.
      if (event.origin !== ORIGIN) return;
      if (!event.data || event.data.type !== 'careeriq:resize') return;

      var newHeight = Math.max(MIN_HEIGHT, Math.ceil(event.data.height));
      iframe.style.height = newHeight + 'px';
    });
  }

  // ── Accessibility: forward focus into iFrame on click ────────────────────
  container.addEventListener('click', function () {
    try { iframe.contentWindow.focus(); } catch (e) { /* cross-origin; safe to ignore */ }
  });

})();
