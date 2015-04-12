'use strict';

function debug(str) {
  console.log("CJC sw.js -*- -->" + str);
}

this.addEventListener('install', function(evt) {
  debug('Install event');
  this.importScripts("/swshim/shim/navigator_connect_shim_sw.js");
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
  }

/*
  if (msg.client.origin != 'https://foo.com') {
    msg.acceptConnection(false);
    return;
  }
  // Acceptance can be asynchronous by passing a Promise instead of a boolean
  msg.acceptConnection(true);
  // Have to resolve the promise as true before sending messages.
  msg.client.postMessage({type: 'connected', payload: 'foo'});
*/
}

this.oncrossoriginmessage = function(msg) {
  // msg.source is always a client previously accepted by onconnect.
  debug('oncrossoriginmessage Event');
/*
  if (msg.data.type == 'foo') {
    msg.source.postMessage({type: 'reply', payload: 'bar'});
    return;
  }
  msg.source.postMessage({type: 'error', payload: 'Invalid message'});
*/
};
