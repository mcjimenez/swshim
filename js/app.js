'use strict';

function debug(str) {
  console.log("CJC APP -*-:" + str);
}

debug('Self: ' + (self?'EXISTS':'DOES NOT EXIST'));

(function() {

  if (!('serviceWorker' in navigator)) {
    debug('navigator has not ServiceWorker');
    return;
  }

  var register = function(evt) {
    debug('executing register...');
    navigator.serviceWorker.register('sw.js', {scope: './'}
    ).then(function(reg) {
      debug('Registration succeeded. Scope: ' + reg.scope);
      if (reg.installing) {
        debug('registration --> installing');
      } else if (reg.waiting) {
        debug('registration --> waiting');
      } else if (reg.active) {
        debug('registration --> active');
        debug('setting client\'s msg handler');
      }
      // Reload document... (yep sucks!)
      location.reload();
    }).catch(function(error) {
      debug('Registration failed with ' + error);
    });
  };

  var unregister = function(evt) {
    debug('Unregister...');
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => {
        reg.unregister();
        debug('Unregister done');
      });
    });
  };

  window.addEventListener('message', function(evt) {
    // This is shim specific (and wouldn't be needed if navigator.connect were native, or
    // MessageChannel worked!). If we want to process messages that come from our service
    // worker, we need to ignore the shim internal messages. So, dirty and quick:
    if (NCShim.isInternalMessage(evt)) {
      return;
    }

    // from this point on, you would write your handler as if the shim weren't present.
    debug('Msg recibido en app');
    for (var kk in evt) {
      debug("onMesssage -->:"+kk+":"+JSON.stringify(evt[kk]));
    }
  });

  window.addEventListener('load', function () {
    debug('Document loaded!');
    var regBto = document.querySelector('#regBto');
    var unRegBto = document.querySelector('#unregBto');
    var sendMessageBto = document.querySelector('#sendMsgBto');
    regBto.addEventListener('click', register);
    unRegBto.addEventListener('click', unregister);
    sendMessageBto.addEventListener('click', NCShim.sendMessage);
  });

})(self);
