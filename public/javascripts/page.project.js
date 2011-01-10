$(function () {
  if($('#tabs').length > 0) {
    $('#tabs').tabs({
tabTemplate: '<li><a href="#{href}">#{label}</a> <span class="ui-icon ui-icon-throbber" style="display: none;">Activity in progress...</span><span class="ui-icon ui-icon-close">Remove Tab</span></li>',
      add: function (event, ui) {
        $('#tabs').tabs('select', '#' + ui.panel.id);
      },
      show: function (event, ui) {
        WIDE.editor.dimensions_changed();
        WIDE.toolbar.update_save_buttons();
        WIDE.editor.focus();
      }
    }).hide();

    $('#tabs span.ui-icon-close').live('click', function () {
      var index = $('#tabs li').index($(this).parent());

      WIDE.editor.remove_editor(index);
      $('#tabs').tabs('remove', index);

      if($('#tabs li').children().length === 0) {
        $('#tabs').hide();
      }
    });
  }

  $('.remove_link').live('click', function () {
    $(this).prev("input[type=hidden]").val("1");
    $(this).closest(".fields").hide();

    return false;
  });

  $('table').delegate('tr.ui-state-default', 'hover', function (){
    $(this).toggleClass('ui-state-hover');
    return true;
  });

  $('#projects table tbody tr').click(function (event) {
    if (event.target.nodeName === 'A') {
      return true;
    }

    window.location = $(this).find('a:eq(0)').attr('href');

    event.preventDefault();
    event.stopPropagation();

    return false;
  });
});
