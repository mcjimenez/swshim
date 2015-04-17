'use strict';

function debug(str) {
  console.log('CJC -*- -->' + str);
}

this.importScripts("/swshim/shim/navigator_connect_shim_sw.js");
debug('SW importScripts executed (hopefully)!');

this.addEventListener('install', function(evt) {
  debug('SW Install event');
});

this.addEventListener('activate', function(evt) {
  debug('SW activate event');
});

this.addEventListener('fetch', function(evt) {
  debug('SW fetch event');
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

this.addEventListener('message', function(evt) {
  // This is a hack caused by the lack of dedicated MessageChannels... sorry!
  if (this.NCShim.isInternalMessage(evt)) {
    return;
  }

  // Your code here
  debug("We got a message for us!");
});



