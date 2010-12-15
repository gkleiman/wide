"use strict";

WIDE.async_op = (function () {
  var async_op_in_progress = false;

  return {
    poll_async_op: function (timestamp, after_operation, error) {
      var perform_poll = function () {
        $.getJSON(WIDE.repository_path() + '/async_op_status',
          function (response) {
            if(!response || !response.success) {
              async_op_in_progress = false;
              error.call();

              return false;
            }

            if(response.async_op_status.updated_at > timestamp) {
              async_op_in_progress = false;
              after_operation(response);
            } else {
              setTimeout(perform_poll, 5000);
            }
        });
      };

      async_op_in_progress = true;
      perform_poll();
    },
    is_async_op_in_progress: function () {
      return async_op_in_progress === true;
   }
  };
}());
