WIDE.toolbar = (function () {
  var setConfirmUnload = function (on) {
    if (on) {
      window.onbeforeunload = unloadMessage;
    } else {
      window.onbeforeunload = null;
    }
  }

  var unloadMessage = function () {
    return "You have modified a file. If you navigate away from this page without first saving it, the changes will be lost.";
  }

  var unhover_buttons = function () {
    $('#toolbar button').removeClass('ui-state-hover');

    return true;
  };

  return {
    update_scm_buttons: function () {
      var pull_button = $('#pull_button');
      var commit_button = $('#commit_button');
      var revert_button = $('#revert_button');

      if(commit_button.length === 0 && pull_button.length === 0 && revert_button.length === 0) {
        return false;
      }

      revert_button.button().button('option', 'disabled', true).mouseout().blur();
      commit_button.button().button('option', 'disabled', true).mouseout().blur();
      $.getJSON(WIDE.repository_path() + '/summary', function (response) {
        if(!response) {
          WIDE.notifications.error("An error has happened trying to get the status of the repository.");
          return false;
        }

        if(commit_button.length !== 0) {
          if(response.summary['commitable?'] === true) {
            revert_button.button('option', 'disabled', false).mouseout().blur();
            commit_button.button('option', 'disabled', false).mouseout().blur();
          } else {
            revert_button.button('option', 'disabled', true).mouseout().blur();
            commit_button.button('option', 'disabled', true).mouseout().blur();
          }
        }

        if(pull_button.length !== 0) {
          if(response.summary['unresolved?'] === true) {
            pull_button.button('option', 'disabled', true).mouseout().blur();
          } else {
            pull_button.button('option', 'disabled', false).mouseout().blur();
          }
        }
      });

      unhover_buttons();

      return true;
    },
    update_save_buttons: function () {
      var save_button = $('#save_button');
      var save_all_button = $('#save_all_button');
      var current_editor = WIDE.editor.get_current_editor();

      if(current_editor !== undefined) {
        if(current_editor.modified === true) {
          save_button.button('option', 'disabled', false).mouseout().blur();
        } else {
          save_button.button('option', 'disabled', true).mouseout().blur();
        }
      } else {
        save_button.button('option', 'disabled', true).mouseout().blur();
      }

      if(WIDE.editor.modified_editors() === true) {
        save_all_button.button('option', 'disabled', false).mouseout().blur();
        setConfirmUnload(true);
      } else {
        save_all_button.button('option', 'disabled', true).mouseout().blur();
        setConfirmUnload(false);
      }

      unhover_buttons();

      return true;
    }
  };
}());

$(function () {
  $('#log_button').button({
    icons: {
      primary: 'ui-icon-clock'
    }
  }).click(function () {
    window.location = WIDE.repository_path() + '/changesets';
  });

  $('#pull_button').button();
  $('#commit_button').button({
    icons: {
      primary: 'ui-icon-check'
    }
  });
  $('#revert_button').button({
    icons: {
      primary: 'ui-icon-arrowreturnthick-1-s'
    }
  });

  $('#save_button').button({
    icons: {
      primary: 'ui-icon-disk'
    }
  }).click(function () {
    $(this).button('option', 'disabled', true).mouseout().blur();
    WIDE.editor.save_current();
  });

  $('#save_all_button').button().click(function () {
    $(this).button('option', 'disabled', true).mouseout().blur();
    WIDE.editor.save_all();
  });

  WIDE.toolbar.update_scm_buttons();
  WIDE.toolbar.update_save_buttons();
});
