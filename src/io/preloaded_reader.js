phantasus.PreloadedReader = function () {
};

phantasus.PreloadedReader.prototype = {
  read: function(name, callback) {
    var req = ocpu.call('loadPreloaded', { name: name }, function(session) {
      phantasus.ParseDatasetFromProtoBin.parse(session, callback, { preloaded : true });
    });
    req.fail(function () {
      callback(req.responseText);
    })
  }
};