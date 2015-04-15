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

  function sendMessageByIAC(evt) {
    debug("sendMessageByIAC not implemented yet!");
  }


  function registerHandlers() {
    debug('registering a apps handlers');
    navigator.serviceWorker.addEventListener('message', evt => {
      if (!isInternalMessage(evt)) {
        return;
      }
      console.log('*** APP***  recibe un msg!!');
      console.log('APP? Msg recibido en app --> ' + JSON.stringify(evt.data));
      // Here we have to pass this message to the other side of the IAC connection...
      sendMessageByIAC(evt);
    });
  }

  var handlerSet = false;

  // Returns true if the message (from IAC) is a connection request,
  // false otherwise.
  var isConnectionRequest = function(message) {
    return true;
  };

  // Msg from app to sw
  var sendMessage = function(aMessage) {
    debug('sendMessage...');
    navigator.serviceWorker.ready.then(sw => {
      debug('Got regs: ' + JSON.stringify(sw));
      debug('*** creating msg');
      // We must construct a structure here to indicate our sw partner that
      aMessage = aMessage || {
          data: "Hello from the main thread!",
          count: cltCount++,
          org: ORIGN
      };

      var message = {
        isFromIAC: true,
        isConnectionRequest: isConnectionRequest(aMessage),
        uuid: generateNewUUID(),
        dataToSend: aMessage
      };
      // This sends the message data as well as transferring messageChannel.port2 to the service worker.
      // The service worker can then use the transferred port to reply via postMessage(), which
      // will in turn trigger the onmessage handler on messageChannel.port1.
      // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
      debug('sending message ' + (sw.active?' sw active':'sw NO active'));
      sw.active && sw.active.postMessage(message);
    });
  };

  function isInternalMessage(evt) {
    return true;
  };


  navigator.serviceWorker.ready.then(registerHandlers);

  // This whole object should not be needed, except for tests, if MessageChannel did work.
  // Since it doesn't work for Service Workers, it's needed, sadly.
  exports.NCShim = {
    // sendMessage exported only for tests!
    sendMessage: sendMessage,
    // And this is needed only because MessageChannel doesn't currently work!
    isInternalMessage: isInternalMessage
  };

})(window);
