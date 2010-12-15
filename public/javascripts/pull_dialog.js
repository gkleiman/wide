"use strict";

$(function () {
  var pull_button = $('#pull_button');
  var pull_dialog = $('#pull_dialog');

  // Pull dialog
  pull_dialog.dialog({
    title: 'Pull changes',
    modal: true,
    width: 500,
    autoOpen: false,
    resizable: false,
    buttons: {
      Pull: function () {
        $('form', pull_dialog).submit();
        $(this).dialog('close');
      },
      Cancel: function () {
        $(this).dialog('close');
        pull_button.button('option', 'disabled', false);
      }
    }
  });

  pull_button.click(function () {
    pull_button.attr('disabled', 'disabled');
    pull_dialog.dialog('open');

    return false;
  });

  pull_dialog.bind('dialogclose', function (event, ui) {
    pull_button.mouseout().blur();
  });


  pull_dialog.bind('ajax:success', function (data, result, xhr) {
    var report_pull_error = function () {
      WIDE.notifications.error('Pull from ' + $('input[name=url]', pull_dialog).val() + ' failed.');
    };

    result = $.parseJSON(result);

    if(!result.success || result.async_op_status.status === 'error') {
      report_pull_error();

      WIDE.toolbar.update_scm_buttons();
      return false;
    }

    var process_pull_result = function (result) {
      if(result.success && result.async_op_status.status === 'success') {
        WIDE.notifications.success('Pull successfull.');
        WIDE.tree.refresh();
      } else {
        report_pull_error();
      }

      WIDE.toolbar.update_scm_buttons();
    };

    WIDE.notifications.activity_started('Pulling from ' + $('input[name=url]', pull_dialog).val() + ' ...');

    WIDE.async_op.poll_async_op(result.async_op_status.updated_at, process_pull_result, report_pull_error);
  });
});
