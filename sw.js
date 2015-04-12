'use strict';

function debug(str) {
  console.log("CJC sw.js -*- -->" + str);
}

// This is only really needed if self is not defined
var myServiceWorker = this;

this.addEventListener('install', function(evt) {
  debug('Install event');
  this.importScripts("/swshim/shim/navigator_connect_shim_sw.js") || debug("importScripts failed!");

});

this.addEventListener('activate', function(evt) {
  debug('activate event');
});

this.addEventListener('fetch', function(evt) {
  debug('fetch event');
});

this.oncrossoriginconnect = function(msg) {
  debug("oncrossoriginconnect event");
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
