(function(exports) {

  'use strict';

  var urlAllowed;
  var resources = {};

  function debug(str) {
    console.log('CJC -*-:' + str);
  }

  function getJSON(file, mozSystem) {
    debug('SERVICE --> getJSON:' + file);
    return new Promise(function(resolve, reject) {
      var xhr;
      if (mozSystem) {
        xhr = new XMLHttpRequest();//{mozSystem: true});
      } else {
        xhr = new XMLHttpRequest();
      }
      xhr.open('GET', file, true);
      //xhr.responseType = 'json';
      debug('SERVICE --> getJSON: creado XHR');
      xhr.onerror = function(error) {
        debug('SERVICE --> getJSON: xhr.error:' + error);
        reject(error);
      };
      xhr.onload = function() {
        if (xhr.response !== null) {
          debug('SERVICE --> getJSON: xhr.onload:' + JSON.stringify(xhr.response));
          resolve(xhr.responseText);
        } else {
          debug('SERVICE --> getJSON: xhr.response === null');
          reject(new Error('No valid JSON object was found (' +
			                     xhr.status + ' ' + xhr.statusText + ')'));
        }
      };

      debug('SERVICE --> getJSON and send');
      xhr.send();
    });
  };

  function getIcon(iconUrl) {
    debug('SERVICE getIcon. ' + JSON.stringify(iconUrl));
    return new Promise((resolve, reject) => {
      debug('SERVICE getIcon --> icon:' + iconUrl);
      var requestedIcon = iconUrl; //resources [data.appicon];
      if (!requestedIcon) {
        debug('SERVICE getIcon --> no icon requested');
        reject('No url icon received');
        return;
      }
      debug('pto1');
      var xhr = new XMLHttpRequest({
        mozAnon: true, // I'm not sure if this is necessary
        mozSystem: true //This is not necessary too
      });
      debug('pto2');
      xhr.open('GET', requestedIcon, true);
      debug('pto3');
      xhr.responseType = 'blob';
      debug('pto4');
      xhr.overrideMimeType('image/png');
      debug('pto5');
      xhr.onload = function onload(evt) {
        debug('SERVICE getIcon --> onload');
        var status = xhr.status;
        if (status !== 0 && status !== 200) {
          console.log('Got HTTP status ' + status + ' trying to load icon ' +
                      requestedIcon);
          reject('Got HTTP status ' + status + ' trying to load icon ' +
                 requestedIcon);
          return;
        }

        var ui8 = new Uint8Array(xhr.response.length);

        for (var i = 0, l = xhr.response.length; i < l; i++) {
          ui8[i] = xhr.response.charCodeAt(i);
        }

        debug('SERVICE ui8:' + JSON.stringify(ui8));
        resolve(ui8);
        //resolve(xhr.response);
        return;
      };

      try {
        debug('SERVICE getIcon --> and send request');
        xhr.send();
      } catch (evt) {
        console.log('SERVICE -> Got an exception when trying to load icon ' +
                   requestedIcon + '. Exception: ' + evt.message);
        reject('SERVICE -> Got an exception when trying to load icon ' +
               requestedIcon + '. Exception: ' + evt.message);
      };

      xhr.ontimeout = xhr.onerror = function onerror(evt) {
        debug('SERVICE :' + evt.type + ' while HTTP GET: ' + requestedIcon);
        console.error(evt.type, ' while HTTP GET: ', requestedIcon);
        reject('Error while HTTP GET ' + requestedIcon + '. Type:' + evt.type);
        return;
      }; // ontimeout & onerror
    });
  };

  function init() {
    debug('SERVICE init dentro');
    getJSON('/swshim/js/init.json').then(conf => {
      console.log('CJC loaded init.json. url allowed:' + conf.allowedFrom);
      urlAllowed = conf.allowedFrom;
      //TODO verified format
    });
  };

  debug('SERVICE init!!!!!');
  init();

  var service = {
    getIcon: getIcon
  };

  exports.service =  service;

})(self);
