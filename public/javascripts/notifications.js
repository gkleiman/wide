"use strict"

WIDE.notifications = (function () {
    var delay = 10000;
    var notification_div;

    var set_notification_div = function () {
      notification_div = notification_div || $('#notification');

      return notification_div;
    };

    var add_notification = function (notification_type, message) {
        var div_class = (notification_type === 'success') ? 'ui-state-highlight' : 'ui-state-error';
        var icon_class = (notification_type === 'success') ? 'ui-icon-info' : 'ui-icon-alert';
        var set_message_and_display;

        set_notification_div();

        set_message_and_display = function () {
          notification_div
            .clearQueue()
            .html("<span class='ui-icon " + icon_class + "'></span>" + message)
            .removeClass('ui-state-error ui-state-highlight')
            .addClass(div_class)
            .fadeIn('fast')
            .delay(delay)
            .fadeOut('fast')
        }

        if(notification_div.css('display') !== 'hidden') {
          notification_div
            .clearQueue()
            .fadeOut('fast', set_message_and_display);
        } else {
          set_message_and_display();
        }
    };

    return {
      success: function (message) {
        add_notification('success', message);
      },
      error: function (message) {
        add_notification('error', message);
      },
      hide: function () {
        $('#notification').clearQueue().fadeOut('fast');
      }
    };
}());
