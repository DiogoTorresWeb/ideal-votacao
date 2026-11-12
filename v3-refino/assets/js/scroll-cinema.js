/**
 * "Filme" da rolagem da home: GSAP + ScrollTrigger (scrub, sem pin).
 * A rolagem em si é a nativa do navegador (sem Lenis nem listener de wheel).
 * Só roda se prefers-reduced-motion estiver desligado e as bibliotecas
 * carregarem (CDN pode falhar offline).
 * Sem motion, cada .reveal já é visível por padrão (ver base.css) —
 * a visibilidade nunca depende de JavaScript rodar com sucesso.
 */
(function () {
  "use strict";

  var html = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced || typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
    return;
  }

  html.classList.add("js", "motion");
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll("[data-scene]").forEach(function (scene) {
    var reveals = scene.querySelectorAll(".reveal");
    if (reveals.length) {
      gsap.to(reveals, {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: scene,
          start: "top 80%",
          end: "top 35%",
          scrub: 0.4,
        },
      });
    }

    var media = scene.querySelector(".scene-media img");
    if (media) {
      var momento = scene.hasAttribute("data-momento");
      var amount = momento ? 50 : 22;
      gsap.fromTo(
        media,
        { y: -amount },
        {
          y: amount,
          ease: "none",
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
      if (momento) {
        gsap.fromTo(
          media,
          { scale: 1.12 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: scene, start: "top bottom", end: "center center", scrub: true },
          }
        );
      }
    }
  });

  // Régua amarela de progresso no topo e filete do momento forte (decorativos: nada depende deles).
  gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
  var linha = document.querySelector(".momento-line");
  if (linha) {
    gsap.to(linha, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: linha, start: "top 85%", end: "top 40%", scrub: true },
    });
  }

  // Hero entra assim que a página carrega (não depende de rolagem).
  var heroReveals = document.querySelectorAll(".hero .reveal");
  if (heroReveals.length) {
    var introRunning = !!document.getElementById("intro");
    gsap.to(heroReveals, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power2.out",
      delay: introRunning ? 1.05 : 0.1,
    });
  }

  // Failsafe: nada pode ficar preso num estado oculto para sempre.
  var failsafeId = setTimeout(function () {
    html.classList.add("force-visible");
  }, 6000);

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      ScrollTrigger.refresh();
    }
  });

  window.addEventListener(
    "beforeunload",
    function () {
      clearTimeout(failsafeId);
    },
    { once: true }
  );
})();
