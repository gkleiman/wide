"use strict";

WIDE.toolbar = (function () {
    return {
      update_scm_buttons: function () {
        var pull_button = $('#pull_button');
        var commit_button = $('#commit_button');

        if(commit_button.length === 0 && pull_button.length === 0) {
          return false;
        }

        commit_button.button().button('option', 'disabled', true).mouseout().blur();
        $.getJSON(WIDE.repository_path() + '/summary', function (response) {
          if(!response) {
            WIDE.notifications.error("An error has happened trying to get the status of the repository.");
            return false;
          }

          if(commit_button.length !== 0) {
            if(response.summary['commitable?'] === true) {
              commit_button.button('option', 'disabled', false).mouseout().blur();
            } else {
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

        return true;
      },
      update_save_buttons: function () {
        var save_button = $('#save_button');
        var save_all_button = $('#save_all_button');
        var current_editor = WIDE.editor.get_current_editor();

        if(current_editor !== undefined) {
          if(current_editor.modified === true) {
            save_button.button('option', 'disabled', false).mouseout().blur();
            save_all_button.button('option', 'disabled', false).mouseout().blur();

            return;
          } else {
            save_button.button('option', 'disabled', true).mouseout().blur();
          }
        } else {
          save_button.button('option', 'disabled', true).mouseout().blur();
        }

        if(WIDE.editor.modified_editors() === true) {
          save_all_button.button('option', 'disabled', false).mouseout().blur();
        } else {
          save_all_button.button('option', 'disabled', true).mouseout().blur();
        }
      }
    };
}());

$(function () {
    $('#pull_button').button();
    $('#commit_button').button();
    $('#save_button').button().click(function () {
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
