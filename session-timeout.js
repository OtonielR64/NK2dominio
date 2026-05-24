// Cierre automático por inactividad — solo rol visor (6 minutos)
(function () {
  if (localStorage.getItem('nk2_role') !== 'visor') return;

  const TIMEOUT_MS = 6 * 60 * 1000;
  let timer;

  function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      localStorage.removeItem('nk2_role');
      location.replace('login.html');
    }, TIMEOUT_MS);
  }

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, resetTimer, { passive: true });
  });

  resetTimer();
})();
