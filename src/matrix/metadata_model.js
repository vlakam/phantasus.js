/**
 * Creates a new meta data model instance.
 *
 * @param itemCount {number}
 *            the number of items that vectors in this instances will hold.
 * @implements {phantasus.MetadataModelInterface}
 * @constructor
 */
phantasus.MetadataModel = function (itemCount) {
  this.itemCount = itemCount;
  this.vectors = [];
};
phantasus.MetadataModel.prototype = {
  add: function (name, options) {
    var index = phantasus.MetadataUtil.indexOf(this, name);
    var oldVector;
    if (index !== -1) {
      oldVector = this.get(index);
    }
    var v = new phantasus.Vector(name, this.getItemCount());
    if (oldVector != null) {
      // copy values
      for (var i = 0, size = oldVector.size(); i < size; i++) {
        var val = oldVector.getValue(i);
        v.setValue(i, val);
      }
    }
    if (index !== -1) {
      // replace old vector
      this.vectors.splice(index, 1, v);
    } else {
      this.vectors.push(v);
    }
    return v;
  },
  getItemCount: function () {
    return this.itemCount;
  },
  get: function (index) {
    return this.vectors[index];
  },
  remove: function (index) {
    return this.vectors.splice(index, 1)[0];
  },
  getByName: function (name) {
    var index = phantasus.MetadataUtil.indexOf(this, name);
    return index !== -1 ? this.get(index) : undefined;
  },
  getMetadataCount: function () {
    return this.vectors.length;
  }
};
