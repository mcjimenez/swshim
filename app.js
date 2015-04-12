'use strict';

(function() {

  function debug(str) {
    console.log("CJC APP -*-:" + str);
  }

  console.log('nos vamos a dar un castañazo');
  var a = 1, b = 0;
  return a/b;

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
