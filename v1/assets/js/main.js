/**
 * JS mínimo do site (sem dependências), compartilhado por todas as páginas.
 * 1) Espalha os dados de SITE_CONFIG pelos elementos [data-site].
 * 2) Abre/fecha o menu em tela cheia.
 * 3) Alterna as abas Residencial / Empresas.
 * 4) Formulário de contato: monta o texto e abre o WhatsApp (sem backend).
 * 5) Header ganha sombra só depois que a página rola (IntersectionObserver,
 *    nunca scroll listener).
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

      if (kind === "wa") {
        if (isPlaceholder(cfg.whatsappLink)) {
          el.setAttribute("href", "#contato");
          el.setAttribute("aria-disabled", "true");
          return;
        }
        el.setAttribute("href", cfg.whatsappLink);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
        return;
      }

      var value = cfg[kind];
      if (isPlaceholder(value)) {
        el.setAttribute("href", "#contato");
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("title", "Contato ainda não cadastrado");
        return;
      }

      if (kind === "phone") el.setAttribute("href", "tel:" + value.replace(/\D/g, ""));
      if (kind === "email") el.setAttribute("href", "mailto:" + value);
    });

    document.title = document.title.replace("{{SITE_NAME}}", cfg.name || "Ideal Elétrica");
  }

  function setupMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-menu");
    if (!toggle || !menu) return;
    var closeBtn = menu.querySelector(".mobile-menu-close");

    function setOpen(isOpen) {
      menu.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setOpen(false);
      });
    }

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function setupHeaderScrollState() {
    var header = document.querySelector(".header");
    var sentinel = document.getElementById("scroll-sentinel");
    if (!header || !sentinel || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        header.classList.toggle("is-scrolled", !entries[0].isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
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
        activate(tab.getAttribute("aria-controls"));
      });
    });
  }

  function setupContactForm() {
    var form = document.querySelector("#contact-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var nome = (form.nome && form.nome.value || "").trim();
      var whatsapp = (form.whatsapp && form.whatsapp.value || "").trim();
      var cidade = (form.cidade && form.cidade.value || "").trim();
      var servico = form.servico ? form.servico.options[form.servico.selectedIndex].text : "";
      var mensagem = (form.mensagem && form.mensagem.value || "").trim();

      var linhas = [
        "Olá, vim pelo site e quero um orçamento.",
        "Nome: " + nome,
        "WhatsApp: " + whatsapp,
        cidade ? "Cidade/bairro: " + cidade : null,
        "Serviço: " + servico,
        "Mensagem: " + mensagem,
      ].filter(Boolean);

      var numero = (cfg.whatsapp || "").replace(/\D/g, "");
      var feedback = form.querySelector(".form-feedback");

      if (!numero) {
        if (feedback) {
          feedback.textContent = "WhatsApp ainda não cadastrado. Veja o telefone no topo da página.";
          feedback.classList.add("is-visible");
        }
        return;
      }

      var link = "https://wa.me/" + numero + "?text=" + encodeURIComponent(linhas.join("\n"));
      window.open(link, "_blank", "noopener");

      if (feedback) {
        feedback.textContent = "Abrindo o WhatsApp numa nova aba com sua mensagem pronta.";
        feedback.classList.add("is-visible");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillSiteData();
    setupMobileNav();
    setupHeaderScrollState();
    setupAudienceTabs();
    setupContactForm();
  });
})();
