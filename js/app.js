'use strict';

function debug(str) {
  console.log("CJC -*-:" + str);
}

(function() {
  // This is a very basic sample app that uses a SW and acts as a server for
  // navigator.connect. I'm going to mark with a comment where the app MUST
  // add some extra code to use the navigator.connect SHIM
  // So if you just want to know that, search for:
  // ADDED FOR SHIM

  var register = function(evt) {
    debug('APP executing register...');
    navigator.serviceWorker.register('/swshim/sw.js', {scope: './'}
    ).then(function(reg) {
      debug('APP Registration succeeded. Scope: ' + reg.scope);
      if (reg.installing) {
        debug('APP registration --> installing');
	      // Reload document... (yep sucks!)
        // ADDED FOR SHIM: This is needed because the shim needs to have the
        // SW ready to work, and that does not happen the first time it's
        // installed
        //	      location.reload();
        // END ADDED FOR SHIM
      } else if (reg.waiting) {
        debug('APP registration --> waiting');
      } else if (reg.active) {
        debug('APP registration --> active');
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

  var processSWRequest = function(channel, evt) {
    // Your code here
    // from this point on, you would write your handler as if the shim wasn't
    // present.
    var sett = evt.data.setting;
    if (!sett) {
      // Return no setting msg
      return;
    }

    var _settings = navigator.mozSettings;
    _settings.createLock().get(sett).then(result => {
      debug('APP value: ' + result[sett] + ' send to sw');
      channel.postMessage({'setting': sett,
                           'value': result[sett]});
    });
  };

  if ('serviceWorker' in navigator) {
    debug('APP serviceWorker in navigator');
    register();
    navigator.serviceWorker.ready.then(sw => {
      // Let's pass the SW some way to talk to us...
      var mc = new MessageChannel();
      mc.port1.onmessage = processSWRequest.bind(this, mc.port1);
      sw.active && sw.active.postMessage({}, [mc.port2]);
    });
  } else {
    debug('APP navigator does not have ServiceWorker');
    return;
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
    sendMessageBto.addEventListener('click',
      { appicon : 'app://sms.gaiamobile.org/style/icons/sms_126.png'});
  });

})(self);
