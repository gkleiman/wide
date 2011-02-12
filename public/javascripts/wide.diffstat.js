$(function () {
  $('.view-diff').live('click', function (event) {
    var parent_row = $(this).parents('tr');
    var path = parent_row.data('path');

    $(this).removeClass('view-diff')
    .addClass('hide-diff')
    .text('(Hide diff)');

    if (!parent_row.next().hasClass('diff')) {
      parent_row.after(
        $('<tr />')
        .addClass('diff')
        .addClass('CodeRay')
        .append(
          $('<td colspan="4" />')
          .append(
            $('<pre />').addClass('loading').text('Loading...')
          )
        )
      );

      WIDE.file(path).diff(function (data) {
          $('pre', parent_row.next()).removeClass('loading').html(data);
        }, function (data) {
          WIDE.notifications.error('Error diffing: ' + path);

          return false;
      });
    } else {
      parent_row.next().toggle().find('pre').slideToggle('slow');
    }

    event.stopPropagation();

    return false;
  });

  $('.hide-diff').live('click', function (event) {
    $(this)
      .removeClass('hide-diff')
      .addClass('view-diff')
      .text('(Show diff)')
      .parents('tr').next().find('pre')
      .slideToggle('slow', function () {
        $(this).parents('tr').toggle();
      });

      event.stopPropagation();

      return false;
  });

  $('.diffstat-table tr').live('click', function (event) {
    var checkbox = $(this).find(':checkbox');

    if(event.target === checkbox[0]) {
      // Don't prevent the checkbox from working.
      return true;
    }

    checkbox.attr('checked', !checkbox.is(':checked'));

    event.stopPropagation();
    event.preventDefault();

    return false;
  });
});
