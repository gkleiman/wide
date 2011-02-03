WIDE.notifications = (function () {
  var delay = 10000, notification_wrapper, notification_div;

  var set_notification_div = function () {
    notification_div = notification_div || $('#notification');
    notification_wrapper = notification_wrapper || $('#notification-wrapper');
  };

  var add_notification = function (notification_type, message, fade_out) {
    var div_class = (notification_type === 'error') ? 'ui-state-error' : 'ui-state-highlight';
    var icon_class;
    var set_message_and_display;

    switch (notification_type) {
      case 'error':
        icon_class = 'ui-icon-alert';
        break;
      case 'activity':
        icon_class = 'ui-icon-gear';
        break;
      case 'success':
        icon_class = 'ui-icon-info';
        break;
    }

    set_notification_div();

    set_message_and_display = function () {
      notification_div.clearQueue()
        .html("<span class='ui-icon " + icon_class + "'></span>" + message)
        .removeClass('ui-state-error ui-state-highlight')
        .addClass(div_class)
        .show();

        notification_wrapper.css('margin-left', - notification_div.width() / 2);

      if(fade_out) {
        notification_div.delay(delay).fadeOut('fast');
      }
    };

    if(notification_div.css('display') !== 'hidden') {
      notification_div.clearQueue().fadeOut('fast', set_message_and_display);
    } else {
      set_message_and_display();
    }
  };

  return {
    success: function (message) {
      add_notification('success', message, true);
    },
    activity_started: function (message) {
      add_notification('activity', message, false);
    },
    error: function (message) {
      add_notification('error', message, true);
    },
    hide: function () {
      $('#notification').clearQueue().fadeOut('fast');
    }
  };
}());

$(function () {
  var notification_div = $('#notification');

  if(!notification_div.hasClass('ui-helper-hidden')) {
    notification_div.delay(10000).fadeOut('fast');
  }
});
