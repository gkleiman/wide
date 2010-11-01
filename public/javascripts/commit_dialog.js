"use strict";

WIDE.commit = (function () {
  return {
    update_commit_button: function () {
      if($('#commit_button').length == 0)
        return false;

      $('#commit_button').button().button('option', 'disabled', true).mouseout().blur();
      $.getJSON(WIDE.repository_path() + '/is_clean', function (response) {
        if(response.clean == true) {
          $('#commit_button').button('option', 'disabled', true);
        } else {
          $('#commit_button').button('option', 'disabled', false);
        }
      });

      return true;
    }
  };
}());

$(function () {
  // Commit dialog
  $('#commit_dialog').dialog({
    title: 'Commit changes',
    modal: true,
    width: 500,
    autoOpen: false,
    buttons: {
      Commit: function () { $('#commit_dialog form').submit(); $(this).dialog('close'); update_commit_button(); },
      Cancel: function () { $(this).dialog('close'); $('#commit_dialog form').get(0).reset(); }
    }
  });

  $('#commit_button').click(function () {
    $('#commit_button').attr('disabled', 'disabled');
    $('#commit_dialog pre.description').load(
      WIDE.repository_path() + '/status',
      function (response, status, xhr) {
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
    if(value === 'Type your commit message here.' || value == '')
      return false;
    return true;
  }).bind('dialogclose', function (event, ui) {
    $('#commit_button').mouseout().blur();
  });


  $('#commit_dialog').bind('ajax:success', function () {
    WIDE.tree.refresh();
  });


  WIDE.commit.update_commit_button();
});
