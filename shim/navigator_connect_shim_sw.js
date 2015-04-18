'use strict';

function debug(str) {
  console.log("CJC -*-:" + str);
}

debug('SHIM SW Self: ' + (self?'EXISTS':'DOES NOT EXIST'));

(function(sw) {
  // It's not good trying to load this twice
  if (sw.NCShim) {
    return;
  }

  var swCount = 0;
  var ORIGN = 'SW';

  debug('SHIM SW  - Loaded! ');

  // Messages that come from IAC should be marked somehow to distinguish them
  // from other messages the hosting app might want to pass.
  function isInternalMessage(aMessage) {
    debug('SHIM SW IsInternalMessage:' + (aMessage && !!aMessage.data.isFromIAC));
    return aMessage && aMessage.data && !!aMessage.data.isFromIAC;
  }

  var _messageChannels = {};

  function sendMessage(msg) {
    debug('SHIM SW Dentro sendMessage');

    self.clients.matchAll().then(res => {
      if (!res.length) {
        debug('SHIM SW Error: no clients are currently controlled.');
      } else {
        debug('SHIM SW Sending...');
        res[0].postMessage(msg);
      }
    });
  }

  // This function converts the message received to the message format that the
  // onconnect or onmessage handlers expect, and invokes the adequate handler
  function transmitMessage(evt) {
    debug('SHIM SW executing transmitMessage...');

    // In theory,
    // evt.ports[0] should correspond to the MessagePort that was transferred
    // as part of the controlled page's call to controller.postMessage().
    // Therefore, evt.ports[0].postMessage() will trigger the onmessage
    // handler from the controlled page.
    // THIS DOESN'T WORK YET!
    // So much of the code of this function is a workaround around that...

    // We can get two kind of messages here: connection requests, and messages
    // on a (previously accepted) connection. As such, we should keep a table
    // of previously accepted connections to know which 'channel' should get the
    // message. Again, this should not be needed. Alas, MessageChannel doesn't
    // work. I think I'm going to say that a lot.

    // Maybe we would need to do something with this...
    if (evt.data.isConnectionRequest) {
      debug('SHIM SW - isConnectionRequest msg evt.data:'+JSON.stringify(evt.data));
      var connectionMessage = evt.data.dataToSend || {};
      // We need to construct here what we will pass to onconnect, based on what
      // we have received onconnect will need a way to return data to the source
      // http://mkruisselbrink.github.io/navigator-connect/
      // if it's a connect message, then we have to add an acceptConnection
      // method to the event we dispatch.
      // TO-DO: This should come from the other side, on evt.data.something
      connectionMessage.targetURL="TO-DO://We.have.to.copy.the.origin.URL.here";
      // We will invoke a onconnect handler here. This onconnect must call
      // acceptCondition(with a promise or a boolean) and can set an onmessage
      // on the source we pass to it. We must store that as a reference to
      // process messages at a later point. Again, that would not be needed if
      // MessageChannel worker. Told you I was going to say that a lot.
      debug('SHIM SW creating connectionMessage');
      connectionMessage.source = {
        postMessage: msg => {
          // TO-DO/TO-DO: Either here or on sendMessage, we should have a way to
          // distinguish our internal messages. Worst case, we can use the uuid
          // (if it has an uuid field and  a data field it's internal...
          sendMessage({uuid: evt.data.uuid, data: msg});
        }
      };

      // And here we should have a way to tell the parent that hey, we've
      // accepted the connection:
      connectionMessage.acceptConnection = aPromise => {
        if (typeof aPromise.then !== 'function') {
          debug('SHIM SW acceptConnection no recibida promesa');
          // We got a value instead of a promise...
          aPromise = Promise.resolve(aPromise);
        }
        aPromise.then(accepted => sendMessage({ uuid: evt.data.uuid,
                                                data: {
                                                  accepted: accepted
                                                }
                                              }));
      };

      // On this object the onconnect handler add an event listener/set a
      // handler and it will use it to postMessages to the other side of the
      // connection, so we need to store it. Again, we wouldn't need to do this
      // if... yeah yeah.
      _messageChannels[evt.data.uuid] = connectionMessage.source;

      if (sw.onconnect && typeof sw.onconnect == "function") {
        sw.onconnect(connectionMessage);
      }

    } else {
      debug('SHIM SW - NOOO isConnectionRequest msg');
      // This should come from an accepted connection. So evt.data.uuid has the
      // channel id
      var messageChannel = _messageChannels[evt.data.uuid];
      if (!messageChannel) {
        debug("transmitMessage: Didn't get a valid uuid: " + evt.data.uuid);
        return;
      }
      // To-Do: Check that dataToSend has what we expect it to have
      // Also check if this needs a source or whatever (with the spec!)
      messageChannel.onmessage &&
        typeof messageChannel.onmessage === 'function' &&
        messageChannel.onmessage(evt.data.dataToSend);
      // Once again, if MessageChannel worked, this would be a NOP.
    }
  }

  sw.addEventListener('message', function(evt) {
    debug('SHIM SW ****SW***** got a message: ' + JSON.stringify(evt.data));
    if (!isInternalMessage(evt)) {
      debug('SHIM SW no es intenal msg');
      return;
    }
    var data = transmitMessage(evt);
  });

  sw.NCShim = {
    isInternalMessage: isInternalMessage
  };

})(self);
