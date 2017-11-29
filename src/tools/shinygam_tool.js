phantasus.shinyGamTool = function () {
};
phantasus.shinyGamTool.prototype = {
  toString: function () {
    return "Submit to Shiny GAM";
  },
  gui: function () {
    return [];
  },
  init: function (heatMap, form) {
    form.appendContent('<p>Are you sure you want to submit to Shiny GAM analysis?</p>');
    form.appendContent('<span class="phantasus-warning-color">Warning:</span>Result will open in a new window automatically. <br/>' +
      'Also your browser might be irresponsive for an amount of time');
  },
  execute: function (options) {
    var rows = phantasus.Dataset.toJSON(options.project.getSortedFilteredDataset()).rowMetadataModel.vectors;
    var fvarLabels = rows.map(function (row) {
      return row.name
    });
    var fData = rows.reduce(function (acc, currentRow, index) {
      acc[currentRow.name] = currentRow.array;
      return acc;
    }, {});
    var promise = $.Deferred();

    ocpu.call('shinyGAMAnalysis', {
      fData: fData,
      fvarLabels: fvarLabels,
      orgCode: "mmu"
    }, function (context) {
      context.getObject('.val', null, function (link) {
        window.open(link.split('"')[1], '_blank');
      });
      promise.resolve();
    }).fail(function () {
      console.error('Failed to submit to shiny GAM analysis. Reason: ' + req.responseText);
      promise.reject();
    });

    return promise;
  }
};
