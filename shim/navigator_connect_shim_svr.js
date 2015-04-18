'use strict';

function debug(str) {
  console.log("CJC -*- -->" + str);
}

debug('SHIM SVR !! Loaded navigator_connect_shim_svr.js');

(function(exports) {

  if (window.NCShim) {
    debug('window.NCShim ya existe');
    return;
  }

  var cltCount = 0;
  var ORIGN = 'clt';

  var connections = {};
  var handlerSet = false;
  var navConnServerIAC = null;

  // To store the list of ports we've accepted... Note that at this point we're not multiplexing navigator.connect connections over IAC connections
  // Although we could do that also.
  var portTable = {};


  function generateNewUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
      function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    debug('SHIM SVR generateNewUUID(): ' + uuid);
    return uuid;
  }

  // To-DO!
  function sendMessageByIAC(evt) {
    debug("sendMessageByIAC not implemented yet!");
    // evt.data.uuid has the uuid of the port we should use to send the data...
    portTable[evt.data.uuid] && portTable[evt.data.uuid].postMessage(evt.data.data);
  }

  function registerHandlers() {
    debug('SHIM SVR -- registerHandlers');
    navConnServerIAC = NavigatorConnectServerIAC.getInstance();

    debug('SHIM SVR registering a apps handlers');
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

  // Returns true if the message (from IAC) is a connection request,
  // false otherwise.
  var isConnectionRequest = function(message) {
    debug('SHIM SVR - isConnectionRequest:' + message.isConnectionRequest);
    return message.isConnectionRequest;
  };

  var getDefaultMsg = function() {
    debug('SHIM SVR - getDefaultMsg');
    return {
      isConnectionRequest: true,
      data: {
        data: "Hello from the main thread!",
        count: cltCount++
      },
      originURL: "We need an origin URL here!"
    };
  };

  // Msg from app to sw.
  // aMessage can have, as optional fields:
  // isConnectionRequest: True if it's a connection request, false if it's a message
  // data: The data from the originator
  // uuid: The uuid of the virtual channel to use, or null/undefined to create a new channel
  // and as a MANDATORY field:
  // originURL: The originator of the message
  var sendMessage = function(aMessage) {
    return new Promise((resolve, reject) => {
      debug('SHIM SVR sendMessage...' + (aMessage ? JSON.stringify(aMessage):'No received msg to send'));
      navigator.serviceWorker.ready.then(sw => {
        debug('SHIM SVR Got regs: ' + JSON.stringify(sw));
        debug('SHIM SVR creating msg');
        // We must construct a structure here to indicate our sw partner that
        aMessage = aMessage || getDefaultMsg();
        aMessage.uuid = aMessage.uuid || generateNewUUID();

        var message = {
          isFromIAC: true,
          isConnectionRequest: isConnectionRequest(aMessage),
          uuid: aMessage.uuid,
          dataToSend: aMessage.data
        };
        // This sends the message data as well as transferring messageChannel.port2 to the service worker.
        // The service worker can then use the transferred port to reply via postMessage(), which
        // will in turn trigger the onmessage handler on messageChannel.port1.
        // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
        debug('SHIM SVR sending message ' + (sw.active?' sw active':'sw NO active'));
        sw.active && sw.active.postMessage(message);
        resolve(aMessage.uuid);
      });
    });
  };

  // TO-DO: Distinguish when a message from the SW is internal of navigator.connect or not
  function isInternalMessage(evt) {
    return evt.data.uuid;
  };

  // Creating listener IAC
  var NavigatorConnectServerIAC = (function() {
    var instance = null;

    function IAC() {
      debug('SHIM - SVR --> fc IAC');
      this.connectionsURL = [];

      var request = navigator.mozApps.getSelf();
      request.onsuccess = domReq => {
        debug('SHIM SVR - NavigatorConnectServerIAC - onsuccess getSelf');
        var app = domReq.target.result;
        var manifest  = app.manifest;
        if (!manifest || !manifest.connections) {
          debug('SHIM SVR navigatorserver no tiene connections no poner listener');
          this.connectionsURL = [];
        }
        for (var key in manifest.connections) {
          this.connectionsURL.push(key);
        }
        //only if we've defined connections we need to put the handler
        if (this.connectionsURL.length > 0) {
          navigator.mozSetMessageHandler('connection', this.onConnection.bind(this));
        }
      };
    }

    IAC.prototype = {
      inProgress: false,

      onConnection: function (request) {
        debug('SHIM SVR -NavigatorConnectServerIAC- onConnection -->');
        if (this.connectionsURL.indexOf(request.keyword) < 0) {
          debug('SHIM SVR no urls registered');
          return;
        }
        var port = this.port = request.port;
        debug('SHIM SVR IAC Sending conexion msg');
        // Send a connection request to the service worker
        sendMessage({ isConnectionRequest: true,
                      originURL: "AddOriginURLHere",
                      data: null}).then(uuid => {
          debug('SHIM SVR enviado msg de conexion --> uuid:' + uuid);
          portTable[uuid] = port;
          port.onmessage = this.onmessage.bind(this, uuid);
          port.start();
        });
      },
      onmessage: function(uuid, evt) {
        debug('SHIM SVR navigatorServer onmessage --> dentro: ' + uuid);
        if (this.inProgress) {
          return;
        }

        this.inProgress = true;
        sendMessage({originURL: "AddOriginURLHere", data: evt.data, uuid: uuid});
        this.inProgress = false;
      }
    };

    return {
      getInstance: function() {
        if (!instance) {
          debug('SHIM SVR instancia IAC no creada');
          instance = new IAC();
        }
        debug('SHIM SVR devolver instancia');
        return instance;
      }
    };
  })();

  debug('SHIM SVR antes registrar  handlers');
  navigator.serviceWorker.ready.then(registerHandlers);
  debug('SHIM SVR despues registrar  handlers');

  // This whole object should not be needed, except for tests, if MessageChannel did work.
  // Since it doesn't work for Service Workers, it's needed, sadly.
  exports.NCShim = {
    // sendMessage exported only for tests!
    sendMessage: sendMessage,
    // And this is needed only because MessageChannel doesn't currently work!
    isInternalMessage: isInternalMessage
  };

})(window);
