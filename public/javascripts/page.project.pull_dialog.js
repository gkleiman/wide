$(function () {
  var pull_button = $('#pull_button');
  var pull_dialog = $('#pull_dialog');

  var report_pull_error = function () {
    WIDE.notifications.error('Pull from ' + $('input[name=url]', pull_dialog).val() + ' failed.');
    pull_button.button('option', 'disabled', false);
  };

  $("#pull_urls").combobox();

  // Pull dialog
  pull_dialog.dialog({
    title: 'Pull changes',
    modal: true,
    width: 800,
    autoOpen: false,
    resizable: true,
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
  }).bind('dialogclose', function (event, ui) {
    pull_button.mouseout().blur().button('option', 'disabled', false);
  });

  pull_button.click(function () {
    pull_button.button('option', 'disabled', true).removeClass('ui-state-hover');
    pull_dialog.dialog('open');

    return false;
  });

  $('form', pull_dialog).bind('ajax:beforeSend', function () {
    if ($('input[name=url]', pull_dialog).val().length === 0) {
      WIDE.notifications.error('A URL is needed to pull from another repository');

      pull_dialog.dialog('close');

      return false;
    }

    pull_dialog.dialog('close');
    pull_button.mouseout().blur().button('option', 'disabled', true);

    return true;
  }).bind('ajax:error', function (data, result, xhr) {
    report_pull_error();
  }).bind('ajax:success', function (data, result, xhr) {
    if(!result.success || result.async_op_status.status === 'error') {
      report_pull_error();

      WIDE.toolbar.update_scm_buttons();

      return false;
    }

    var process_pull_result = function (result) {
      if(result.success && result.async_op_status.status === 'success') {
        WIDE.notifications.success('Pull successful.');
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
