$(function () {
  // Revert dialog
  $('#revert_dialog').dialog({
    title: 'Revert changes',
    modal: true,
    width: 800,
    autoOpen: false,
    buttons: {
      Revert: function () {
        $('#revert_dialog form').submit();
        $(this).dialog('close');
      },
      Cancel: function () {
        $(this).dialog('close');
        $('#revert_dialog form').get(0).reset();
      }
    }
  }).bind('dialogclose', function (event, ui) {
    $('#revert_button').mouseout().blur();
    $('#revert_button').button('option', 'disabled', false);
  });

  $('#revert_button').click(function () {
    $('#revert_button').button('option', 'disabled', true).removeClass('ui-state-hover');

    $('#revert_dialog #revert-summary').load(WIDE.repository_path() + '/status', function (response, status, xhr) {
      if(status !== 'error') {
        $('#revert_dialog').dialog('open');
      }
    });

    return false;
  });

  $('#revert_dialog form').bind('ajax:success', function (xhr, result, status) {
    if(result.success) {
      $(this).get(0).reset();
      WIDE.tree.refresh();
      WIDE.notifications.success('Revert successfull.');
    } else {
      WIDE.notifications.error('Revert failed.');
    }

    WIDE.toolbar.update_scm_buttons();

    return true;
  });
});

