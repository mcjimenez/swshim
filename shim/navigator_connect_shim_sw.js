
console.log('CJC - SWSHIM Self: ' + (self?'EXISTS':'DOES NOT EXIST'));
console.log('CJC - SWSHIM myServiceWorker: ' + (myServiceWorker?'EXISTS':'DOES NOT EXIST'));

(function(sw) {

  console.log('CJC - SWSHIM - Loaded! ');

  // Messages that come from IAC should be marked somehow to distinguish them
  // from other messages the hosting app might want to pass.
  function isFromIAC(aMessage) {
    return true;
  }

  function extractDataFromMessage(data) {
    for (var kk in data) {
      console.log("CJC extractDataFromMessage --> "+kk);
    }
    if (data.detail) {
      console.log("CJC - SWSHIM - data.detail: " + JSON.stringify(data.detail));
    }
    return data.detail;
  }

  sw.addEventListener('message', function(messageData) {
    console.log('CJC - SWSHIM - got a message: ' + JSON.stringify(messageData));
    if (isFromIAC(messageData)) {
      // El mensaje viene de IAC o sea que será crossorigin:
      var data = extractDataFromMessage(messageData);
      if (sw.oncrossoriginconnect && typeof sw.oncrossoriginconnect == "function") {
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
})(self || myServiceWorker);
