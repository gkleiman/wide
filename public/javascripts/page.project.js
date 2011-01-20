$(function () {
  $('table').delegate('tr.ui-state-default', 'hover', function () {
    $(this).toggleClass('ui-state-hover');
    return true;
  });

  $('#projects table tbody tr.success').live('click', function (event) {
    if (event.target.nodeName === 'A') {
      return true;
    }

    window.location = $(this).find('a:eq(0)').attr('href');

    event.preventDefault();
    event.stopPropagation();

    return false;
  });
});
