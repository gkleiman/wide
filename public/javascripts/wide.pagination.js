$(function () {
  $('.pagination').addClass('ui-widget');
  $('.pagination .previous_page').addClass('ui-widget');
  $('.pagination a').addClass('ui-widget-content ui-state-default');
  $('.pagination span').addClass('ui-widget-content ui-state-disabled');
  $('.pagination em').addClass('ui-widget-content ui-state-active');

  $('.pagination > .ui-state-default').hover(function () {
    $(this).toggleClass('ui-state-hover');

    return true;
  });
});
