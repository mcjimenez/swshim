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

  // To-DO!
  function sendMessageByIAC(evt) {
    debug("sendMessageByIAC not implemented yet!");
    // evt.data.uuid has the uuid of the port we should use to send the data...
    portTable[evt.data.uuid] && portTable[evt.data.uuid].postMessage(evt.data.data);
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
    return message.isConnectionRequest;
  };

  var getDefaultMsg = function() {
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
    debug('sendMessage...');
    navigator.serviceWorker.ready.then(sw => {
      debug('Got regs: ' + JSON.stringify(sw));
      debug('*** creating msg');
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
      debug('sending message ' + (sw.active?' sw active':'sw NO active'));
      sw.active && sw.active.postMessage(message);
      return aMessage.uuid;
    });
  };

  // TO-DO: Distinguish when a message from the SW is internal of navigator.connect or not
  function isInternalMessage(evt) {
    return evt.data.uuid;
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

  // Creating listener IAC
  var connectionsURL = [];

  function NavigatorConnectServerIAC() {
    var request = navigator.mozApps.getSelf();
    request.onsuccess = domReq => {
console.log("CJC Navigatorserver onsuccess");
      var app = domReq.target.result;
      var manifest  = app.manifest;
      if (!manifest || !manifest.connections) {
console.log("CJC navigatorserver no tiene connections no poner listener");
        connectionsURL = [];
        return;
      }
      for (var key in manifest.connections) {
        connectionsURL.push(key);
      }
      //only if we've defined connections we need to put the handler
      if (connectionsURL.length > 0) {
        navigator.mozSetMessageHandler('connection', this.onConnection.bind(this));
      }
    };
  }

  // To store the list of ports we've accepted... Note that at this point we're not multiplexing navigator.connect connections over IAC connections
  // Although we could do that also.
  var portTable = {};
  NavigatorConnectServerIAC.prototype = {
    inProgress: false,

    onConnection: function (request) {
console.log("CJC  navigatorServer onConnection -->");
      if (connectionsURL.indexOf(request.keyword) < 0) {
console.log("CJC  navigatorServer onConnection --> No keywords");
        return;
      }
      var port = this.port = request.port;
      // Send a connection request to the service worker
      var uuid = sendMessage({isConnectionRequest: true, originURL: "AddOriginURLHere", data: null});

      portTable[uuid] = port;
      port.onmessage = this.onmessage.bind(this, uuid);
      port.start();


    },

    onmessage: function(uuid, evt) {
console.log("CJC  navigatorServer onmessage --> dentro: " + uuid);
      if (this.inProgress) {
        return;
      }

      this.inProgress = true;
      sendMessage({originURL: "AddOriginURLHere", data: evt.data, uuid: uuid});
      this.inProgress = false;
    }
  };

  var svr = new NavigatorConnectServerIAC();

})(window);
