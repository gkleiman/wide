"use strict";

WIDE.compile = (function () {
  var compilation_in_progress = false;

  return {
    poll_compilator_output: function (timestamp) {
      var perform_poll = function () {
        $.getJSON(WIDE.base_path() + '/compiler_output',
          function (response) {
            if(!response || !response.success) {
              compilation_in_progress = false;

              WIDE.notifications.error('Compilation failed.');

              return false;
            }

            if(response.compile_status.updated_at > timestamp) {
              compilation_in_progress = false;

              $('#compile_button').button('option', 'disabled', false);
              WIDE.notifications.success('Compilation finished.');

              WIDE.compilator_output.clear();
              for(var i = 0; i < response.compile_status.output.length; ++i) {
                WIDE.compilator_output.add_output(response.compile_status.output[i]);
              }
            } else {
              setTimeout(function () { WIDE.compile.poll_compilator_output(timestamp) }, 5000);
            }
        });
      };

      compilation_in_progress = true;
      perform_poll();
    },
    is_compilation_in_progress: function () {
      return compilation_in_progress == true;
   },
   compile: function () {
      var error_handler = function (xhr, textStatus, errorThrown) {
        WIDE.notifications.error('Compilation failed.');
      };

      $('#compile_button').button('option', 'disabled', true).mouseout().blur();
      WIDE.notifications.activity_started('Compiling ...');

      $.ajax({
        url: WIDE.base_path() + '/compile',
        type: 'POST',
        dataType: 'json',
        success: function (response, textStatus, xhr) {
          if(!response.success || (response && response.compile_status.status == 'error')) {
            error_handler();

            return false;
          } else {
            WIDE.compile.poll_compilator_output(response.compile_status.updated_at);
          }
        },
        error: error_handler
      });
    }
  };
}());

$(function () {
    $('#compile_button').button({ icons: { primary: 'ui-icon-gear' } }).click(function () {
      WIDE.compile.compile();
    });
});
