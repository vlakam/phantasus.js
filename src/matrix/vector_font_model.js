phantasus.VectorFontModel = function () {
  this.vectorNameToMappedValue = new phantasus.Map();
  this.fonts = phantasus.VectorFontModel.FONTS;

};

phantasus.VectorFontModel.FONTS = [{weight: 400}, {weight: 700}, {weight: 900}];
// 400 (normal), 700 (bold), 900 (bolder)

phantasus.VectorFontModel.prototype = {
  toJSON: function (tracks) {
    var _this = this;
    var json = {};
    tracks.forEach(function (track) {
      if (track.isRenderAs(phantasus.VectorTrack.RENDER.TEXT) && track.isRenderAs(phantasus.VectorTrack.RENDER.TEXT_AND_FONT)) {
        var map = _this.vectorNameToMappedValue.get(track.getName());
        if (map != null) {
          json[track.getName()] = map;
        }
      }
    });
    return json;
  },
  fromJSON: function (json) {
    for (var name in json) {
      var obj = json[name];
      this.vectorNameToMappedValue.set(name, phantasus.Map.fromJSON(obj));
    }
  },
  clear: function (vector) {
    this.vectorNameToMappedValue.remove(vector.getName());
  },
  copy: function () {
    var c = new phantasus.VectorFontModel();
    c.fonts = this.fonts.slice(0);
    this.vectorNameToMappedValue.forEach(function (fontMap, name) {
      var newFontMap = new phantasus.Map();
      newFontMap.setAll(fontMap); // copy existing values
      c.vectorNameToMappedValue.set(name, newFontMap);
    });
    return c;
  },
  clearAll: function () {
    this.vectorNameToMappedValue = new phantasus.Map();
  },
  _getFontForValue: function (value) {
    if (value == null) {
      return phantasus.VectorFontModel.FONTS[0];
    }
    // try to reuse existing map
    var existingMetadataValueToFontMap = this.vectorNameToMappedValue
      .values();
    for (var i = 0, length = existingMetadataValueToFontMap.length; i < length; i++) {
      var font = existingMetadataValueToFontMap[i].get(value);
      if (font !== undefined) {
        return font;
      }
    }
  },
  getMap: function (name) {
    return this.vectorNameToMappedValue.get(name);
  },
  getMappedValue: function (vector, value) {
    var metadataValueToFontMap = this.vectorNameToMappedValue.get(vector
      .getName());
    if (metadataValueToFontMap === undefined) {
      metadataValueToFontMap = new phantasus.Map();
      this.vectorNameToMappedValue.set(vector.getName(),
        metadataValueToFontMap);
      // set all possible values
      var values = phantasus.VectorUtil.getValues(vector);
      for (var i = 0, nvalues = values.length; i < nvalues; i++) {
        var font = this._getFontForValue(values[i]);
        if (font == null) {
          font = this.fonts[0]; // default is normal
        }
        metadataValueToFontMap.set(values[i], font);
      }
    }
    var font = metadataValueToFontMap.get(value);
    if (font == null) {
      font = this._getFontForValue(value);
      if (font == null) {
        font = this.fonts[0]; // default is normal
      }
      metadataValueToFontMap.set(value, font);
    }
    return font;
  },
  setMappedValue: function (vector, value, font) {
    var metadataValueToFontMap = this.vectorNameToMappedValue.get(vector
      .getName());
    if (metadataValueToFontMap === undefined) {
      metadataValueToFontMap = new phantasus.Map();
      this.vectorNameToMappedValue.set(vector.getName(),
        metadataValueToFontMap);
    }
    metadataValueToFontMap.set(value, font);
  }
};
