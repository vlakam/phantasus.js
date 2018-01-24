phantasus.GctWriter12 = function () {
  this.options = {
    rowDescription: 'Description',
    rowId: 'id',
    columnId: 'id'
  };
  this.nf = phantasus.Util.createNumberFormat('.5g');
};
phantasus.GctWriter12.prototype = {
  setNumberFormat: function (nf) {
    this.nf = nf;
  },
  getExtension: function () {
    return 'gct';
  },
  write: function (dataset, pw) {
    if (pw == null) {
      pw = [];
    }
    var rows = dataset.getRowCount();
    var columns = dataset.getColumnCount();
    var version = '#1.2';
    pw.push(version);
    pw.push('\n');
    pw.push(rows + '\t' + columns);
    pw.push('\n');
    var rowMetadata = phantasus.GctWriter.idFirst(dataset.getRowMetadata());
    var columnMetadata = phantasus.GctWriter.idFirst(dataset
      .getColumnMetadata());
    pw.push('Name');
    pw.push('\t');
    pw.push('Description');
    var columnIds = columnMetadata.getByName(this.options.columnId);
    if (!columnIds) {
      columnIds = columnMetadata.get(0);
    }
    var columnIdToString = phantasus.VectorTrack.vectorToString(columnIds);
    for (var j = 0; j < columns; j++) {
      pw.push('\t');
      pw.push(columnIdToString(columnIds.getValue(j)));
    }
    var rowIds = rowMetadata.get(this.options.rowId);
    if (!rowIds) {
      rowIds = rowMetadata.get(0);
    }
    var rowDescriptions = rowMetadata
      .getByName(this.options.rowDescription);
    if (rowDescriptions == null && rowMetadata.getMetadataCount() > 1) {
      rowDescriptions = rowMetadata.get(1);
    }
    var rowIdToString = phantasus.VectorTrack.vectorToString(rowIds);
    var rowDescriptionToString = rowDescriptions != null ? phantasus.VectorTrack.vectorToString(rowDescriptions) : null;
    var nf = this.nf;
    for (var i = 0; i < rows; i++) {
      pw.push('\n');
      pw.push(rowIdToString(rowIds.getValue(i)));
      pw.push('\t');
      var rowDescription = rowDescriptions != null ? rowDescriptions
      .getValue(i) : null;
      if (rowDescription != null) {
        pw.push(rowDescriptionToString(rowDescription));
      }
      for (var j = 0; j < columns; j++) {
        pw.push('\t');
        pw.push(nf(dataset.getValue(i, j)));
      }
    }
    pw.push('\n');
    return pw.join('');
  }
};
