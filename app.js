'use strict';

(function() {

  function debug(str) {
    console.log("CJC APP -*-:" + str);
  }

  if (!('serviceWorker' in navigator)) {
    debug('navigator has not ServiceWorker');
  }

  var regBto = document.querySelector('#regBto');
  regBto.addEventListener('click', function(evt) {
    navigator.serviceWorker.register('sw.js', {scope: './'}
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
