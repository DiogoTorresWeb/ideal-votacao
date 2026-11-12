/**
 * Camada de medição: GA4, Google Ads e Pixel da Meta.
 *
 * Regras:
 *  (1) nada de terceiro carrega sem consentimento (Consent Mode v2 + IE_CONSENT);
 *  (2) ID vazio, entre [colchetes] ou com formato inválido: essa ferramenta não carrega,
 *      mesmo se a pessoa aceitar o aviso;
 *  (3) nenhum dado pessoal (nome, telefone, e-mail, mensagem) entra no evento;
 *  (4) se este arquivo não carregar, o site funciona igual (falha aberta).
 *  Como preencher os IDs: MEDICAO.md
 */
(function () {
  "use strict";

  var w = window;
  var d = document;

  function inFrame() {
    try { return w.self !== w.top; } catch (e) { return true; }
  }

  function isReadyId(value, re) {
    if (typeof value !== "string") return "";
    var v = value.trim();
    if (!v || /^\[.*\]$/.test(v)) return "";
    return re.test(v) ? v : "";
  }

  var raw = (w.SITE_CONFIG && w.SITE_CONFIG.measurement) || {};
  var IDS = {
    ga4: isReadyId(raw.ga4, /^G-[A-Z0-9]+$/i),
    ads: isReadyId(raw.googleAds, /^AW-[0-9]+$/),
    adsLabel: isReadyId(raw.googleAdsLabel, /^[A-Za-z0-9_-]+$/),
    meta: isReadyId(raw.metaPixel, /^[0-9]{5,20}$/)
  };

  var loaded = { gtagjs: false, ga4: false, ads: false, meta: false };

  function inject(src) {
    var s = d.createElement("script");
    s.async = true;
    s.src = src;
    d.head.appendChild(s);
  }

  function ensureGtag(idForSrc) {
    if (loaded.gtagjs) return;
    loaded.gtagjs = true;
    inject("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(idForSrc));
    if (typeof w.gtag !== "function") {
      w.dataLayer = w.dataLayer || [];
      w.gtag = function () { w.dataLayer.push(arguments); };
    }
    w.gtag("js", new Date());
  }

  function loadMeta(id) {
    if (w.fbq) return;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(w, d, "script", "https://connect.facebook.net/en_US/fbevents.js");
    w.fbq("init", id);
    w.fbq("track", "PageView");
  }

  function loadTools(state) {
    if (IDS.ga4 && state.analytics) {
      ensureGtag(IDS.ga4);
      if (!loaded.ga4) {
        loaded.ga4 = true;
        w.gtag("config", IDS.ga4, { anonymize_ip: true, send_page_view: true });
      }
    }
    if (IDS.ads && state.marketing) {
      ensureGtag(IDS.ads);
      if (!loaded.ads) {
        loaded.ads = true;
        w.gtag("config", IDS.ads);
      }
    }
    if (IDS.meta && state.marketing && !loaded.meta) {
      loaded.meta = true;
      loadMeta(IDS.meta);
    }
  }

  function wipeThirdParty() {
    try { if (w.fbq) w.fbq("consent", "revoke"); } catch (e) {}
    var host = location.hostname;
    var parts = host.split(".");
    var domains = ["", host, "." + host];
    if (parts.length >= 2) domains.push("." + parts.slice(-2).join("."));
    d.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim();
      if (!/^(_ga|_gid|_gat|_gcl|_gac|_fbp|_fbc)/.test(n)) return;
      domains.forEach(function (dom) {
        d.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (dom ? "; domain=" + dom : "");
      });
    });
  }

  function applyState(state) {
    state = state || { analytics: false, marketing: false };
    var downgrade =
      (loaded.ga4 && !state.analytics) ||
      ((loaded.ads || loaded.meta) && !state.marketing);
    if (downgrade) {
      wipeThirdParty();
      location.reload();
      return;
    }
    loadTools(state);
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  var META = { click_whatsapp: "Contact", click_phone: "Contact", generate_lead: "Lead" };

  function track(name, params) {
    var state = w.IE_CONSENT && w.IE_CONSENT.get ? w.IE_CONSENT.get() : { analytics: false, marketing: false };
    var p = params || {};
    /* só metadados de uso — nunca nome, telefone, e-mail ou mensagem */
    if (IDS.ga4 && state.analytics && loaded.ga4 && typeof w.gtag === "function") {
      w.gtag("event", name, p);
    }
    if (IDS.ads && IDS.adsLabel && state.marketing && loaded.ads && name === "generate_lead" && typeof w.gtag === "function") {
      w.gtag("event", "conversion", { send_to: IDS.ads + "/" + IDS.adsLabel });
    }
    if (IDS.meta && state.marketing && loaded.meta && w.fbq && META[name]) {
      w.fbq("track", META[name], {}, { eventID: uid() });
    }
  }

  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a,button");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var kind = a.getAttribute("data-site-href") || "";
    if (kind === "wa" || /wa\.me|api\.whatsapp/.test(href)) {
      track("click_whatsapp", { method: "whatsapp" });
    } else if (kind === "phone" || /^tel:/i.test(href)) {
      track("click_phone", { method: "phone" });
    }
  }, true);

  d.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || form.id !== "contact-form") return;
    track("generate_lead", { form_id: "contact-form" });
  });

  if (inFrame()) return;
  if (!w.IE_CONSENT || typeof w.IE_CONSENT.get !== "function") return;

  w.IE_CONSENT.onChange(applyState);
  applyState(w.IE_CONSENT.get());
})();
