WIDE.compiler_output = (function () {
  var row_tmpl = '<tr class="ui-state-default"><td class="col0"><span class="ui-icon ui-icon-${icon_name}"></span></td><td class="col1">${description}</td><td class="col2">${resource}</td><td class="col3">${line}</td></tr>';
  var current_row;

  $(document).bind('keydown', 'up', function (event) {
    if ($('#compiler_output_table').hasClass('focused')) {
      if (current_row && current_row.prev().length > 0) {
        current_row.prev().click();
      }

      event.stopPropagation();

      return false;
    }

    return true;
  }).bind('keydown', 'down', function (event) {
    var compiler_output_rows;

    if ($('#compiler_output_table').hasClass('focused')) {
      if (current_row && current_row.next().length > 0) {
        current_row.next().click();
      } else {
        compiler_output_rows = $('#compiler_output_rows').children();
        if (compiler_output_rows.length > 0) {
          compiler_output_rows.first().click();
        }
      }

      event.stopPropagation();

      return false;
    }

    return true;
  }).bind('keydown', 'return', function (event) {
    var compiler_output_rows;

    if ($('#compiler_output_table').hasClass('focused')) {
      if (current_row) {
        current_row.dblclick();
      } else {
        compiler_output_rows = $('#compiler_output_rows').children();
        if (compiler_output_rows.length > 0) {
          compiler_output_rows.last().click();
        }
      }

      event.stopPropagation();

      return false;
    }

    return true;
  }).click(function (event) {
    var target = $(event.target);

    if (target.parents("#compiler_output_table").length > 0) {
      WIDE.tree.unset_focus();
      $('#compiler_output_table').addClass('focused');
    } else {
      $('#compiler_output_table').removeClass('focused');
    }

    return true;
  });

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
        $(this).removeClass('ui-state-hover');

        return true;
      }, function () {
        $(this).addClass('ui-state-hover');

        return true;
      }).click(function () {
        WIDE.tree.unset_focus();

        $('tr', '#compiler_output_rows').removeClass('ui-state-focus');
        $(this).toggleClass('ui-state-focus');

        current_row = $(this);

        return true;
      }).dblclick(function () {
        WIDE.tree.unset_focus();

        $('tr', '#compiler_output_rows').removeClass('ui-state-focus');
        $(this).toggleClass('ui-state-focus');

        if($(this).attr('line_number') && $(this).attr('line_number') >= 0) {
          WIDE.editor.edit_file($(this).attr('path'), Number($(this).attr('line_number')));
        }

        current_row = $(this);

        return true;
      }).appendTo($('#compiler_output_rows'));

      $('.header_container table').width($('.y-scroll table').outerWidth());
    },
    clear: function () {
      $('#compiler_output_rows').html('');
      current_row = undefined;
    }
  };
}());

/*
$(function() {
    var element = $('#compiler_output_table');
    var make_column_resizeable = function (column_number) {
      $(".th" + column_number, element).resizable({
              alsoResize: '#compiler_output_table .header-container',
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
