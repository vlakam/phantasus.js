phantasus.MafFileReader = function () {
  this.geneFilter = null;
};
/**
 *
 * @param options.dataset
 * @param options.fields
 */
phantasus.MafFileReader.summarizeMutations = function (options) {
  var dataset = options.dataset;
  var fields = options.fields;
  var count = fields.length;
  var vector = dataset.getRowMetadata().add('mutation_summary');
  vector.getProperties().set(
    phantasus.VectorKeys.FIELDS, fields);
  vector.getProperties().set(phantasus.VectorKeys.DATA_TYPE, '[number]');

  // computing dynamically screws things up b/c summary is computed for other data types (e.g. CN)
  for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
    var bins = new Int32Array(count); // 1-count
    for (var j = 0, ncols = dataset.getColumnCount(); j < ncols; j++) {
      var value = dataset.getValue(i, j);
      if (value > 0) {
        bins[value - 1]++;
      }
    }
    vector.setValue(i, bins);
  }
};

phantasus.MafFileReader.getField = function (fieldNames, headerToIndex) {
  var name;
  var index;

  for (var i = 0; i < fieldNames.length; i++) {
    name = fieldNames[i];

    var lc = name.toLowerCase();
    index = headerToIndex[lc];

    if (index !== undefined) {
      break;
    }
  }

  if (index !== undefined) {
    return {
      name: name,
      index: index
    };
  }
};

phantasus.MafFileReader.VARIANT_MAP = new phantasus.Map();
// silent
phantasus.MafFileReader.VARIANT_MAP.set('Silent', 1);
// in-frame indel
phantasus.MafFileReader.VARIANT_MAP.set('In_Frame_Del', 2);
phantasus.MafFileReader.VARIANT_MAP.set('In_Frame_Ins', 2);
phantasus.MafFileReader.VARIANT_MAP.set('Inframe_Del', 2);
phantasus.MafFileReader.VARIANT_MAP.set('Inframe_Ins', 2);

// other
phantasus.MafFileReader.VARIANT_MAP.set('Translation_Start_Site', 3);
phantasus.MafFileReader.VARIANT_MAP.set('Nonstop_Mutation', 3);
phantasus.MafFileReader.VARIANT_MAP.set('3\'UTR', 3);
phantasus.MafFileReader.VARIANT_MAP.set('3\'Flank', 3);
phantasus.MafFileReader.VARIANT_MAP.set('5\'UTR', 3);
phantasus.MafFileReader.VARIANT_MAP.set('5\'Flank', 3);
phantasus.MafFileReader.VARIANT_MAP.set('IGR', 3);
phantasus.MafFileReader.VARIANT_MAP.set('Intron', 3);
phantasus.MafFileReader.VARIANT_MAP.set('RNA', 3);
phantasus.MafFileReader.VARIANT_MAP.set('Targeted_Region', 3);
phantasus.MafFileReader.VARIANT_MAP.set('Unknown', 3);
phantasus.MafFileReader.VARIANT_MAP.set('1DEL', 3); // single copy loss from oncopanel
phantasus.MafFileReader.VARIANT_MAP.set('HA', 3); // high amplification from oncopanel

// mis-sense
phantasus.MafFileReader.VARIANT_MAP.set('Missense_Mutation', 4);
phantasus.MafFileReader.VARIANT_MAP.set('Missense', 4);

// splice site
phantasus.MafFileReader.VARIANT_MAP.set('Splice_Site', 5);
phantasus.MafFileReader.VARIANT_MAP.set('Splice_Acceptor', 5);
phantasus.MafFileReader.VARIANT_MAP.set('Splice_Region', 5);

// frame shift indel
phantasus.MafFileReader.VARIANT_MAP.set('Frame_Shift_Del', 6);
phantasus.MafFileReader.VARIANT_MAP.set('Frame_Shift_Ins', 6);
phantasus.MafFileReader.VARIANT_MAP.set('Frameshift', 6);

// non-sense
phantasus.MafFileReader.VARIANT_MAP.set('Nonsense_Mutation', 7);
phantasus.MafFileReader.VARIANT_MAP.set('Nonsense', 7);
phantasus.MafFileReader.VARIANT_MAP.set('2DEL', 7); // homozygous deletion from oncopanel

