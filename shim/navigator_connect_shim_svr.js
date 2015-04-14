'use strict';

function debug(str) {
  console.log("CJC SHIM SVR.js -*- -->" + str);
}

debug('!! Loaded navigator_connect_shim_svr.js');
debug('Self: ' + (self?'EXISTS':'DOES NOT EXIST'));

(function(exports) {

  var cltCount = 0;
  var ORIGN = 'clt';

  var connections = {};

  function generateNewUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
      function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    debug('generateNewUUID(): ' + uuid);
    return uuid;
  }

  function sendMessageByIAC() {
    debug("sendMessageByIAC not implemented yet!");
  }


  function registerHandlers() {
    debug('registering a apps handlers');
    navigator.serviceWorker.addEventListener('message', evt => {
      console.log('*** APP***  recibe un msg!!');
      console.log('APP? Msg recibido en app --> ' + JSON.stringify(evt.data));
      // Here we have to pass this message to the other side of the IAC connection...
      sendMessageByIAC();
    });
  }

  var handlerSet = false;

  // Msg from app to sw
  var sendMessage = function () {
    debug('sendMessage...');
    navigator.serviceWorker.ready.then(sw => {
      debug('Got regs: ' + JSON.stringify(sw));
      debug('*** creating msg');
      // We must construct a structure here to indicate our sw partner that
      var message = {
        isFromIAC: true,
        isConnectionRequest: true,
        uuid: generateNewUUID(),
        dataToSend: {
          data: "Hello from the main thread!",
          count: cltCount++,
          org: ORIGN
        }
      };
      // This sends the message data as well as transferring messageChannel.port2 to the service worker.
      // The service worker can then use the transferred port to reply via postMessage(), which
      // will in turn trigger the onmessage handler on messageChannel.port1.
      // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
      debug('sending message ' + (sw.active?' sw active':'sw NO active'));
      sw.active && sw.active.postMessage(message);
    });
  };

  exports.sendMessage = sendMessage;
  exports.registerHandlers = registerHandlers;

})(self);
