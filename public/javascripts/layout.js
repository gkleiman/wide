"use strict";

WIDE.layout = (function () {
  var layout = function () {
    var container = $('.layout');
    var central_layout = $('#central_pane');

    container.layout({resize: false, type: 'border', vgap: 8, hgap: 8});
    central_layout.layout({resize: false, type: 'border', vgap: 8, hgap: 8});

    var tabs_h = $('#tabs').height();
    var tab_panel_w = $('.ui-tabs-panel:visible').width();
    var button_h = $('button:visible', '.ui-tabs-panel').outerHeight();
    var navbar_h = $('.ui-tabs-nav').outerHeight();

    $('.ui-tabs-panel').height(tabs_h - navbar_h);
    $('textarea:visible', '.ui-tabs-panel').height(tabs_h - navbar_h - button_h - 20);
    $('.bespin:visible', '.ui-tabs-panel').height(tabs_h - navbar_h - button_h - 20);
    $('textarea:visible', '.ui-tabs-panel').width(tab_panel_w);
    $('.bespin:visible', '.ui-tabs-panel').width(tab_panel_w);

    WIDE.editor.dimensions_changed();
  }

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
