'use strict';

// This is a very basic sample Service Worker (SW) that  acts as a server for
// navigator.connect. I'm going to mark with a comment where the app MUST
// add some extra code to use the navigator.connect SHIM
// So if you just want to know that, search for:
// ADDED FOR SHIM


function debug(str) {
  console.log('CJC -*- -->' + str);
}

// ADDED FOR SHIM: Import the shim script
this.importScripts('/swshim/shim/navigator_connect_shim_sw.js');
//this.importScripts('/swshim/js/service.js');
// END ADDED FOR SHIM

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
  debug('SW onconnect event');
  for(var i in msg){
    debug('SW --->' +i+':'+msg[i]);
  }
  debug('SW onconnect: We should have a port here on msg.source: ' +
        JSON.stringify(msg.source));
  // msg.source should have the endpoint to send and receive messages,
  // so we can do:
  msg.acceptConnection(true);
  msg.source.onmessage = function(aMsg) {
    debug('SW SETTING msg received:' + JSON.stringify(aMsg));
    var setting = aMsg.setting;
    if (setting) {
      debug('SW SETTING requested setting:' + setting);
      // In sw APIS do not work!!!! We need to request it to the main thread
      self.clients.matchAll().then(res => {
        if (!res.length) {
          debug('SW SETTING Error: no clients are currently controlled.');
        } else {
          debug('SW SETTING Sending...');
          res[0].postMessage({ 'setting': setting });
        }
      });
    } else {
      debug('SW Got a message from one of the accepted connections: ' +
            JSON.stringify(aMsg));
      msg.source.postMessage('Hello, client! I got your request: ' +
                             JSON.stringify(aMsg));
    }
  };
  this.msgConnectionChannel = msg.source;
};

this.addEventListener('message', evt => {
  // This is a hack caused by the lack of dedicated MessageChannels... sorry!
  debug('SW onmessage ---> '+ JSON.stringify(evt.data));
  // ADDED FOR SHIM
  // Since we're using the same channel to process messages comming from the main
  // thread of the app to the SW, and messages coming from the navigator.connect
  // shim, we have to distinguish them here
  if (this.NCShim.isInternalMessage(evt)) {
    debug('SW es msg interno. no ejectuar esto');
    return;
  }
  // END ADDED https://github.com/mcjimenez/swshimFOR SHIM

  // Your code here
  debug("SW We got a message for us!");
  this.msgConnectionChannel.postMessage(evt.data);
});



