phantasus.HistoryTool = function () {
};
phantasus.AdjustDataTool.prototype = {
  toString: function () {
    return 'History'
  },
  init: function(project, form, initOptions) {
    if (initOptions.heatMap) {
      form.setValue('current_history', heatMap.getHistory());
    }
  },
  gui: function () {
    return [{
      name: 'current_history',
      type: 'text',
      value: this.history
    }]
  }
};
