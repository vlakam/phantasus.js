phantasus.GeoReader = function () {
};

phantasus.GeoReader.prototype = {
  read: function (name, callback) {
    var req = ocpu.call('loadGEO', { name: name }, function (session) {
      session.getMessages(function (success) {
        console.log('loadGEO messages', '::', success);
      });
      phantasus.ParseDatasetFromProtoBin.parse(session, callback, { isGEO : true });
    });
    req.fail(function () {
      callback(req.responseText);
      //// console.log('phantasus.GeoReader.prototype.read ::', req.responseText);
    });

  },
  _parse: function (text) {

  }
};



