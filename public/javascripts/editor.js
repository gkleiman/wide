"use strict";

WIDE.editor = (function () {
  var edit_form_tmpl = '<form accept-charset="UTF-8" action="${WIDE.repository_path()}/save_file" data-remote="true" method="post"><input name="utf8" type="hidden" value="&#x2713;" /><input name="${csrf_param}" type="hidden" value="${csrf_token}" /> <button name="save_button">Save ${file_name}</button><input name="project_id" type="hidden" value="${project_id}" /><input name="path" type="hidden" value="${path}" /><textarea name="content"></textarea></form>';

  var initialize_editor = function (node, after_init) {
    var firstWindowOnBespinLoad;

    function init() {
        bespin.useBespin(node, {
            stealFocus: true,
            syntax: 'c_cpp'
        }).then(function (env) {
          // Get the editor.
          node.bespin = env;
          if(after_init !== undefined) {
            after_init.call();
          }
        }, function (error) {
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
        window.onBespinLoad = function () { init(after_init) };
    }
    // If there is already a function listening to the `window.onBespinLoad`
    // function, then create a new function that calls the old
    // `window.onBespinLoad` function first and the `init` function later.
    else {
        firstWindowOnBespinLoad = window.onBespinLoad;
        window.onBespinLoad = function () {
            firstWindowOnBespinLoad();
            init(after_init);
        }
    }
  }

  var prepare_save = function(editor) {
    var save_button = editor.find('[name=save_button]');
    var fail_func = function (data, result, xhr) {
      alert('Error saving: ' + editor.path);
      save_button.button('option', 'disabled', false).mouseout();

      return false;
    };
    editor.bind('ajax:failure', function () { fail_func(); });

    editor.bind('ajax:success', function (data, result, xhr) {
      result = $.parseJSON(result);

      if(result.success) {
          WIDE.tree.refresh();
          WIDE.commit.update_commit_button();
      } else {
        fail_func(data, result, xhr);
      }
      save_button.button('option', 'disabled', false).mouseout();

      return false;
    });

    save_button.button().click(function () {
      save_button.button('option', 'disabled', true);
      editor.submit();
      return false;
    });
  }

  var create_editor = function(options) {
    var replacements = {csrf_token: WIDE.csrf_token(), csrf_param: WIDE.csrf_param(), project_id: WIDE.project_id()};
    var aux = $.tmpl(edit_form_tmpl, $.extend(options, replacements));
    var content = aux.find('textarea');
    var save_button = aux.find('[name=save_button]');

    content.val(options.data);
    aux.path = options.path;
    aux.file_name = options.file_name;

    save_button.button().button('option', 'disabled', true).hide();

    var after_init = function () {
      save_button.button('option', 'disabled', false).button('option', 'label', 'Save: ' + aux.file_name).show();
      prepare_save(aux);
      content.get(0).bespin.dimensionsChanged();
      content.get(0).bespin.editor.focus = true;
    }

    if($('#tabs li').children().length === 0) {
      $('#tabs').show();
    }
    $('#tabs').tabs('add', '#editor-tab-' + editors.length, aux.file_name);
    aux.appendTo($('#editor-tab-' + editors.length));
    initialize_editor(content.get(0), after_init);

    return aux;
  }

  var editors = [];

  return {
    new_editor: function (options) {
      var editor, file_names, editor_index;

      // If there's already an editor for the given filename, then select its tab.
      file_names = $.map(editors,
          function (value, index) {
            return value.file_name;
          });
      editor_index = $.inArray(options.file_name, file_names);
      if(editor_index !== -1) {
        $('#tabs').tabs('select', '#editor-tab-' + editor_index);

        return null;
      }

      editor = create_editor(options);

      editor = $.extend(editor,
        {
          editor_env: function () {
            return $(this).find('textarea').get(0).bespin;
          },
          editor: function() {
            var env = this.editor_env();
            if(env === undefined) {
              return undefined;
            }
            return env.editor;
          },
          dimensions_changed: function () {
            env = this.editor_env();
            if(env !== undefined) {
              env.dimensionsChanged();
            }
          },
        });

      editors[editors.length] = editor;

      return editor;
    },
    dimensions_changed: function () {
      var i;
      for(i = 0; i < editors.length; i++) {
        editors[i].dimensions_changed();
      }
    },
    remove_editor: function(index) {
      editors.splice(index, 1);
    }
  };
}());

$(function () {
});
