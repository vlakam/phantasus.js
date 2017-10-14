phantasus.DiscreteColorSchemeChooser = function (options) {
  var formBuilder = new phantasus.FormBuilder();
  var map = options.colorScheme.scale;

  formBuilder.append({
    name: 'selected_value',
    type: 'bootstrap-select',
    options: map.keys()
  });
  var $select = formBuilder.find('selected_value');
  formBuilder.append({
    style: 'max-width:50px;',
    name: 'selected_color',
    type: 'color'
  });
  var selectedVal = $select.val();
  var _this = this;
  var $color = formBuilder.find('selected_color');
  $color.val(map.get(selectedVal));
  $color.on('change', function (e) {
    var color = $(this).val();
    map.set(selectedVal, color);
    _this.trigger('change', {
      value: selectedVal,
      color: color
    });
  });
  $select.on('change', function () {
    selectedVal = $select.val();
    var c = map.get(selectedVal);
    $color.val(c);
  });
  this.$div = formBuilder.$form;
};
phantasus.DiscreteColorSchemeChooser.prototype = {};
phantasus.Util.extend(phantasus.DiscreteColorSchemeChooser, phantasus.Events);
