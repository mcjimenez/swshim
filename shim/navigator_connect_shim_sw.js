'use strict';

function debug(str) {
  console.log("CJC SHIM SW.js -*- -->" + str);
}


debug('Self: ' + (self?'EXISTS':'DOES NOT EXIST'));

(function(sw) {

  var swCount = 0;
  var ORIGN = 'SW';

  debug(' - Loaded! ');

  // Messages that come from IAC should be marked somehow to distinguish them
  // from other messages the hosting app might want to pass.
  function isInternalMessage(aMessage) {
    debug('IsInternalMessage');
    return true;
  }

  // This function processes a message from the client side, and passes it to the
  // service worker to be processed.
  function transmitMessage(evt) {
    // In theory,
    // evt.ports[0] should correspond to the MessagePort that was transferred as part of
    // the controlled page's call to controller.postMessage(). Therefore,
    // evt.ports[0].postMessage() will trigger the onmessage
    // handler from the controlled page.
    // THIS DOESN'T WORK YET!
    // So much of the code of this function is a workaround around that...

    // We can get two kind of messages here: connection requests, and messages on a
    // (previously accepted) connection. As such, we should keep a table of previously
    // accepted connections to know which 'channel' should get the message. Again, this should
    // not be needed. Alas, MessageChannel doesn't work. I think I'm going to say that a lot.

      debug('executing transmitMessage...');

    // We need to construct here what we will pass to onconnect, based on what we have received
    // onconnect will need a way to return data to the source
    // http://mkruisselbrink.github.io/navigator-connect/
    // if it's a connect message, then we have to add an acceptConnection method to the event we dispatch.
    // Otherwise, we have to dispatch the message to the correct underlying port. And maybe that's not even needed
    // if MessageChannel works...

//    var returnedMessage = evt.data.dataToSend;
//    if (evt.data.isConnectionRequest) {
//      returnedMessage.targetURL="We have to copy the origin URL here";
      // El handler al que llamemos pondrá un onmessage aqui, que tendremos que guardar con cariño para pasarle los mensajes...
      // (en el else que no está hecho)
//      returnedMessage.source = {
//        postMessage: msg => {
//          sw.postMessage({uuid: evt.data.uuid, data: msg});
//        }
//      };
      //evt.data.ports[0]; // Store this so the client service worker can store it to answer...

      // And here we should have a way to tell the parent that hey, we've accepted the connection:
//      returnedMessage.acceptConnection = aPromise => {
//        if (typeof aPromise.then != "function") {
          // We got a value instead of a promise...
//          aPromise = Promise.resolve(aPromise);
//        }
//        aPromise.then(accepted => sw.postMessage({uuid: evt.data.uuid, data: { accepted: accepted} }));
//      };
      // For example...
      /*
        evt.data.ports[0].postMessage({
        accepted: accepted
        });
      */
//    } else {
      // Is this needed? working this way we will only see connection requests because messages will be delivered directly to the SW!
      // So this complete if might be unneeded since everything will be a connectionrequest...
//      debug("Implement me!");
//    }
//    return returnedMessage;
  }

  function extractDataFromMessage(msg) {
    return msg.data.dataToSend;
  }

  function generateResponse(msg) {
    var respMsg = msg;
    debug('SW enviar --> dataToSend:' + JSON.stringify(msg));
    respMsg.org = ORIGN;
    respMsg.swCount = swCount++;
    return respMsg;
  }

  function sendMessage(msg) {
    debug('Dentro sendMessage');

    self.clients.matchAll().then(res => {
      if (!res.length) {
        debug('Error: no clients are currently controlled.');
      } else {
        debug('Sending...');
        res[0].postMessage(msg);
      }
    });
  }

  sw.addEventListener('message', function(evt) {
    debug('****SW***** got a message: ' + JSON.stringify(evt.data));
    if (!isInternalMessage(evt)) {
      return;
    }
    // types of msg: connect, data
    //if (sw.onconnect && typeof sw.onconnect == "function") {
    //  sw.onconnect(data);
    //}
    // El mensaje viene de IAC o sea que será crossorigin:
    var data = evt.dataToSend;  //extractDataFromMessage(evt);
    var msg = generateResponse(data);
    debug('sending msg:' + JSON.stringify(msg));
    sendMessage(msg);
  });

  sw.NCShim = {
    isInternalMessage: isInternalMessage
  };

})(self);
