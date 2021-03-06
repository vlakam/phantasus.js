phantasus.PcaPlotTool = function (chartOptions) {
  var _this = this;
  this.project = chartOptions.project;
  var project = this.project;
  var drawFunction = null;


  this.$el = $('<div class="container-fluid">'
    + '<div class="row">'
    + '<div data-name="configPane" class="col-xs-2"></div>'
    + '<div class="col-xs-10"><div style="position:relative;" data-name="chartDiv"></div></div>'
    + '<div class=""'
    + '</div></div>');

  var formBuilder = new phantasus.FormBuilder({
    formStyle: 'vertical'
  });
  this.formBuilder = formBuilder;
  var rowOptions = [];
  var columnOptions = [];
  var numericRowOptions = [];
  var numericColumnOptions = [];
  var options = [];
  var numericOptions = [];
  var pcaOptions = [];
  var naOptions = [{
    name: "mean",
    value: "mean"
  }, {
    name: "median",
    value: "median"
  }];
  var updateOptions = function () {
    var dataset = project.getFullDataset();
    rowOptions = [{
      name: "(None)",
      value: ""
    }];
    columnOptions = [{
      name: "(None)",
      value: ""
    }];
    numericRowOptions = [{
      name: "(None)",
      value: ""
    }];
    numericColumnOptions = [{
      name: "(None)",
      value: ""
    }];
    options = [{
      name: "(None)",
      value: ""
    }];
    numericOptions = [{
      name: "(None)",
      value: ""
    }];
    pcaOptions = [];

    for (var i = 1; i <= _this.project.getSelectedDataset().getColumnCount(); i++) {
      pcaOptions.push({
        name: "PC" + String(i),
        value: i - 1
      });
    }


    phantasus.MetadataUtil.getMetadataNames(dataset.getRowMetadata())
      .forEach(
        function (name) {
          var dataType = phantasus.VectorUtil
            .getDataType(dataset.getRowMetadata()
              .getByName(name));
          if (dataType === "number"
            || dataType === "[number]") {
            numericRowOptions.push({
              name: name + " (row)",
              value: name
            });
          }
          rowOptions.push({
            name: name + " (row)",
            value: name
          });
        });

    phantasus.MetadataUtil.getMetadataNames(dataset.getColumnMetadata())
      .forEach(
        function (name) {
          var dataType = phantasus.VectorUtil
            .getDataType(dataset.getColumnMetadata()
              .getByName(name));
          if (dataType === "number"
            || dataType === "[number]") {
            numericColumnOptions.push({
              name: name + " (column)",
              value: name
            });
          }
          columnOptions.push({
            name: name + " (column)",
            value: name
          });
        });
  };

  updateOptions();

  formBuilder.append({
    name: "size",
    type: "bootstrap-select",
    options: numericColumnOptions
  });
  formBuilder.append({
    name: "color",
    type: "bootstrap-select",
    options: columnOptions
  });
  formBuilder.append({
    name: "x-axis",
    type: "bootstrap-select",
    options: pcaOptions,
    value: 0
  });
  formBuilder.append({
    name: "y-axis",
    type: "bootstrap-select",
    options: pcaOptions,
    value: 1
  });
  formBuilder.append({
    name: "label",
    type: "bootstrap-select",
    options: columnOptions,
    value: columnOptions.indexOf('title') ? 'title' : null
  });


  function setVisibility() {
    formBuilder.setOptions("color", columnOptions, true);
    formBuilder.setOptions("size", numericColumnOptions, true);
    formBuilder.setOptions("label", columnOptions, true);
  }

  this.tooltip = [];
  formBuilder.$form.find("select").on("change", function (e) {
    setVisibility();
    drawFunction();
  });
  setVisibility();

  var trackChanged = function () {
    //// console.log("track changed");
    updateOptions();
    setVisibility();
    formBuilder.setOptions("x-axis", pcaOptions, true);
    formBuilder.setOptions("y-axis", pcaOptions, true);
  };

  project.getColumnSelectionModel().on("selectionChanged.chart", trackChanged);
  project.getRowSelectionModel().on("selectionChanged.chart", trackChanged);
  project.on("trackChanged.chart", trackChanged);
  this.$chart = this.$el.find("[data-name=chartDiv]");
  var $dialog = $('<div style="background:white;" title="Chart"></div>');
  var $configPane = this.$el.find('[data-name=configPane]');
  formBuilder.$form.appendTo($configPane);
  this.$el.appendTo($dialog);
  $dialog.dialog({
    close: function (event, ui) {
      project.off('trackChanged.chart', trackChanged);
      project.getRowSelectionModel().off('selectionChanged.chart', trackChanged);
      project.getColumnSelectionModel().off('selectionChanged.chart', trackChanged);
      _this.$el.empty();
      _this.pca = null;
    },

    resizable: true,
    height: 600,
    width: 950
  });
  this.$dialog = $dialog;

  drawFunction = this.init();
  drawFunction();
};

