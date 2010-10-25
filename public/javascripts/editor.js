"use strict";

WIDE.editor = (function() {
  var initialize_editor = function(after_init) {
    var firstWindowOnBespinLoad;

    function init() {
        bespin.useBespin('content', {
            stealFocus: true,
            syntax: 'c_cpp'
        }).then(function(env) {
          // Get the editor.
          $('#content').get(0).bespin = env;
          if(after_init !== undefined) {
            after_init.call();
          }
        }, function(error) {
            throw new Error("Launch failed: " + error);
        });
    }

    // Check if Bespin is already loaded or currently loading. In this case,
    // bind the init function to the `load` promise.
    if (typeof bespin != 'undefined' && typeof bespin.loaded != 'undefined') {
        bespin.loaded.then(init);
    }
    // If the `window.onBespinLoad` function is undefined, we can set the init
    // function so that it is called when Bespin is loaded.
    else if (typeof window.onBespinLoad == 'undefined') {
        window.onBespinLoad = function() { init(after_init) };
    }
    // If there is already a function listening to the `window.onBespinLoad`
    // function, then create a new function that calls the old
    // `window.onBespinLoad` function first and the `init` function later.
    else {
        firstWindowOnBespinLoad = window.onBespinLoad;
        window.onBespinLoad = function() {
            firstWindowOnBespinLoad();
            init(after_init);
        }
    }
  }

  var editor_env = function() {
    return $('#content').get(0).bespin;
  }

  return {
    dimensions_changed: function() {
      env = editor_env();
      if(env !== undefined) {
        env.dimensionsChanged();
      }
    },
    editor: function() {
      var env = editor_env();
      if(env === undefined) {
        return undefined;
      }
      return env.editor;
    },
    open_file: function (options) {
      var after_init = function() {
        $('#path').val(options.path);
        $('#save_button').button('option', 'disabled', false).button('option', 'label', 'Save: ' + options.file_name).show();
        $('#editor_form').show();
        WIDE.editor.dimensions_changed();
        WIDE.editor.editor().focus = true;
      }

      $('#save_button').button('option', 'disabled', true).hide();

      if(this.editor() === undefined) {
        $('#content').val(options.data);
        initialize_editor(after_init);
      } else {
        this.editor().value = options.data;
        after_init.call();
      }
    },
    save_file: function () {
      // FIXME fugly function
      var path = $('#path').val();
      var content = $('#content').val();

      $('#save_button').button('option', 'disabled', true);
      $.post(
        WIDE.repository_path() + '/save_file',
        { path: path,
          content: content },
        function (r) {
          $('#save_button').button('option', 'disabled', false).mouseout();
          if(!r.success) {
            alert('Error saving file');
          } else {
            WIDE.tree.refresh();
            WIDE.commit.update_commit_button();
          }
        }
      );
    }
  };
}());

$(function() {
  $('#editor_form').hide();
  $('#save_button').button().click(function() { WIDE.editor.save_file(); return false; });
});
