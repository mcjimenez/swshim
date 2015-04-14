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
        // When sw is really installed we'll be ready to proccess message
        self.registerHandlers();
      }
      // Reload document... (yep sucks!)
      location.reload();
    }).catch(function(error) {
      debug('Registration failed with ' + error);
    });
  };

  // If you want receive datas from sw implement this function
  var msgFromSW = function(evt) {
    debug('data from sw:' + JSON.stringify(evt));
  };

  // If you want send Data to a sw implement this function
  var msgToSW = function(evt) {
    debug('Data to SW:' + JSON.stringify(evt));
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
    sendMessageBto.addEventListener('click', self.sendMessage);
  });

})(self);
