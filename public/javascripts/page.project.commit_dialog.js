$(function () {
  // Commit dialog
  $('#commit_dialog').dialog({
    title: 'Commit changes',
    modal: true,
    width: 800,
    autoOpen: false,
    buttons: {
      Commit: function () {
        $('#commit_dialog form').submit();
        $(this).dialog('close');
      },
      Cancel: function () {
        $(this).dialog('close');
        $('#commit_dialog form').get(0).reset();
      }
    }
  }).bind('dialogclose', function (event, ui) {
    $('#commit_button').mouseout().blur();
    $('#commit_button').button('option', 'disabled', false);
  }).bind('dialogopen', function (event, ui) {
    var value = $('#commit_dialog textarea').focus();
  });

  $('#commit_button').click(function () {
    $('#commit_button').attr('disabled', 'disabled');

    $('#commit_dialog #commit-summary').load(WIDE.repository_path() + '/status', function (response, status, xhr) {
      if(status !== 'error') {
        $('#commit_dialog textarea').placeholder('Type your commit message here.');

        $('#commit_dialog').dialog('open');
      }
    });

    return false;
  });

  $('#commit_dialog form').bind('ajax:beforeSend', function () {
    var value = $('#commit_dialog textarea').val();
    if(value === 'Type your commit message here.' || value === '' || $('#commit_dialog input:checked').length === 0) {
      return false;
    }

    return true;
  }).bind('ajax:success', function (xhr, result, status) {
    if(result.success) {
      $(this).get(0).reset();
      WIDE.tree.refresh();
      WIDE.notifications.success('Commit successfull.');
    } else {
      WIDE.notifications.error('Commit failed.');
    }

    WIDE.toolbar.update_scm_buttons();

    return true;
  });

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

  $('#diffstat-table tr').live('click', function (event) {
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
