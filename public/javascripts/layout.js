$(function() {
  var container = $('.layout');

  function layout() {
    container.layout({resize: false, type: 'border', vgap: 8, hgap: 8});
  }

  $('.west').resizable({
    handles: 'e',
    helper: 'ui-resizable-helper-west',
    stop: layout
  });
  $(window).resize(layout);
  layout();
});
