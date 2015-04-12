'use strict';

(function() {

  function debug(str) {
    console.log("CJC APP -*-:" + str);
  }

  debug('nos vamos a dar un castañazo');

  if (!('serviceWorker' in navigator)) {
    debug('navigator has not ServiceWorker');
    return;
  }

  var regBto = document.querySelector('#regBto');
  regBto.addEventListener('click', function(evt) {
    debug('executing register...');
    navigator.serviceWorker.register('sw.js', {scope: '/swshim/'}
      ).then(function(reg) {
        debug('Registration succeeded. Scope: ' + reg.scope);
        if (reg.installing) {
          debug('registration --> installing');
        } else if (reg.waiting) {
          debug('registration --> waiting');
        } else if (reg.active) {
          debug('registration --> active');
        }
      }).catch(function(error) {
        debug('Registration failed with ' + error);
      });
  });
})();
