phantasus.enrichrTool = function () {
};


function parseData(data, column_name, strategy) {
  var targetData = (_.findWhere(data.rowMetadataModel.vectors, {name: column_name}) || {array: []}).array;

  return _.reduce(targetData, function (acc, geneRow) {
    if (!_.isString(geneRow)) { // rows are not strings???
      acc.push(geneRow);
      return acc;
    }

    var isAmbiguousGene = geneRow.indexOf('///') !== -1;
    if (isAmbiguousGene && strategy === 'split') {
      acc = acc.concat(geneRow.split('///'));
    } else if (!isAmbiguousGene) {
      acc.push(geneRow);
    }

    return acc;
  }, []);
}


phantasus.enrichrTool.prototype = {
  toString: function () {
    return 'Submit to Enrichr';
  },
  gui: function (project) {
    var dataset = project.getSortedFilteredDataset();
    var rows = phantasus.MetadataUtil.getMetadataNames(dataset
      .getRowMetadata());
    return [{
      name: 'column_name',
      options: rows,
      value: rows[0],
      type: 'select'
    }, {
      name: 'ambiguous_genes_strategy',
      type: 'select',
      options: [{
        name: 'ignore',
        value: 'ignore'
      }, {
        name: 'split',
        value: 'split'
      }]
    }, {
      name: 'preview_data',
      type: 'select',
      style: 'height: auto; max-height: 600px;',
      multiple: true,
      disabled: true, //READ-ONLY
    }];
  },
  init: function (project, form) {
    var data = phantasus.Dataset.toJSON(project.getSelectedDataset());

    if (data.rows >= 10000) {
      throw new Error('Invalid amount of rows are selected (0 <= n <= 10000)');
    }

    var columnSelect = form.$form.find("[name=column_name]");
    var strategySelect = form.$form.find("[name=ambiguous_genes_strategy]");
    var previewData = form.$form.find('[name=preview_data]');

    var onSelect = function () {
      var newOptions = parseData(data, $(columnSelect).val(), $(strategySelect).val());

      form.setOptions('preview_data', newOptions);
      previewData[0].size = Math.max(newOptions.length, 5);
    };

    columnSelect.on('change', onSelect);
    strategySelect.on('change', onSelect);

    onSelect();
  },
  execute: function (options) {
    var ENRICHR_URL = 'http://amp.pharm.mssm.edu/Enrichr/addList';
    var data = phantasus.Dataset.toJSON(options.project.getSelectedDataset());
    var promise = $.Deferred();

    var formData = new FormData();
    formData.append('list', parseData(data, options.input.column_name, options.input.ambiguous_genes_strategy).join('\n'));
    formData.append('description', options.project.getSelectedDataset().getName());

    $.ajax({
      type: "POST",
      url: ENRICHR_URL,
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: function (data) {
        data = JSON.parse(data);
        window.open('http://amp.pharm.mssm.edu/Enrichr/enrich?dataset=' + data.shortId, '_blank');
        promise.resolve();
      },
      error: function (_,__,error) {
        promise.reject();
        throw new Error(error);
      }
    });

    return promise;
  }
};
