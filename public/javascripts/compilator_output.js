"use strict";

WIDE.compilator_output = (function () {
  var row_tmpl = '<tr class="ui-state-default"><td class="col0"><span class="ui-icon ui-icon-${icon_name}"></span></td><td class="col1">${description}</td><td class="col2">${resource}</td><td class="col3">${line}</td></tr>';

  return {
    add_output: function (row_data) {
      var row;

      switch (row_data.type) {
        case 'warning':
          row_data.icon_name = 'alert';
          break;
        case 'error':
          row_data.icon_name = 'circle-minus';
          break;
        case 'info':
          row_data.icon_name = 'info';
          break;
      }

      row = $.tmpl(row_tmpl, row_data);
      row.attr('file_name', row_data.resource);
      row.attr('path', row_data.resource);
      row.attr('line_number', row_data.line);

      row.hover(function () {
        $(this).toggleClass('ui-state-hover');

        return false;
      });
      row.click(function () {
        $('tr', '#compilator_output_rows').removeClass('ui-state-focus');
        $(this).toggleClass('ui-state-focus');

        return false;
      });
      row.dblclick(function () {
        $('tr', '#compilator_output_rows').removeClass('ui-state-focus');
        $(this).toggleClass('ui-state-focus');

        if($(this).attr('line_number') && $(this).attr('line_number') >= 0) {
          WIDE.editor.edit_file($(this).attr('path'), Number($(this).attr('line_number')));
        }

        return false;
      });
      row.appendTo($('#compilator_output_rows'));
    },
    clear: function () {
      $('#compilator_output_rows').html('');
    }
  };
}());

/*
$(function() {
    var element = $('#compilator_output_table');
    var make_column_resizeable = function (column_number) {
      $(".th" + column_number, element).resizable({
              alsoResize: '#compilator_output_table .header-container',
              stop: function(event, ui) {
                      var width1 = $(".th" + column_number, element).width();
                      $('.col' + column_number, element).width(width1);
                      width1 = $(".header-container", element).width();
                      $('.y-scroll', element).width(width1);
              },
              handles: 'e'});
    };
      make_column_resizeable(i)
});
*/
