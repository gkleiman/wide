(function ($) {
  var show_placeholder_if_blank = function (o, text) {
    if(o.val() === '') {
      o.val(text).css('color', '#b7b7b7').css('font-style', 'italic');
    }
  }

  var clear_placeholder_if_not_blank = function (o, text) {
    if(o.val() === text) {
      o.val('').css('color', '').css('font-style', 'normal');
    }
  }

  $.fn.placeholder = function (text) {
    var t = $(this);
    var id = t.attr('id');

    show_placeholder_if_blank(t, text);
    t.focus(function () {
      clear_placeholder_if_not_blank($(this), text);
    }).blur(function () {
      show_placeholder_if_blank($(this), text);
    });

    return this;
  };
})(jQuery);

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

  $('table').delegate('tr.ui-state-default', 'hover', function (){
    $(this).toggleClass('ui-state-hover');
    return true;
  });
});
