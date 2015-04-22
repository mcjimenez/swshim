'use strict';

(function(exports) {

  if (exports.NCShim) {
    return;
  }

  function debug(str) {
    console.log("CJC -*- -->" + str);
  }

  var cltCount = 0;

  var connections = {};
  var handlerSet = false;

  // To store the list of ports we've accepted... Note that at this point we're
  // not multiplexing navigator.connect connections over IAC connections
  // Although we could do that also.
  var portTable = {};

  // Generates an UUID. This function is not cryptographically robust, but at
  // this moment this doesn't matter that much.
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

  // Sends a message received from the service worker to the client of the
  // connection using IAC as the transport mechanism
  function sendMessageByIAC(uuid, message) {
    debug("SHIM SVR sendMessageByIAC. UUID:" + uuid + ", data: " +
          JSON.stringify(message));
    // evt.data.uuid has the uuid of the port we should use to send the data...
    portTable[uuid] && portTable[uuid].postMessage(message);
  }

  function registerHandlers() {
    debug('SHIM SVR -- registerHandlers');
    NavigatorConnectServerIAC.start();
  }

  // Returns true if the message (from IAC) is a connection request,
  // false otherwise.
  var isConnectionRequest = function(message) {
    debug('SHIM SVR - isConnectionRequest:' + message.isConnectionRequest);
    return (message && message.isConnectionRequest ? true : false);
  };

  // Returns a default, test, connection message. Normally connection messages
  // will only include connection data (such as the origin), and not any client
  // data.
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
  // isConnectionRequest: True if it's a connection request,
  //                      false if it's a message
  // data: The data that the original message had
  // uuid: The uuid of the virtual channel to use, or null/undefined to create a
  //       new channel
  // and as a MANDATORY field:
  // originURL: The originator of the message
  var sendMessage = function(aMessage) {
    return new Promise((resolve, reject) => {
      debug('SHIM SVR sendMessage...' + (aMessage ? JSON.stringify(aMessage):
                                         'No received msg to send'));
      navigator.serviceWorker.ready.then(sw => {
        debug('SHIM SVR Got regs: ' + JSON.stringify(sw));
        // We must construct a structure here to indicate our sw partner that
        // we got a message and how to answer it.
        aMessage = aMessage || getDefaultMsg();
        aMessage.uuid = aMessage.uuid || generateNewUUID();

        var message = {
          isFromIAC: true,
          isConnectionRequest: isConnectionRequest(aMessage),
          uuid: aMessage.uuid,
          originURL: aMessage.originURL,
          dataToSend: aMessage.data
        };

        debug('SHIM SVR --> msg created:'+JSON.stringify(message));

        // This should sends the message data as well as transferring
        // messageChannel.port2 to the service worker.
        // The service worker can then use the transferred port to reply via
        // postMessage(), which will in turn trigger the onmessage handler on
        // messageChannel.port1.
        // See
        // https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function(event) {
          // We will get the answer for this communication here...
          if (event.data.error) {
            debug("SHIM SVR Got an error as a response: " + event.data.error);
          } else {
            // The first answer we will get is just the accept or reject, which
            // we can use to remove this.
            debug("SHIM SVR Got an answer for the request!: " +
                  JSON.stringify(event.data));
            // Here I have to check if the connection was accepted...
            if (event.data.accepted) {
              // And replace the event handler to process messages!
              messageChannel.port1.onmessage = function(messageEvent) {
                // Here we have to pass this message to the other side of the
                // IAC connection...
                sendMessageByIAC(aMessage.uuid, messageEvent.data);
              };
            }
          }
        };

        debug('SHIM SVR sending message ' + (sw.active?' sw active':'sw NO active'));
        sw.active && sw.active.postMessage(message, [messageChannel.port2]);
        resolve(aMessage.uuid);
      });
    });
  };

  // Create a listener service for the IAC messages.
  var NavigatorConnectServerIAC = (function() {
    var started = false;

    function IAC() {
      this.connectionsURL = [];

      var request = navigator.mozApps.getSelf();
      request.onsuccess = domReq => {
        debug('SHIM SVR - NavigatorConnectServerIAC - onsuccess getSelf');
        var app = domReq.target.result;
        var manifest  = app.manifest;
        if (!manifest || !manifest.connections) {
          debug('SHIM SVR manifest does not have connections defined');
          this.connectionsURL = [];
        }
        for (var key in manifest.connections) {
          this.connectionsURL.push(key);
        }
        //only if we've defined connections we need to put the handler
        if (this.connectionsURL.length > 0) {
          navigator.mozSetMessageHandler('connection',
                                         this.onConnection.bind(this));
        }
      };
    }

    IAC.prototype = {
      inProgress: false,

      onConnection: function (request) {
        if (this.connectionsURL.indexOf(request.keyword) < 0) {
          debug('SHIM SVR no urls registered');
          return;
        }
        var port = this.port = request.port;
        debug('SHIM SVR IAC Sending conexion msg');
        // Send a connection request to the service worker
        // Wait for the first message before sending anything to the service
        // worker.
        // The first message received will hold the origin URL
        port.onmessage = aMessage => {
          debug('SHIM SVR: 1st port.onmessage: ' + JSON.stringify(aMessage) +
                ', ' + JSON.stringify(aMessage.data));
          var originURL = aMessage.data.originURL;
          sendMessage({ isConnectionRequest: true,
                        originURL: originURL,
                        data: null}).then(uuid => {
            debug('SHIM SVR sent connection message with uuid:' + uuid);
            // TO-DO: This should be done only when the connection is actually
            // accepted. We don't want to send messages to the SW otherwise
            portTable[uuid] = port;
            port.onmessage = this.onmessage.bind(this, uuid, originURL);
            port.start();
           });
        };
      },

      onmessage: function(uuid, originURL, evt) {
        sendMessage({ originURL: originURL,
                      data: evt.data,
                      uuid: uuid});
      }
    };

    return {
      start: function() {
        if (!started) {
          debug('SHIM SVR initializing IAC server');
          // Yes, it sucks. I'll change it
          new IAC();
          started = true;
        }
      }
    };
  })();

  navigator.serviceWorker.ready.then(registerHandlers);

  // This whole object should not be needed, except for tests, if
  // MessageChannel did work.
  // Since it doesn't work for Service Workers, it's needed, sadly.
  exports.NCShim = {
    // sendMessage exported only for tests!
    sendMessage: sendMessage
    // And this is needed only because MessageChannel doesn't currently work!
  };

})(window);
