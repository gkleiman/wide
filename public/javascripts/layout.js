"use strict";

WIDE.layout = (function () {
  var layout = function () {
    var container = $('.layout');
    var central_layout = $('#central_pane');
    var tab_panel = $('.ui-tabs-panel');
    var height_difference, tabs_h, navbar_h, form_w, tab_panel_border,
        tab_panel_padding;

    container.layout({resize: false, type: 'border', hgap: 8});
    central_layout.layout({resize: false, type: 'border', vgap: 8, hgap: 8});

    // Some dark magic to make the editor resize
    tabs_h = $('#tabs').height();
    navbar_h = $('.ui-tabs-nav').outerHeight();
    form_w = $('form:visible', '.ui-tabs-panel').width();

    tab_panel.height(tabs_h - navbar_h);

    tab_panel_border = tab_panel.border();
    tab_panel_padding = tab_panel.padding();

    height_difference = tab_panel_border.bottom + tab_panel_border.top +
                        tab_panel_padding.bottom + tab_panel_padding.top;

    $('.ui-tabs-panel').height(tabs_h - navbar_h - height_difference);
    $('form', '.ui-tabs-panel').height(tabs_h - navbar_h - height_difference);
    $('textarea:visible', '.ui-tabs-panel').height(tabs_h - navbar_h - height_difference - 5).width(form_w + 1);
    $('.bespin:visible', '.ui-tabs-panel').height(tabs_h - navbar_h - height_difference - 5).width(form_w + 1);

    WIDE.editor.dimensions_changed();
  };

  return {
    layout: function() { layout(); }
  };
}());

$(function () {
  $('.south').resizable({
    handles: 'n',
    helper: 'ui-resizable-helper-north',
    stop: WIDE.layout.layout
  });
  $('.west').resizable({
    handles: 'e',
    helper: 'ui-resizable-helper-west',
    stop: WIDE.layout.layout
  });
  $(window).resize(WIDE.layout.layout);

  WIDE.layout.layout();
});
