"use strict";

WIDE.toolbar = (function () {
    return {
      update_scm_buttons: function () {
        var pull_button = $('#pull_button');
        var commit_button = $('#commit_button');

        if(commit_button.length == 0 && pull_button.length == 0)
          return false;

        commit_button.button().button('option', 'disabled', true).mouseout().blur();
        $.getJSON(WIDE.repository_path() + '/summary', function (response) {
          if(!response) {
            WIDE.notifications.error("An error has happened trying to get the status of the repository.");
            return false;
          }

          if(commit_button.length != 0) {
            if(response.summary['commitable?'] === true) {
              commit_button.button('option', 'disabled', false);
            } else {
              commit_button.button('option', 'disabled', true);
            }
          }

          if(pull_button.length != 0) {
            if(response.summary['unresolved?'] === true) {
              pull_button.button('option', 'disabled', true);
            } else {
              pull_button.button('option', 'disabled', false);
            }
          }
        });

        return true;
      }
    };
}());

$(function () {
    var pull_button = $('#pull_button');
    var commit_button = $('#commit_button');

    pull_button.button();
    commit_button.button();

    WIDE.toolbar.update_scm_buttons();
});
