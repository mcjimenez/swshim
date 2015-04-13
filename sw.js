'use strict';

var swCount = 0;
var ORIG = 'SW';

function debug(str) {
  console.log("CJC sw.js -*- -->" + str);
}

this.addEventListener('install', function(evt) {
  debug('Install event');
  debug("importScripts executed (hopefully)!");
});

this.addEventListener('activate', function(evt) {
  debug('activate event');
});

this.addEventListener('fetch', function(evt) {
  debug('fetch event');
});

this.onconnect = function(msg) {
  debug("onconnect event");
  debug("onconnect: We should have a port here on msg.source: " + msg.source);
  // msg.source should have the endpoint to send and receive messages, so we can do:
  msg.acceptConnection(true);
  msg.source.onmessage = function(msg) {
    debug("Got a message from one of the accepted connections!");
  };
};

onmessage = evt => {
  debug('SW got a message: data:' + JSON.stringify(evt.data));
  self.clients.matchAll().then(res => {
    if (!res.length) {
      debug("ERROR: no clients are currently controlled.\n");
      return;
    }
    debug('enviar');
    var respMsg = evt.data.dataToSend;
    respMsg.org = ORIG;
    respMsg.swCount = swCount++;
    res[0].postMessage(respMsg);
  });
};
