'use strict';

function debug(str) {
  console.log("CJC navConnShim_SVR.js -*- -->" + str);
}

debug('!! Loaded navigator_connect_shim_svr.js');
debug('Self: ' + (self?'EXISTS':'DOES NOT EXIST'));

(function(exports) {

  var count = 0;
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


  var handlerSet = false;

  // This should be in navigator_connect_shim_svr.js
  // When iac connection message is received this has to be executed
  var sendConnectionMessage = function () {
    debug('sendConnectionMessage...');
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      debug('Got regs: ' + JSON.stringify(regs));
      regs.forEach(reg => {
        debug('Got reg: ' + JSON.stringify(reg.active));
        /* How it should be:

        // We need to create a dedicated MessageChannel to get the answer back
        var messageChannel = new MessageChannel();
        debug('messageChannel created');

        messageChannel.port1.onmessage = function(event) {
          // We will get the answer here. To do the complete flow, this can be encapsulated on a Promise or whatever we need
          // At this point, just log the response
          if (event.data.error) {
            debug("Got an error as a response: " + event.data.error);
          } else {
            debug("Got an answer for the request!: " + JSON.stringify(event.data));
            // Here I have to check if the connection was accepted...
            if (event.data.accepted) {
              // And then I have to store the messageport (messageChannel.port1) associated to this connection
              // and answer to the client telling him the ID that I have generated for this connection and that the answer was accepted
              // Something like:
              var newConnectionId = generateNewUUID();
              connections[newConnectionId] = messageChannel.port1;
              // And replace the event handler to process messages!
              messageChannel.port1.onmessage = function(messageEvent) {
                // Here we have to pass this message to the other side of the IAC connection...
                sendMessageByIAC(newConnectionId, messageEvent);
              };
            }
          }
        };
        */


        /* How it is :( */
        debug('*** creating msg');

        // We must construct a structure here to indicate our sw partner that
        var message = {
          isFromIAC: true,
          isConnectionRequest: true,
          uuid: generateNewUUID(),
          dataToSend: {
            data: "Hello from the main thread!",
            count: count++
          }
        };
        // This sends the message data as well as transferring messageChannel.port2 to the service worker.
        // The service worker can then use the transferred port to reply via postMessage(), which
        // will in turn trigger the onmessage handler on messageChannel.port1.
        // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
        debug('sending message ' + (reg.active?' reg active':'reg NO active'));
//        debug('Port2:' + (messageChannel.port2 ? ' exists': ' not exists'));
        // According to the sample it should be:
        //        reg.active && reg.active.postMessage(message, [messageChannel.port2]);
        // But that doesn't work on Gecko (https://bugzilla.mozilla.org/show_bug.cgi?id=677638#c62)...
        // let's try:
        //reg.active && reg.active.postMessage({data: message, ports: [messageChannel.port2]});
        // That doesn't work either. So we'll have to mediate on ALL the frigging messages...

        if (reg.active) {
          handlerSet = handlerSet ||
            reg.active.addEventlistener("message", evt => {
              // Add event handling here! The messages will have an uuid indicating what channel they belong to!
              console.log("We got an answer! " + JSON.stringify(evt.data));
            }) || true;
          reg.active.postMessage(message);
        }
      });
    });
  };

  exports.sendConnectionMessage = sendConnectionMessage;

})(self);
