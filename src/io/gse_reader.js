phantasus.GseReader = function (options) {
  this.type = options.type;
};
phantasus.GseReader.prototype = {
  read: function (name, callback) {
    var req = ocpu.call('loadGEO', {name: name, type: this.type}, function (session) {
      session.getObject(function (success) {
        console.log('phantasus.GseReader.prototype.read ::', success);
        var files = JSON.parse(success);
        console.log('phantasus.GseReader.prototype.read ::', 'files', files);
        var r = new FileReader();
        for (var i = 0; i < files.length; i++) {
          var filePath = phantasus.Util.getFilePath(session, files[i][0]);
          console.log('phantasus.GseReader.prototype.read ::', filePath);
          r.onload = function (e) {
            var contents = e.target.result;
            var ProtoBuf = dcodeIO.ProtoBuf;
            ProtoBuf.protoFromFile("./message.proto", function (error, success) {
              if (error) {
                alert(error);
                console.log("GSEReader ::", "ProtoBuilder failed", error);
                return;
              }
              var builder = success,
                rexp = builder.build("rexp"),
                REXP = rexp.REXP,
                rclass = REXP.RClass;


              var res = REXP.decode(contents);

              var jsondata = phantasus.Util.getRexpData(res, rclass);

              var flatData = jsondata.data.values;
              var nrowData = jsondata.data.dim[0];
              var ncolData = jsondata.data.dim[1];
              var flatPdata = jsondata.pdata.values;
              //var participants = jsondata.participants.values;
              var annotation = jsondata.fdata.values;
              console.log(annotation);
              var id = jsondata.rownames.values;
              var metaNames = jsondata.colMetaNames.values;
              var rowMetaNames = jsondata.rowMetaNames.values;

              var matrix = [];
              for (var i = 0; i < nrowData; i++) {
                var curArray = new Float32Array(ncolData);
                for (var j = 0; j < ncolData; j++) {
                  curArray[j] = flatData[i + j * nrowData];
                }
                matrix.push(curArray);
              }
              var dataset = new phantasus.Dataset({
                name: name,
                rows: nrowData,
                columns: ncolData,
                array: matrix,
                dataType: 'Float32',
                esSession: session,
                isGEO: true,
                esVariable: 'es_' + (i + 1)
              });


              /*console.log("phantasus.GseReader.prototype.read ::", "input list", res);
               console.log("phantasus.GseReader.prototype.read ::", "metaNames", metaNames);
               console.log("phantasus.GseReader.prototype.read ::", dataset);*/
              /*var columnsIds = dataset.getColumnMetadata().add('id');
              for (var i = 0; i < ncolData; i++) {
                columnsIds.setValue(i, phantasus.Util.copyString(participants[i]));
              }*/
              //console.log(flatPdata);
              for (var i = 0; i < metaNames.length; i++) {
                var curVec = dataset.getColumnMetadata().add(metaNames[i]);
                for (var j = 0; j < ncolData; j++) {
                  curVec.setValue(j, flatPdata[j + i * ncolData]);
                }
              }

              var rowIds = dataset.getRowMetadata().add('id');

              /*if (annotation) {
                var rowSymbol = dataset.getRowMetadata().add('symbol');
              }*/
              for (var i = 0; i < rowMetaNames.length; i++) {
                var curVec = dataset.getRowMetadata().add(rowMetaNames[i]);
                for (var j = 0; j < nrowData; j++) {
                  curVec.setValue(j, annotation[j + i * nrowData]);
                  rowIds.setValue(j, id[j])
                }
              }
              phantasus.MetadataUtil.maybeConvertStrings(dataset.getRowMetadata(), 1);
              phantasus.MetadataUtil.maybeConvertStrings(dataset.getColumnMetadata(),
                1);
              callback(null, dataset);

            });
          };

          phantasus.BlobFromPath.getFileObject(filePath, function (file) {
            //console.log('phantasus.GseReader.prototype.read ::', file);
            r.readAsArrayBuffer(file);
          });
        }
      })
    });
    req.fail(function () {
      callback(req.responseText);
      //console.log('phantasus.GseReader.prototype.read ::', req.responseText);
    });

  },
  _parse: function (text) {

  }
};