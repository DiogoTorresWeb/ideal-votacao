/**
 * Intro de entrada da home. A coreografia é CSS (scroll-cinema.css); este
 * arquivo só trava a rolagem enquanto ela roda, deixa pular (clique em
 * qualquer lugar ou qualquer tecla) e limpa tudo no fim.
 * Só age se o script inline do <head> marcou html.intro-pending.
 */
(function () {
  "use strict";

  var html = document.documentElement;
  var intro = document.getElementById("intro");
  if (!intro) return;

  if (!html.classList.contains("intro-pending")) {
    intro.remove();
    return;
  }

  var done = false;
  var leaving = false;
  document.body.style.overflow = "hidden";

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(failsafeId);
    document.removeEventListener("keydown", skip, true);
    intro.removeEventListener("click", skip);
    document.body.style.overflow = "";
    html.classList.remove("intro-pending");
    if (intro.parentNode) intro.remove();
    try { html.dispatchEvent(new CustomEvent("ie:intro-done")); } catch (e) {}
  }

  function skip(e) {
    if (leaving || done) return;
    leaving = true;
    intro.classList.add("is-leaving");
  }

  // Fim natural (intro-out) ou fim do "pular" disparam a limpeza.
  intro.addEventListener("animationend", function (e) {
    if (e.target === intro && /^intro-(skip-)?out$/.test(e.animationName)) finish();
  });
  intro.addEventListener("click", skip);
  document.addEventListener("keydown", skip, true);

  // Rede de segurança: a coreografia dura ~1,8s; nunca passa de 2,5s.
  var failsafeId = setTimeout(finish, 2500);
})();
