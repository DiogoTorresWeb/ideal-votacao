/**
 * Intro de entrada: a logo aparece centralizada e viaja até o centro
 * do cabeçalho, virando-o. Só na primeira visita (sessionStorage),
 * no máximo ~1,5s, sempre pulável. Falha graciosamente: sem GSAP,
 * sem storage ou com prefers-reduced-motion, a intro só some.
 */
(function () {
  "use strict";

  var intro = document.getElementById("intro");
  if (!intro) return;

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var seen = true;
  try {
    seen = sessionStorage.getItem("ie_intro_seen") === "1";
  } catch (e) {
    seen = false;
  }

  if (seen || prefersReduced) {
    intro.remove();
    return;
  }

  try {
    sessionStorage.setItem("ie_intro_seen", "1");
  } catch (e) {
    /* storage indisponível (ex.: navegação privada): segue sem persistir */
  }

  var logo = document.getElementById("intro-logo");
  var skipBtn = document.getElementById("intro-skip");
  var targetImg = document.querySelector(".header .brand .logo-svg");
  var done = false;

  document.body.style.overflow = "hidden";

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(failsafeId);
    document.body.style.overflow = "";
    if (intro.parentNode) intro.remove();
  }

  var failsafeId = setTimeout(finish, 1500);

  function run() {
    if (!targetImg || typeof window.gsap === "undefined") {
      finish();
      return;
    }

    var targetRect = targetImg.getBoundingClientRect();

    gsap.set(logo, { scale: 1 });
    var tl = gsap.timeline({ onComplete: finish });
    tl.to(logo, { duration: 0.1, opacity: 1 })
      .to(
        logo,
        {
          duration: 0.8,
          ease: "power3.inOut",
          scale: targetRect.width / 96,
          x: targetRect.left + targetRect.width / 2 - window.innerWidth / 2,
          y: targetRect.top + targetRect.height / 2 - window.innerHeight / 2,
        },
        0.15
      )
      .to(intro, { duration: 0.35, opacity: 0 }, "-=0.25");

    function skip() {
      tl.progress(1);
    }
    skipBtn.addEventListener("click", skip);
    document.addEventListener("keydown", function onKey(e) {
      document.removeEventListener("keydown", onKey);
      skip();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
