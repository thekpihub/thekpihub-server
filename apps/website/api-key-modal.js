(function () {
  'use strict';

  var STORAGE_KEY = 'kpihub_anthropic_key';
  var _resolve = null;
  var _reject = null;
  var _domReady = false;

  window.KpiHub = window.KpiHub || {};

  window.KpiHub.getStoredKey = function () {
    return localStorage.getItem(STORAGE_KEY) || '';
  };

  window.KpiHub.clearKey = function () {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Returns a Promise that resolves with the key.
  // Shows the modal if no key is stored; resolves immediately if one exists.
  window.KpiHub.ensureApiKey = function () {
    return new Promise(function (resolve, reject) {
      var existing = KpiHub.getStoredKey();
      if (existing) { resolve(existing); return; }
      _ensureDOM();
      _resolve = resolve;
      _reject = reject;
      _show();
    });
  };

  function _ensureDOM() {
    if (_domReady) return;
    _domReady = true;

    var style = document.createElement('style');
    style.textContent =
      '#kh-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);z-index:9999;display:none;align-items:center;justify-content:center}' +
      '#kh-backdrop.kh-open{display:flex;animation:khFadeIn .18s ease}' +
      '@keyframes khFadeIn{from{opacity:0}to{opacity:1}}' +
      '#kh-modal{background:#0d1428;border:1px solid #1e2d4a;border-radius:16px;padding:32px 28px;width:100%;max-width:420px;margin:16px;box-shadow:0 24px 64px rgba(0,0,0,.75);animation:khUp .2s ease}' +
      '@keyframes khUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}' +
      '#kh-modal h2{font-family:Syne,sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;margin:0 0 8px}' +
      '#kh-modal .kh-desc{font-size:.82rem;color:#94a3b8;line-height:1.6;margin:0 0 22px}' +
      '#kh-modal label{display:block;font-size:.72rem;color:#94a3b8;margin-bottom:5px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}' +
      '#kh-key-input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid #243350;border-radius:8px;padding:11px 14px;color:#e2e8f0;font-family:monospace;font-size:.86rem;outline:none;transition:border-color .2s}' +
      '#kh-key-input:focus{border-color:#14b8a6}' +
      '#kh-key-input::placeholder{color:#475569;font-family:"DM Sans",sans-serif;letter-spacing:normal;font-size:.84rem}' +
      '.kh-hint{font-size:.72rem;color:#475569;margin:7px 0 20px}' +
      '.kh-hint a{color:#f59e0b;text-decoration:none}' +
      '.kh-hint a:hover{text-decoration:underline}' +
      '#kh-key-error{font-size:.76rem;color:#ef4444;min-height:1.1em;margin-bottom:14px;display:none}' +
      '.kh-actions{display:flex;gap:10px}' +
      '#kh-save{flex:1;padding:11px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#000;border:none;border-radius:8px;font-family:Syne,sans-serif;font-size:.84rem;font-weight:700;cursor:pointer;transition:opacity .2s}' +
      '#kh-save:hover{opacity:.86}' +
      '#kh-cancel{padding:11px 18px;background:transparent;border:1px solid #1e2d4a;border-radius:8px;color:#94a3b8;font-family:"DM Sans",sans-serif;font-size:.84rem;cursor:pointer;transition:border-color .2s}' +
      '#kh-cancel:hover{border-color:#475569}';
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'kh-backdrop';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'kh-modal-title');
    wrap.innerHTML =
      '<div id="kh-modal">' +
        '<h2 id="kh-modal-title">Connect your AI engine</h2>' +
        '<p class="kh-desc">Enter your Anthropic API key to enable AI-powered analysis. Your key is saved only in this browser and never sent to our servers.</p>' +
        '<label for="kh-key-input">Anthropic API Key</label>' +
        '<input id="kh-key-input" type="password" placeholder="sk-ant-..." autocomplete="off" spellcheck="false">' +
        '<p class="kh-hint">No key yet? <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">Get one free at console.anthropic.com</a></p>' +
        '<div id="kh-key-error"></div>' +
        '<div class="kh-actions">' +
          '<button id="kh-save">Save &amp; Continue</button>' +
          '<button id="kh-cancel">Cancel</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    document.getElementById('kh-save').addEventListener('click', _onSave);
    document.getElementById('kh-cancel').addEventListener('click', _onCancel);
    document.getElementById('kh-key-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') _onSave();
      if (e.key === 'Escape') _onCancel();
    });
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) _onCancel();
    });
  }

  function _show() {
    var backdrop = document.getElementById('kh-backdrop');
    var input    = document.getElementById('kh-key-input');
    var error    = document.getElementById('kh-key-error');
    backdrop.classList.add('kh-open');
    input.value = '';
    error.style.display = 'none';
    setTimeout(function () { input.focus(); }, 60);
  }

  function _hide() {
    document.getElementById('kh-backdrop').classList.remove('kh-open');
  }

  function _onSave() {
    var input = document.getElementById('kh-key-input');
    var error = document.getElementById('kh-key-error');
    var key   = input.value.trim();
    if (!key.startsWith('sk-ant-')) {
      error.textContent = 'Anthropic keys must start with sk-ant-';
      error.style.display = 'block';
      input.focus();
      return;
    }
    localStorage.setItem(STORAGE_KEY, key);
    _hide();
    var res = _resolve;
    _resolve = null;
    _reject  = null;
    if (res) res(key);
  }

  function _onCancel() {
    _hide();
    var rej = _reject;
    _resolve = null;
    _reject  = null;
    if (rej) rej(new Error('cancelled'));
  }
})();
