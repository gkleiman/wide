WIDE.compile = (function () {
  var POLL_TIME = 3000;
  var compilation_in_progress = false;
  var compilation_start_time = 0;

  var error_handler = function (xhr, textStatus, errorThrown) {
    compilation_in_progress = false;
    WIDE.notifications.error('Compilation failed.');
    $('#compile_button').button('option', 'disabled', false);
  };

  $(document).ajaxError(function (e, xhr, settings, exception) {
    if (settings.url == WIDE.base_path() + '/compiler_output') {
      error_handler();
    }
  });

  return {
    poll_compiler_output: function (timestamp) {
      var perform_poll = function () {
        $.getJSON(WIDE.base_path() + '/compiler_output', function (response) {
          if(!response || !response.success) {
            error_handler();
          }

          if(response.compile_status.updated_at > timestamp) {
            compilation_in_progress = false;

            WIDE.notifications.success('Compilation finished.');

            WIDE.compiler_output.clear();
            for(var i = 0; i < response.compile_status.output.length; ++i) {
              WIDE.compiler_output.add_output(response.compile_status.output[i]);
            }

            $('#compile_button').button('option', 'disabled', false);

            if(response.compile_status.status === 'success') {
              document.location.href = encodeURI(WIDE.base_path() + '/download_binary');
              WIDE.compiler_output.add_output({
                type: 'info',
                description: 'Compilation successfull, downloading the binary file.'
              });
            }
          } else {
            // Consider the compilation as timed out after two minutes.
            if ((new Date().getTime() - compilation_start_time) > 120000) {
              error_handler();
            } else {
              setTimeout(function () {
                perform_poll();
              }, POLL_TIME);
            }
          }
        });
      };

      compilation_start_time = new Date().getTime();
      compilation_in_progress = true;
      perform_poll();
    },
    is_compilation_in_progress: function () {
      return compilation_in_progress === true;
    },
    compile: function (save_files_if_modified) {
      if (WIDE.editor.modified_editors()) {
        if (save_files_if_modified) {
          WIDE.notifications.activity_started('Saving all files before running the compiler...');
          WIDE.editor.save_all();
          compilation_start_time = new Date().getTime();
        }

        if ((new Date().getTime() - compilation_start_time) > 30000) {
          error_handler();
        } else {
          setTimeout(function () { WIDE.compile.compile(false); }, 1000);
        }

        return false;
      }

      WIDE.compiler_output.clear();
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
            WIDE.compile.poll_compiler_output(response.compile_status.updated_at);
          }
        },
        error: error_handler
      });

      return true;
    }
  };
}());

$(function () {
  $('#compile_button').button({
    icons: {
      primary: 'ui-icon-gear'
    }
  }).click(function () {
    $('#compile_button').button('option', 'disabled', true).mouseout().blur();
    WIDE.compile.compile(true);
  });
});
