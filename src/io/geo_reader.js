phantasus.GeoReader = function () {
};

phantasus.GeoReader.prototype = {
  read: function (name, callback) {
    // console.log("read", name);
    var req = ocpu.call('loadGEO', { name: name }, function (session) {
      session.getMessages(function (success) {
        console.log('loadGEO messages', '::', success);
      });
      phantasus.ParseDatasetFromProtoBin.parse(session, callback, { isGEO : true });
    });
    req.fail(function () {
      callback(req.responseText);
    });

  },
  _parse: function (text) {

  }
};



