/**
 * JS mínimo do site (sem dependências).
 * 1) Espalha os dados de SITE_CONFIG pelos elementos [data-site].
 * 2) Abre/fecha o menu mobile.
 * 3) Alterna as abas Residencial / Empresas.
 * 4) Simula o envio do formulário de contato (sem backend ainda).
 */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};

  function isPlaceholder(value) {
    return !value || /^\[.*\]$/.test(value.trim());
  }

  function fillSiteData() {
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var key = el.getAttribute("data-site");
      if (cfg[key] !== undefined) {
        el.textContent = cfg[key];
      }
    });

    document.querySelectorAll("[data-site-href]").forEach(function (el) {
      var kind = el.getAttribute("data-site-href");
      var value = cfg[kind === "wa" ? "whatsapp" : kind];

      if (isPlaceholder(value)) {
        el.setAttribute("href", "#contato");
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("title", "Contato ainda não cadastrado (AV0)");
        return;
      }

      if (kind === "phone") el.setAttribute("href", "tel:" + value.replace(/\D/g, ""));
      if (kind === "email") el.setAttribute("href", "mailto:" + value);
      if (kind === "wa") el.setAttribute("href", "https://wa.me/" + value.replace(/\D/g, ""));
    });

    document.title = document.title.replace("{{SITE_NAME}}", cfg.name || "Ideal Elétrica");
  }

  function setupMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-menu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  function setupAudienceTabs() {
    var tabs = document.querySelectorAll(".audience-tab");
    if (!tabs.length) return;

    function activate(targetId) {
      tabs.forEach(function (t) {
        t.setAttribute("aria-selected", String(t.getAttribute("aria-controls") === targetId));
      });
      document.querySelectorAll(".audience-panel").forEach(function (panel) {
        panel.hidden = panel.id !== targetId;
      });
    }

    var hashTarget = window.location.hash.replace("#", "");
    if (hashTarget && document.getElementById(hashTarget)) {
      activate(hashTarget);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var targetId = tab.getAttribute("aria-controls");
        activate(targetId);
      });
    });
  }

  function setupContactForm() {
    var form = document.querySelector("#contact-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var feedback = form.querySelector(".form-feedback");
      if (feedback) {
        feedback.textContent =
          "Formulário ainda não está conectado a um e-mail/CRM (AV0). Por enquanto, fale pelo WhatsApp ou e-mail no topo desta página.";
        feedback.classList.add("is-visible");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillSiteData();
    setupMobileNav();
    setupAudienceTabs();
    setupContactForm();
  });
})();
