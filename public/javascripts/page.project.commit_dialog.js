$(function () {
  // Commit dialog
  $('#commit_dialog').dialog({
    title: 'Commit changes',
    modal: true,
    width: 500,
    autoOpen: false,
    buttons: {
      Commit: function () {
        $('#commit_dialog form').submit();
        $(this).dialog('close');
        WIDE.toolbars.update_scm_buttons();
      },
      Cancel: function () {
        $(this).dialog('close');
        $('#commit_dialog form').get(0).reset();
      }
    }
  });

  $('#commit_button').click(function () {
    $('#commit_button').attr('disabled', 'disabled');
    $('#commit_dialog pre.description').load(
    WIDE.repository_path() + '/status', function (response, status, xhr) {
      if(status !== 'error') {
        $('#commit_dialog textarea').placeholder('Type your commit message here.');

        $('#commit_dialog').dialog('open');
      }

      $('#commit_button').button('option', 'disabled', false);
    });

    return false;
  });

  $('#commit_dialog').bind('ajax:before', function () {
    var value = $('#commit_dialog textarea').val();
    if(value === 'Type your commit message here.' || value === '') {
      return false;
    }

    return true;
  }).bind('dialogclose', function (event, ui) {
    $('#commit_button').mouseout().blur();
  });


  $('#commit_dialog').bind('ajax:success', function () {
    $('#commit_dialog form').get(0).reset();
    WIDE.tree.refresh();
  });
});
