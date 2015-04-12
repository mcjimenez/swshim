
(function(sw) {

  // Messages that come from IAC should be marked somehow to distinguish them
  // from other messages the hosting app might want to pass.
  function isFromIAC(aMessage) {
    return true;
  }

  var previousOnMessage = sw.onmessage;
  sw.onmessage = function(messageData) {
    if (isFromIAC(messageData)) {
      // El mensaje viene de IAC o sea que será crossorigin:
      var data = extractDataFromMessage(messageData);
      if (sw.oncrossoriginconnect && typeof sw.oncrossoriginconnect == "function") {
        sw.oncrossoriginconnect(data);
      }
    } else if (previousOnMessage && typeof previousOnMessage == "function") {
      // Igual no venia de IAC sino de lo que haga la app normalmente
      previousOnMessage(messageData);
    }
  };
})(self || myServiceWorker);