phantasus.MafFileReader.FIELD_NAMES = [
  'Synonymous', 'In Frame Indel', 'Other Non-Synonymous',
  'Missense', 'Splice Site', 'Frame Shift', 'Nonsense'];

phantasus.MafFileReader.prototype = {
  setGeneFilter: function (geneFilter) {
    this.geneFilter = geneFilter;
  },
  getFormatName: function () {
    return 'maf';
  },
  _getGeneLevelDataset: function (datasetName, reader) {
    var _this = this;
    var tab = /\t/;
    var header = reader.readLine().split(tab);
    var headerToIndex = {};
    for (var i = 0, length = header.length; i < length; i++) {
      headerToIndex[header[i].toLowerCase()] = i;
    }
    // TODO six classes of base substitution—C>A, C>G, C>T, T>A, T>C, T>G
    // (all substitutions are referred to by the pyrimidine of the mutated
    // Watson–Crick base pair)
    // var fields = ['Hugo_Symbol', 'Chromosome', 'Start_position',
    //   'Reference_Allele', 'Tumor_Seq_Allele2',
    //   'Variant_Classification', 'Protein_Change', 'Protein_Change', 'ccf_hat',
    //   'tumor_f', 'i_tumor_f', 'Tumor_Sample_Barcode', 'tumor_name',
    //   'Tumor_Sample_UUID', 'encoding'];
    //
    var sampleField = phantasus.MafFileReader.getField([
        'Tumor_Sample_Barcode', 'tumor_name', 'Tumor_Sample_UUID'],
      headerToIndex);
    var encodingField = phantasus.MafFileReader.getField([
        'encoding'],
      headerToIndex); // gives a numeric value for string
    if (sampleField == null) {
      throw new Error('Sample id column not found.');
    }
    var encodingColumnIndex = encodingField == null ? -1 : encodingField.index;
    var sampleColumnName = sampleField.name;
    var sampleIdColumnIndex = sampleField.index;
    var tumorFractionField = phantasus.MafFileReader.getField([
      'ccf_hat',
      'tumor_f', 'i_tumor_f'], headerToIndex);
    var ccfColumnName;
    var ccfColumnIndex;
    if (tumorFractionField !== undefined) {
      ccfColumnName = tumorFractionField.name;
      ccfColumnIndex = tumorFractionField.index;
    }
    var chromosomeColumn = headerToIndex['Chromosome'.toLowerCase()];
    var startPositionColumn = headerToIndex['Start_position'
      .toLowerCase()];
    var refAlleleColumn = headerToIndex['Reference_Allele'.toLowerCase()];
    var tumorAllelColumn = headerToIndex['Tumor_Seq_Allele2'
      .toLowerCase()];

    var proteinChangeColumn = headerToIndex['Protein_Change'.toLowerCase()];
    if (proteinChangeColumn == null) {
      proteinChangeColumn = headerToIndex['Protein'.toLowerCase()];
    }

    var geneSymbolColumn = headerToIndex['Hugo_Symbol'.toLowerCase()];
    if (geneSymbolColumn == null) {
      geneSymbolColumn = headerToIndex['gene'];
    }
    if (geneSymbolColumn == null) {
      throw new Error('Gene symbol column not found.');
    }
    var variantColumnIndex = headerToIndex['Variant_Classification'
      .toLowerCase()];
    if (variantColumnIndex == null) {
      variantColumnIndex = headerToIndex['variant'
        .toLowerCase()];
    }
    if (variantColumnIndex == null) {
      throw new Error('Variant_Classification not found');
    }
    // keep fields that are in file only

    var geneSymbolToIndex = new phantasus.Map();
    var sampleIdToIndex = new phantasus.Map();
    var variantMatrix = [];
    var ccfMatrix = [];
    var s;
    var customNumberToValueMap = new phantasus.Map();

    var hasMutationInfo = chromosomeColumn !== undefined && startPositionColumn !== undefined && refAlleleColumn !== undefined && tumorAllelColumn !== undefined;
    while ((s = reader.readLine()) !== null) {
      var tokens = s.split(tab);
      var sample = String(tokens[sampleIdColumnIndex]);
      var columnIndex = sampleIdToIndex.get(sample);
      if (columnIndex === undefined) {
        columnIndex = sampleIdToIndex.size();
        sampleIdToIndex.set(sample, columnIndex);
      }
      var gene = String(tokens[geneSymbolColumn]);
      if (gene === 'Unknown') {
        continue;
      }
      if (this.geneFilter == null
        || this.geneFilter.has(tokens[geneSymbolColumn])) {
        var rowIndex = geneSymbolToIndex.get(gene);
        if (rowIndex === undefined) {
          rowIndex = geneSymbolToIndex.size();
          geneSymbolToIndex.set(gene, rowIndex);
        }
        var value = String(tokens[variantColumnIndex]);
        var variantCode;
        if (encodingColumnIndex === -1) {
          variantCode = phantasus.MafFileReader.VARIANT_MAP.get(value);
          if (variantCode === undefined) {
            variantCode = 3;
          }
        } else {
          variantCode = parseInt(tokens[encodingColumnIndex]);
          customNumberToValueMap.set(variantCode, value);
        }

        var variantObject = {};
        var Protein_Change = tokens[proteinChangeColumn];
        if (Protein_Change) {
          variantObject.Protein = String(Protein_Change);
        }
        variantObject.__v = variantCode;
        variantObject.Variant = value;
        if (hasMutationInfo) {
          variantObject.Mutation = String(tokens[chromosomeColumn]) + ':'
            + String(tokens[startPositionColumn]) + ' '
            + String(tokens[refAlleleColumn]) + ' > '
            + String(tokens[tumorAllelColumn]);
        }
        var wrappedVariant = phantasus.Util.wrapNumber(variantCode,
          variantObject);
        var variantRow = variantMatrix[rowIndex];
        if (variantRow === undefined) {
          variantRow = [];
          variantMatrix[rowIndex] = variantRow;
        }
        var ccf = -1;
        var priorCcf = -1;
        if (ccfColumnIndex !== undefined) {
          var ccfRow = ccfMatrix[rowIndex];
          if (ccfRow === undefined) {
            ccfRow = [];
            ccfMatrix[rowIndex] = ccfRow;
          }
          ccf = parseFloat(tokens[ccfColumnIndex]);
          priorCcf = ccfRow[columnIndex] || -1;
        }
        var priorValue = variantRow[columnIndex] || -1;
        if (variantCode > priorValue) { // take most severe mutation
          variantRow[columnIndex] = wrappedVariant;
          if (ccfColumnIndex !== undefined) {
            ccfRow[columnIndex] = ccf;
          }
        } else if (variantCode === priorValue && ccf > priorCcf) {
          variantRow[columnIndex] = wrappedVariant;
          ccfRow[columnIndex] = ccf;
        }
      }
    }
    var dataset = new phantasus.Dataset({
      name: datasetName,
      array: variantMatrix,
      dataType: 'Number',
      rows: geneSymbolToIndex.size(),
      columns: sampleIdToIndex.size()
    });
    var columnIds = dataset.getColumnMetadata().add('id');
    sampleIdToIndex.forEach(function (index, id) {
      columnIds.setValue(index, id);
    });
    var rowIds = dataset.getRowMetadata().add('id');
    geneSymbolToIndex.forEach(function (index, id) {
      rowIds.setValue(index, id);
    });
    for (var i = 0, nrows = dataset.getRowCount(), ncols = dataset
      .getColumnCount(); i < nrows; i++) {
      for (var j = 0; j < ncols; j++) {
        if (variantMatrix[i][j] === undefined) {
          variantMatrix[i][j] = 0;
        }
      }
    }
    if (ccfColumnIndex !== undefined) {
      dataset.addSeries({
        dataType: 'Float32',
        name: 'allelic_fraction',
        array: ccfMatrix
      });
    }
    if (this.geneFilter) {
      var orderVector = dataset.getRowMetadata().add('order');
      for (var i = 0, size = orderVector.size(); i < size; i++) {
        var gene = rowIds.getValue(i);
        var order = this.geneFilter.get(gene);
        orderVector.setValue(i, order);
      }
      var project = new phantasus.Project(dataset);
      project.setRowSortKeys([
        new phantasus.SortKey('order',
          phantasus.SortKey.SortOrder.ASCENDING)], true); // sort
      // collapsed
      // dataset
      var tmp = project.getSortedFilteredDataset();
      project = new phantasus.Project(tmp);
      var columnIndices = phantasus.Util.seq(tmp.getColumnCount());
      columnIndices
        .sort(function (a, b) {
          for (var i = 0, nrows = tmp.getRowCount(); i < nrows; i++) {
            for (var seriesIndex = 0, nseries = tmp
              .getSeriesCount(); seriesIndex < nseries; seriesIndex++) {
              var f1 = tmp.getValue(i, a, seriesIndex);
              if (isNaN(f1)) {
                f1 = Number.NEGATIVE_INFINITY;
              }
              f1 = f1.valueOf();
              var f2 = tmp.getValue(i, b, seriesIndex);
              if (isNaN(f2)) {
                f2 = Number.NEGATIVE_INFINITY;
              }
              f2 = f2.valueOf();
              var returnVal = (f1 === f2 ? 0 : (f1 < f2 ? 1
                : -1));
              if (returnVal !== 0) {
                return returnVal;
              }
            }
          }
          return 0;
        });
      dataset = new phantasus.SlicedDatasetView(dataset, null,
        columnIndices);
    }

    var fieldNames = phantasus.MafFileReader.FIELD_NAMES;
    if (customNumberToValueMap.size() > 0) {
      var pairs = [];
      customNumberToValueMap.forEach(function (value, key) {
        pairs.push({
          key: key,
          value: value
        });
      });
      pairs.sort(function (a, b) {
        return (a.key === b.key ? 0 : (a.key < b.key ? -1 : 1));
      });
      fieldNames = pairs.map(function (p) {
        return p.value;
      });
    }
    var numUniqueValues = fieldNames.length;
    phantasus.MafFileReader.summarizeMutations({
      dataset: dataset,
      fields: fieldNames
    });
    phantasus.MafFileReader
      .summarizeMutations({
        dataset: new phantasus.TransposedDatasetView(dataset),
        fields: fieldNames
      });

    var mutationSummarySelectionVector = dataset.getColumnMetadata().add('mutation_summary_selection');
    mutationSummarySelectionVector.getProperties().set(
      phantasus.VectorKeys.FIELDS,
      fieldNames);
    mutationSummarySelectionVector.getProperties().set(phantasus.VectorKeys.DATA_TYPE, '[number]');
    mutationSummarySelectionVector.getProperties().set(phantasus.VectorKeys.RECOMPUTE_FUNCTION_SELECTION, true);
    var datasetName = dataset.getName();
    mutationSummarySelectionVector.getProperties().set(phantasus.VectorKeys.FUNCTION, {
      binSize: 1,
      domain: [1, 8],
      cumulative: false
    });
    // mutationSummarySelectionVector.getProperties().set(phantasus.VectorKeys.FUNCTION, function (view, selectedDataset, columnIndex) {
    //   var sourceVector = selectedDataset.getRowMetadata().getByName('Source');
    //   var bins = new Int32Array(numUniqueValues); // 1-7
    //   for (var i = 0, nrows = selectedDataset.getRowCount(); i < nrows; i++) {
    //     var source = sourceVector.getValue(i);
    //     if (source == null || source === datasetName) {
    //       var value = selectedDataset.getValue(i, columnIndex);
    //       if (value > 0) {
    //         bins[value - 1]++;
    //       }
    //     }
    //   }
    //   return bins;
    // });

    return dataset;
  },
  read: function (fileOrUrl, callback) {
    var _this = this;
    var name = phantasus.Util.getBaseFileName(phantasus.Util
      .getFileName(fileOrUrl));
    phantasus.ArrayBufferReader.getArrayBuffer(fileOrUrl, function (err, arrayBuffer) {
      if (err) {
        callback(err);
      } else {
        try {
          callback(null, _this._getGeneLevelDataset(name,
            new phantasus.ArrayBufferReader(new Uint8Array(
              arrayBuffer))));
        }
        catch (err) {
          callback(err);
        }
      }
    });

  }
};