phantasus.PcaPlotTool.getVectorInfo = function (value) {
  var field = value.substring(0, value.length - 2);
  var isColumns = value.substring(value.length - 2) === '_c';
  return {
    field: field,
    isColumns: isColumns
  };
};
phantasus.PcaPlotTool.prototype = {
  annotate: function (options) {
    var _this = this;
    var formBuilder = new phantasus.FormBuilder();
    formBuilder.append({
      name: 'annotation_name',
      type: 'text',
      required: true
    });
    formBuilder.append({
      name: 'annotation_value',
      type: 'text',
      required: true
    });
    phantasus.FormBuilder
      .showOkCancel({
        title: 'Annotate Selection',
        content: formBuilder.$form,
        okCallback: function () {
          var dataset = options.dataset;
          var eventData = options.eventData;
          var array = options.array;
          var value = formBuilder.getValue('annotation_value');
          var annotationName = formBuilder
            .getValue('annotation_name');
          // var annotate = formBuilder.getValue('annotate');
          var isRows = true;
          var isColumns = true;
          var existingRowVector = null;
          var rowVector = null;
          if (isRows) {
            existingRowVector = dataset.getRowMetadata()
              .getByName(annotationName);
            rowVector = dataset.getRowMetadata().add(
              annotationName);
          }
          var existingColumnVector = null;
          var columnVector = null;
          if (isColumns) {
            existingColumnVector = dataset.getColumnMetadata()
              .getByName(annotationName);
            columnVector = dataset.getColumnMetadata().add(
              annotationName);
          }

          for (var p = 0, nselected = eventData.points.length; p < nselected; p++) {
            var item = array[eventData.points[p].pointNumber];
            if (isRows) {
              if (_.isArray(item.row)) {
                item.row.forEach(function (r) {
                  rowVector.setValue(r, value);
                });

              } else {
                rowVector.setValue(item.row, value);
              }

            }
            if (isColumns) {
              columnVector.setValue(item.column, value);
            }
          }
          if (isRows) {
            phantasus.VectorUtil
              .maybeConvertStringToNumber(rowVector);
            _this.project.trigger('trackChanged', {
              vectors: [rowVector],
              display: existingRowVector != null ? []
                : [phantasus.VectorTrack.RENDER.TEXT],
              columns: false
            });
          }
          if (isColumns) {
            phantasus.VectorUtil
              .maybeConvertStringToNumber(columnVector);
            _this.project.trigger('trackChanged', {
              vectors: [columnVector],
              display: existingColumnVector != null ? []
                : [phantasus.VectorTrack.RENDER.TEXT],
              columns: true
            });
          }
        }
      });

  },
  init: function () {
    var _this = this;
    var plotlyDefaults = phantasus.PcaPlotTool.getPlotlyDefaults();
    var layout = plotlyDefaults.layout;
    var config = plotlyDefaults.config;

    return function () {
      _this.$chart.empty();

      var dataset = _this.project.getSortedFilteredDataset();

      // console.log("PCAPlot :: dataset:", dataset, "trueIndices:", phantasus.Util.getTrueIndices(dataset));

      var indices = phantasus.Util.getTrueIndices(dataset);

      _this.dataset = dataset;

      var colorBy = _this.formBuilder.getValue('color');
      var sizeBy = _this.formBuilder.getValue('size');
      var getTrueVector = function (vector) {
        while (vector && vector.indices.length == 0) {
          vector = vector.v;
        }
        return vector;
      };

      _this.colorByVector = getTrueVector(dataset.getColumnMetadata().getByName(colorBy));
      var colorByVector = _this.colorByVector;
      var sizeByVector = getTrueVector(dataset.getColumnMetadata().getByName(sizeBy));

      var pc1 = _this.formBuilder.getValue('x-axis');
      var pc2 = _this.formBuilder.getValue('y-axis');

      var label = _this.formBuilder.getValue('label');
      var textByVector = getTrueVector(dataset.getColumnMetadata().getByName(label));

      var na = 'mean';
      var color = colorByVector ? [] : null;
      var size = sizeByVector ? [] : 12;
      var text = [];
      var sizeFunction = null;
      var n = indices.columns.length;


      var data = [];
      if (sizeByVector) {
        var minMax = phantasus.VectorUtil.getMinMax(sizeByVector);
        sizeFunction = d3.scale.linear().domain(
          [minMax.min, minMax.max]).range([6, 19])
          .clamp(true);
      }
      if (sizeByVector) {
        for (var j = 0; j < sizeByVector.indices.length; j++) {
          var sizeByValue = sizeByVector.getValue(j);
          size.push(sizeFunction(sizeByValue));
        }
      }
      if (textByVector) {
        for (var j = 0; j < textByVector.indices.length; j++) {
          text.push(textByVector.getValue(j));
        }
      }
      var categoriesIndices;
      var categoryNameMap;
      if (colorByVector) {
        var categories = new Map();
        categoriesIndices = new Map();
        categoryNameMap = new Map();
        var catNum = 1;
        for (var j = 0; j < colorByVector.indices.length; j++) {
          var colorByValue = colorByVector.getValue(j);
          if (!categories.get(colorByValue)) {
            categories.set(colorByValue, catNum);
            categoryNameMap.set(catNum, colorByValue);
            catNum += 1;
          }
          if (!categoriesIndices.get(categories.get(colorByValue))) {
            categoriesIndices.set(categories.get(colorByValue), []);
          }
          categoriesIndices.get(categories.get(colorByValue)).push(j);

        }

        for (var cat = 1; cat < catNum; cat++) {
          var curText = [];
          var curSize = sizeByVector ? [] : size;
          var curColor = phantasus.VectorColorModel.CATEGORY_ALL[(cat - 1) % 60];
          for (var i = 0; i < categoriesIndices.get(cat).length; i++) {
            curText.push(text[categoriesIndices.get(cat)[i]]);
            if (sizeByVector) {
              curSize.push(size[categoriesIndices.get(cat)[i]]);
            }
          }
          data.push({
            marker: {
              fillcolor: curColor,
              color: curColor,
              size: curSize
            },
            text: curText,
            type: "scatter",
            mode: "markers",
            name: categoryNameMap.get(cat)
          })
        }
      } else {
        data.push({
          marker: {
            color: color,
            size: size
          },
          name: " ",
          mode: "markers",
          text: text,
          type: "scatter"
        });
      }

      _this.categoriesIndices = categoriesIndices;
      var columnIndices = indices.columns;
      var rowIndices = indices.rows;

      if (columnIndices.length == 1) {
        new Error("Not enough columns (at least 2 required)");
        return;
      }

      var expressionSetPromise = dataset.getESSession();

      expressionSetPromise.then(function (essession) {
        var label_array = [];
        var anchor_array = [];
        var links, labels;

        var args = {
          es: essession,
          replacena: na
        };
        if (columnIndices && columnIndices.length > 0) {
          args.columns = columnIndices;
        }
        if (rowIndices && rowIndices.length > 0) {
          args.rows = rowIndices;
        }

        var prepareLabelData = function () {
          if (!label) {
            return;
          }

          label_array = data.map(function (type) {
            var result = type.x.map(function (x, idx) {
              return {
                x: x,
                y: type.y[idx],
                name: type.text[idx]
              };
            });
            type.text = null;
            return result;
          });
          anchor_array = data.map(function (type) {
            return type.x.map(function (x, idx) {
              return {
                x: x,
                y: type.y[idx],
                r: type.marker.size
              };
            });
          });
          anchor_array = [].concat.apply([], anchor_array);
          label_array = [].concat.apply([], label_array);
        };

        var putLabels = function () {
          if (!label) {
            return;
          }

          var plot = _this.$chart.children()[0];
          var xrange = plot._fullLayout.xaxis.range;
          var yrange = plot._fullLayout.yaxis.range;
          var svg = d3.select('.cartesianlayer .subplot .gridlayer');
          svg.selectAll(".label").data([]).exit().remove();
          svg.selectAll(".link").data([]).exit().remove();

          var tempLabels = label_array.filter(function (label) {
            return label.x >= xrange[0] && label.x <= xrange[1] && label.y >= yrange[0] && label.y <= yrange[1];
          }).map(function (label) {
            return {x: plot._fullLayout.xaxis.l2p(label.x), y: plot._fullLayout.yaxis.l2p(label.y), name: label.name};
          });

          var tempAnchors = anchor_array.filter(function (anchor) {
            return anchor.x >= xrange[0] && anchor.x <= xrange[1] && anchor.y >= yrange[0] && anchor.y <= yrange[1];
          }).map(function (anchor) {
            return {x: plot._fullLayout.xaxis.l2p(anchor.x), y: plot._fullLayout.yaxis.l2p(anchor.y), r: anchor.r};
          });

          // Draw labels
          labels = svg.selectAll(".label")
            .data(tempLabels)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr('text-anchor', 'start')
            .text(function (d) {
              return d.name;
            })
            .attr("x", function (d) {
              return (d.x);
            })
            .attr("y", function (d) {
              return (d.y);
            })
            .attr("fill", "black");

          // Size of each label
          var index = 0;
          labels.each(function () {
            tempLabels[index].width = this.getBBox().width;
            tempLabels[index].height = this.getBBox().height;
            index += 1;
          });

          // Draw links
          links = svg.selectAll(".link")
            .data(tempLabels)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("x1", function (d) {
              return (d.x);
            })
            .attr("y1", function (d) {
              return (d.y);
            })
            .attr("x2", function (d) {
              return (d.x);
            })
            .attr("y2", function (d) {
              return (d.y);
            })
            .attr("stroke-width", 0.6)
            .attr("stroke", "gray");

          d3.labeler()
            .label(tempLabels)
            .anchor(tempAnchors)
            .width(plot._fullLayout._size.w)
            .height(plot._fullLayout._size.h)
            .force_bounds(true)
            .start(1000);

          labels
            .transition()
            .duration(800)
            .attr("x", function (d) {
              return (d.x);
            })
            .attr("y", function (d) {
              return (d.y);
            });

          links
            .transition()
            .duration(800)
            .attr("x2", function (d) {
              return (d.x);
            })
            .attr("y2", function (d) {
              return (d.y);
            });
        };

        var drawResult = function () {
          var x = _this.pca.pca[pc1];
          var y = _this.pca.pca[pc2];
          if (_this.colorByVector) {
            for (var cat = 1; cat <= _this.categoriesIndices.size; cat++) {
              var curX = [];
              var curY = [];
              for (var j = 0; j < _this.categoriesIndices.get(cat).length; j++) {
                curX.push(x[_this.categoriesIndices.get(cat)[j]]);
                curY.push(y[_this.categoriesIndices.get(cat)[j]]);
              }
              data[cat - 1].x = curX;
              data[cat - 1].y = curY;
            }
          }
          else {
            data[0].x = x;
            data[0].y = y;
          }
          layout.margin = {
            b: 40,
            l: 60,
            t: 25,
            r: 10
          };
          layout.xaxis = {
            title: _this.pca.xlabs[pc1],
            zeroline: false
          };
          layout.yaxis = {
            title: _this.pca.xlabs[pc2],
            zeroline: false
          };
          layout.showlegend = true;
          layout.config = config;
          layout.data = data;
          var $chart = $('<div></div>');
          var myPlot = $chart[0];
          $chart.appendTo(_this.$chart);

          layout.showlegend = !(size === 12 && color == null);

          prepareLabelData();
          Plotly.newPlot(myPlot, data, layout, config).then(putLabels);
          myPlot.on('plotly_afterplot', putLabels);
        };


        if (!_this.pca) {
          var req = ocpu.call("calcPCA", args, function (session) {
            session.getObject(function (success) {
              _this.pca = JSON.parse(success);
              drawResult();
            });

          }, false, "::" + dataset.getESVariable());
          req.fail(function () {
            new Error("PcaPlot call failed" + req.responseText);
          });
        } else {
          drawResult();
        }
      });


      expressionSetPromise.catch(function (reason) {
        alert("Problems occured during transforming dataset to ExpressionSet\n" + reason);
      });

    };
  }
};


