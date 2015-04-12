'use strict';

function debug(str) {
  self.console.log("CJC navConnShim_sw.js -*- -->" + str);
}


debug('Self: ' + (self?'EXISTS':'DOES NOT EXIST'));

(function(sw) {

  debug(' - Loaded! ');

  // Messages that come from IAC should be marked somehow to distinguish them
  // from other messages the hosting app might want to pass.
  function isFromIAC(aMessage) {
    return true;
  }

  function extractDataFromMessage(evt) {

      // evt.ports[0] corresponds to the MessagePort that was transferred as part of the controlled page's
      // call to controller.postMessage(). Therefore, evt.ports[0].postMessage() will trigger the onmessage
      // handler from the controlled page.
      //   It's up to you how to structure the messages that you send back; this is just one example.


    // We need to construct here what we will pass to onconnect, based on what we have received
    // onconnect will need a way to return data to the source
    // http://mkruisselbrink.github.io/navigator-connect/
    // Basically there are two options here. Either this is a connect message, or it's a message to a given port.
    // if it's a connect message, then we have to add an acceptConnection method to the event we dispatch.
    // Otherwise, we have to dispatch the message to the correct underlying port. And maybe that's not even needed
    // if MessageChannel works...
    debug('executing extractDataFromMessage...');
    var returnedMessage = evt.data.dataToSend;
    if (event.data.isConnectionRequest) {
      returnedMessage.targetURL="We have to copy the origin URL here";
      returnedMessage.source = {
        postMessage: msg => {
          sw.postMessage({uuid: evt.data.uuid, data: msg});
        }
      }
      //evt.data.ports[0]; // Store this so the client service worker can store it to answer...

      // And here we should have a way to tell the parent that hey, we've accepted the connection:
      returnedMessage.acceptConnection = function(aPromise) {
        aPromise.then(accepted => {
          // For example...
          /*
            evt.data.ports[0].postMessage({
            accepted: accepted
            });
          */
          self.postMessage({uuid: evt.data.uuid, data: { accepted: accepted} });
        });
      };
    } else { // Is this needed? working this way we will only see connection requests because messages will be delivered directly to the SW!
      // So this complete if might be unneeded since everything will be a connectionrequest...
    }
    return returnedMessage;
  }

  sw.addEventListener('message', function(messageData) {
    debug('got a message: ' + JSON.stringify(messageData));
    if (isFromIAC(messageData)) {
      // El mensaje viene de IAC o sea que será crossorigin:
      var data = extractDataFromMessage(messageData);
      if (sw.onconnect && typeof sw.onconnect == "function") {
        sw.oncrossoriginconnect(data);
      }
    }/*
      If there was a previously event putted this addEventListener
      simply will be ignored
      else if (previousOnMessage && typeof previousOnMessage == "function") {
      // Igual no venia de IAC sino de lo que haga la app normalmente
      previousOnMessage(messageData);
    }*/
  });
})(self);
