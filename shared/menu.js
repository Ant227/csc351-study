'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var toggleBtn = document.getElementById('menu-toggle');
    var closeBtn  = document.getElementById('menu-close');
    var backdrop  = document.getElementById('menu-backdrop');
    var drawer    = document.getElementById('menu-drawer');

    if (toggleBtn && closeBtn && backdrop && drawer) {
      toggleBtn.addEventListener('click', function () {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      });

      var closeMenu = function () {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
      };

      closeBtn.addEventListener('click', closeMenu);
      backdrop.addEventListener('click', closeMenu);
    }
  });
})();
