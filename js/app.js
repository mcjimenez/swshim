'use strict';

function debug(str) {
  console.log("CJC -*-:" + str);
}

debug('APP carga app.js');

(function() {

  var register = function(evt) {
    debug('APP executing register...');
    navigator.serviceWorker.register('/swshim/sw.js', {scope: './'}
    ).then(function(reg) {
      debug('APP Registration succeeded. Scope: ' + reg.scope);
      if (reg.installing) {
        debug('APP registration --> installing');
	      // Reload document... (yep sucks!)
	      location.reload();
      } else if (reg.waiting) {
        debug('APP registration --> waiting');
      } else if (reg.active) {
        debug('APP registration --> active');
        debug('APP setting client\'s msg handler');
      }
    }).catch(function(error) {
      debug('APP Registration failed with ' + error);
    });
  };

  var unregister = function(evt) {
    debug('APP Unregister...');
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => {
        reg.unregister();
        debug('APP Unregister done');
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
    debug('APP Msg recibido en app');
    for (var kk in evt) {
      debug('APP onMesssage -->:' + kk + ':' + JSON.stringify(evt[kk]));
    }
  });

  if ('serviceWorker' in navigator) {
    debug('APP serviceWorker in navigator');
    register();
  } else {
    debug('APP navigator has not ServiceWorker');
    return;
  }

  function connectionMSg() {
    var event = new CustomEvent('connection', { 'detail': 'noDAtas'});
    window.dispatchEvent(event);
  }

  // Testing purpose only!!!!
  window.addEventListener('load', function () {
    debug('APP Document loaded! --> registrar handlers de prueba');
    var regBto = document.querySelector('#regBto');
    var unRegBto = document.querySelector('#unregBto');
    var sendMessageBto = document.querySelector('#sendMsgBto');
    var connBto = document.querySelector('#connMsgMto');
    regBto.addEventListener('click', register);
    unRegBto.addEventListener('click', unregister);
    sendMessageBto.addEventListener('click', NCShim.sendMessage.bind(null, undefined));
    connBto.addEventListener('click', connectionMSg);
  });

})(self);