phantasus.PcaPlotTool.getPlotlyDefaults = function () {
  var layout = {
    hovermode: 'closest',
    autosize: true,
    // paper_bgcolor: 'rgb(255,255,255)',
    // plot_bgcolor: 'rgb(229,229,229)',
    showlegend: false,
    margin: {
      l: 80,
      r: 10,
      t: 8, // leave space for modebar
      b: 14,
      autoexpand: true
    },
    titlefont: {
      size: 12
    },
    xaxis: {
      zeroline: false,
      titlefont: {
        size: 12
      },
      // gridcolor: 'rgb(255,255,255)',
      showgrid: true,
      //   showline: true,
      showticklabels: true,
      tickcolor: 'rgb(127,127,127)',
      ticks: 'outside'
    },
    yaxis: {
      zeroline: false,
      titlefont: {
        size: 12
      },
      // gridcolor: 'rgb(255,255,255)',
      showgrid: true,
      //   showline: true,
      showticklabels: true,
      tickcolor: 'rgb(127,127,127)',
      ticks: 'outside'
    }
  };

  // var toImage = {
  //   name: 'toImage',
  //   title: 'Download plot as a svg',
  //   icon: Icons.camera,
  //   click: function (gd) {
  //     var format = 'svg';
  //     Lib.notifier('Taking snapshot - this may take a few seconds', 'long');
  //     downloadImage(gd, {'format': format})
  //     .then(function (filename) {
  //       Lib.notifier('Snapshot succeeded - ' + filename, 'long');
  //     })
  //     .catch(function () {
  //       Lib.notifier('Sorry there was a problem downloading your snapshot!', 'long');
  //     });
  //   }
  // };
  var config = {
    modeBarButtonsToAdd: [],
    showLink: false,
    displayModeBar: true, // always show modebar
    displaylogo: false,
    staticPlot: false,
    showHints: true,
    modeBarButtonsToRemove: ['sendDataToCloud', 'zoomIn2d', 'zoomOut2d', 'hoverCompareCartesian', 'hoverClosestCartesian']
  };
  return {
    layout: layout,
    config: config
  };
};
