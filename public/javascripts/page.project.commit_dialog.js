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
    $('#commit_button').button('option', 'disabled', true).removeClass('ui-state-hover');

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
});
