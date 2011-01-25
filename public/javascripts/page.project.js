$(function () {
  $('table').delegate('tr.ui-state-default', 'hover', function () {
    $(this).toggleClass('ui-state-hover');
    return true;
  });
});
