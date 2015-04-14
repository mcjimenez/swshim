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
  };
};

// Please do not implemente onmessage, instead of it implements this
var msgFromSWToApp = function(data) {
  debug('SW datas that we want to send');
}

