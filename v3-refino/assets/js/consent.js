/**
 * Faixa de consentimento (LGPD + guia de cookies da ANPD) e Consent Mode v2.
 *
 * Regras:
 *  (1) analítica e marketing começam negados; nada de terceiro é carregado aqui;
 *  (2) aceitar e recusar têm o mesmo peso visual;
 *  (3) a escolha fica em localStorage (ie_consent_v1) e pode ser mudada no rodapé;
 *  (4) este arquivo só guarda a escolha e avisa o Consent Mode. O carregamento
 *      de GA4, Google Ads e Meta Pixel fica para a camada de medição, que só
 *      deve ligar as ferramentas depois do consentimento e com ID preenchido;
 *  (5) se este arquivo não carregar, o site funciona igual (falha aberta);
 *  (6) a faixa não aparece dentro de iframe (página de votação).
 */
(function () {
  "use strict";

  var w = window;
  var d = document;
  var KEY = "ie_consent_v1";
  var MAX_AGE = 365 * 864e5; /* 12 meses; renovar o pedido depois disso */
  var listeners = [];

  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== "function") {
    w.gtag = function () { w.dataLayer.push(arguments); };
  }

  var consent = { analytics: false, marketing: false };

  function inFrame() {
    try { return w.self !== w.top; } catch (e) { return true; }
  }

  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && typeof c.a === "boolean" && typeof c.m === "boolean" && c.t && (Date.now() - c.t) < MAX_AGE) {
        return c;
      }
    } catch (e) {}
    return null;
  }

  function writeConsent(a, m) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ a: a, m: m, t: Date.now() }));
    } catch (e) {}
  }

  function updateConsentMode(a, m) {
    w.gtag("consent", "update", {
      analytics_storage: a ? "granted" : "denied",
      ad_storage: m ? "granted" : "denied",
      ad_user_data: m ? "granted" : "denied",
      ad_personalization: m ? "granted" : "denied"
    });
  }

  function notify() {
    var state = { analytics: consent.analytics, marketing: consent.marketing };
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) {}
    });
    try {
      d.documentElement.dispatchEvent(new CustomEvent("ie:consent", { detail: state }));
    } catch (e) {}
  }

  function closeBanner(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    d.documentElement.classList.remove("has-cmp");
  }

  function apply(a, m, el) {
    consent.analytics = !!a;
    consent.marketing = !!m;
    writeConsent(consent.analytics, consent.marketing);
    updateConsentMode(consent.analytics, consent.marketing);
    closeBanner(el);
    notify();
  }

  function banner(prefill) {
    closeBanner(d.querySelector(".cmp"));
    var el = d.createElement("div");
    el.className = "cmp";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "false");
    el.setAttribute("aria-labelledby", "cmp-title");
    el.setAttribute("aria-describedby", "cmp-desc");
    el.innerHTML =
      '<div class="cmp__copy">' +
        '<p class="cmp__t" id="cmp-title">Cookies e medição</p>' +
        '<p class="cmp__d" id="cmp-desc">Usamos armazenamento necessário para o site funcionar. Analítica e marketing só ligam se você aceitar. Você pode recusar ou escolher por categoria, e mudar depois no rodapé.</p>' +
      "</div>" +
      '<div class="cmp__set" hidden>' +
        "<label><input type=\"checkbox\" checked disabled> Necessários <span>sempre ativos, para o site e para lembrar desta escolha</span></label>" +
        "<label><input type=\"checkbox\" id=\"cmpA\"> Analítica <span>medir visitas e uso do site</span></label>" +
        "<label><input type=\"checkbox\" id=\"cmpM\"> Marketing <span>medir campanhas e anúncios</span></label>" +
      "</div>" +
      '<div class="cmp__b">' +
        '<button type="button" class="btn btn-outline" data-cmp="no">Recusar</button>' +
        '<button type="button" class="btn btn-ghost" data-cmp="set">Ajustes</button>' +
        '<button type="button" class="btn btn-outline" data-cmp="yes">Aceitar tudo</button>' +
      "</div>" +
      '<p class="cmp__l"><a href="cookies.html">Política de cookies</a></p>';

    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cmp]");
      if (!b) return;
      var k = b.getAttribute("data-cmp");
      if (k === "yes") apply(true, true, el);
      else if (k === "no") apply(false, false, el);
      else if (k === "set") {
        var s = el.querySelector(".cmp__set");
        if (s.hidden) {
          s.hidden = false;
          b.textContent = "Salvar escolhas";
          b.classList.remove("btn-ghost");
          b.classList.add("btn-outline");
          if (prefill) {
            el.querySelector("#cmpA").checked = !!prefill.a;
            el.querySelector("#cmpM").checked = !!prefill.m;
          }
        } else {
          apply(el.querySelector("#cmpA").checked, el.querySelector("#cmpM").checked, el);
        }
      }
    });

    d.body.appendChild(el);
    d.documentElement.classList.add("has-cmp");
  }

  function openPreferences() {
    var saved = readConsent();
    banner(saved ? { a: saved.a, m: saved.m } : null);
    var setBtn = d.querySelector(".cmp [data-cmp='set']");
    if (setBtn) setBtn.click();
  }

  w.IE_CONSENT = {
    key: KEY,
    get: function () { return { analytics: consent.analytics, marketing: consent.marketing }; },
    open: openPreferences,
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); }
  };

  d.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-cmp-open]")) {
      e.preventDefault();
      openPreferences();
    }
  });

  if (inFrame()) return;

  var saved = readConsent();
  if (saved) {
    consent.analytics = saved.a;
    consent.marketing = saved.m;
    updateConsentMode(consent.analytics, consent.marketing);
  }

  var force = false;
  try { force = new URLSearchParams(location.search).has("cookies"); } catch (e) {}

  function showWhenIdle() {
    if (force) {
      openPreferences();
      return;
    }
    if (saved || d.querySelector(".cmp")) return;
    banner();
  }

  function afterIntro(fn) {
    if (!d.documentElement.classList.contains("intro-pending")) {
      setTimeout(fn, 360);
      return;
    }
    var done = false;
    var go = function () {
      if (done) return;
      done = true;
      setTimeout(fn, 200);
    };
    d.documentElement.addEventListener("ie:intro-done", go, { once: true });
    setTimeout(go, 2800);
  }

  var start = function () { afterIntro(showWhenIdle); };
  if (d.readyState === "complete") start();
  else w.addEventListener("load", start);
})();
