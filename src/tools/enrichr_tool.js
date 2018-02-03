phantasus.enrichrTool = function () {
};


function parseData(data, column_with_gene_symbols, strategy) {
  var targetData = (_.findWhere(data.rowMetadataModel.vectors, {name: column_with_gene_symbols}) || {array: []}).array;

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
      name: 'column_with_gene_symbols',
      options: rows,
      value: _.last(rows),
      type: 'select'
    }, {
      name: 'ambiguous_genes_strategy',
      type: 'select',
      tooltipHelp: 'Sometimes gene symbol cell contains multiple values separated by \'///\'',
      options: [{
        name: 'omit',
        value: 'omit'
      }, {
        name: 'split',
        value: 'split'
      }]
    }, {
      name: 'preview_data',
      type: 'select',
      style: 'height: auto; max-height: 600px; overflow-x: auto; overflow-y: hidden;',
      multiple: true,
      disabled: true, //READ-ONLY
    }];
  },
  init: function (project, form) {
    var data = phantasus.Dataset.toJSON(project.getSelectedDataset());

    if (data.rows >= 10000) {
      throw new Error('Invalid amount of rows are selected (0 <= n <= 10000)');
    }

    var columnSelect = form.$form.find("[name=column_with_gene_symbols]");
    var strategySelect = form.$form.find("[name=ambiguous_genes_strategy]");
    var previewData = form.$form.find('[name=preview_data]');

    var onSelect = function () {
      var newOptions = [parseData(data, $(columnSelect).val(), $(strategySelect).val()).join(' ')];

      form.setOptions('preview_data', newOptions);
      //previewData[0].size = Math.max(newOptions.length, 5);
      previewData[0].size = 2;
    };

    columnSelect.on('change', onSelect);
    strategySelect.on('change', onSelect);

    onSelect();
    form.$form.find('[data-toggle="tooltip"]').tooltip();
    form.appendContent('<div class="col-xs-8 col-xs-offset-4">Result will open in a new window automatically.</div>');
  },
  execute: function (options) {
    var ENRICHR_URL = 'http://amp.pharm.mssm.edu/Enrichr/addList';
    var data = phantasus.Dataset.toJSON(options.project.getSelectedDataset());
    var promise = $.Deferred();

    var formData = new FormData();
    formData.append('list', parseData(data, options.input.column_with_gene_symbols, options.input.ambiguous_genes_strategy).join('\n'));
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
