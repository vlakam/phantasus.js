phantasus.JsonDatasetReader = function () {

};

phantasus.JsonDatasetReader.prototype = {
  read: function (fileOrUrl, callback) {
    var _this = this;
    var name = phantasus.Util.getBaseFileName(phantasus.Util.getFileName(fileOrUrl));
    var isString = typeof fileOrUrl === 'string' || fileOrUrl instanceof String;
    if (isString) {
      fetch(fileOrUrl).then(function (response) {
        if (response.ok) {
          return response.text();
        } else {
          callback(response.status + ' ' + response.statusText);
        }
      }).then(function (text) {
        callback(null, phantasus.Dataset.fromJSON(JSON.parse(text.trim())));
      }).catch(function (err) {
        callback(err);
      });
    } else {
      var reader = new FileReader();
      reader.onload = function (event) {
        callback(null, phantasus.Dataset.fromJSON(JSON.parse(event.target.result)));
      };
      reader.onerror = function (event) {
        callback(event);
      };
      reader.readAsText(fileOrUrl);
    }

  }
};
