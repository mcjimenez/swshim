'use strict';

(function() {

  var count = 0;

  function debug(str) {
    console.log("CJC APP -*-:" + str);
  }

  console.log('nos vamos a dar un castañazo');

  if (!('serviceWorker' in navigator)) {
    debug('navigator has not ServiceWorker');
    return;
  }

  var register = function(evt) {
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
  };

  var unregister = function(evt) {
    debug('Unregister...');
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function (registration) {
        registration.unregister();
        debug('Unregister done');
      });
    });
  };

  // This should be in navigator_connect_shim_svr.js
  // When iac message is received this has to be executed
  var sendMessage = function () {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(reg => {
        reg.active && reg.active.postMessage({
          isFromIAC: true,
          data: "Hello from the main thread!",
          count: count++
        });
      });
    });
  };

  window.addEventListener('load', function () {
    debug("Document loaded!");
    var regBto = document.querySelector('#regBto');
    var unRegBto = document.querySelector('#unregBto');
    var sendMessageBto = document.querySelector('#sendMsgBto');
    regBto.addEventListener('click', register);
    unRegBto.addEventListener('click', unregister);
    sendMessageBto.addEventListener('click', sendMessage);
  });
})();
