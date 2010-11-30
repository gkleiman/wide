"use strict";

WIDE.editor = (function () {
  var edit_form_tmpl = '<form accept-charset="UTF-8" action="${WIDE.repository_path()}/save_file" data-remote="true" method="post"><input name="utf8" type="hidden" value="&#x2713;" /><input name="${csrf_param}" type="hidden" value="${csrf_token}" /><input name="project_id" type="hidden" value="${project_id}" /><input name="path" type="hidden" value="${path}" /><textarea name="content"></textarea></form>';

  var initialize_editor = function (node, after_init) {
    var firstWindowOnBespinLoad;

    function init() {
        bespin.useBespin(node, {
            stealFocus: true
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

  var prepare_save = function (editor) {
    //var save_button = editor.find('[name=save_button]');
    var fail_func = function (data, result, xhr) {
      WIDE.notifications.error('Error saving: ' + editor.path);
      //save_button.button('option', 'disabled', false).mouseout();

      return false;
    };
    var mark_tab_as_clean = function () {
      editor.modified = false;
      editor.title.text(editor.file_name);

      editor.find('textarea').get(0).bespin.editor.textChanged.add(editor.mark_tab_as_dirty);
    };

    editor.bind('ajax:failure', function () { fail_func(); });

    editor.bind('ajax:success', function (data, result, xhr) {
      result = $.parseJSON(result);

      if(result.success) {
          mark_tab_as_clean();

          WIDE.tree.refresh();
          WIDE.commit.update_commit_button();
      } else {
        fail_func(data, result, xhr);
      }
      //save_button.button('option', 'disabled', true).mouseout();

      return false;
    });

    //save_button.button().click(function () {
      //save_button.button('option', 'disabled', true);
      //editor.submit();
      //editor.editor().focus = true;

      //return false;
    //});
  }

  var set_syntax_highlighting = function (editor, file_name) {
    var extension = file_name.substr(file_name.lastIndexOf(".") + 1);
    var syntax;

    switch(extension) {
      case 'h':
      case 'hpp':
      case 'c':
      case 'cpp':
        syntax = 'c_cpp';
        break;
      case 'js':
        syntax = 'js';
        break;
      case 'html':
        syntax = 'html';
        break;
    }

    if(syntax) {
      editor.syntax = syntax;
    }
  }

  var edit_file = function(path, line_number) {
    var file = WIDE.file(path);
    var file_names, editor_index;
    var editor;

    // If there's already an editor for the given filename, then select its tab.
    file_names = $.map(editors,
        function (value, index) {
          return value.file_name;
        });
    editor_index = $.inArray(file.file_name(), file_names);
    if(editor_index !== -1) {
      $('#tabs').tabs('select', '#editor-tab-' + editor_index);
      if(line_number !== undefined) {
        editor = editors[editor_index].editor();
        editor.setLineNumber(line_number);
        editor.focus = true;
      }
      return null;
    }

    WIDE.notifications.success('Loading ' + path + ' ...');
    file.cat(
      function (data) {
        WIDE.notifications.hide();
        new_editor({path: path, file_name: file.file_name(), data: data, line_number: line_number});
      },
      function (data) {
        WIDE.notifications.error('Error opening: ' + path);

        return false;
      }
    );
  }

  var create_editor = function(options) {
    var replacements = {csrf_token: WIDE.csrf_token(), csrf_param: WIDE.csrf_param(), project_id: WIDE.project_id()};
    var aux = $.tmpl(edit_form_tmpl, $.extend(options, replacements));
    var content = aux.find('textarea');
    //var save_button = aux.find('[name=save_button]');

    content.val(options.data);
    aux.path = options.path;
    aux.file_name = options.file_name;

    //save_button.button().button('option', 'disabled', true).hide();
    //save_button.button('option', 'disabled', true).button('option', 'label', 'Save: ' + aux.file_name).show();

    if($('#tabs li').children().length === 0) {
      $('#tabs').show();
    }
    $('#tabs').tabs('add', '#editor-tab-' + editors.length, aux.file_name);
    aux.containing_tab = $('#editor-tab-' + editors.length);
    aux.appendTo(aux.containing_tab);

    var after_init = function () {
      var env = content.get(0).bespin;

      env.dimensionsChanged();
      env.editor.focus = true;

      set_syntax_highlighting(env.editor, aux.file_name);

      aux.title = $('#tabs > ul.ui-tabs-nav > li > a[href=#' + aux.containing_tab[0].id + ']');
      aux.mark_tab_as_dirty = function () {
        env.editor.textChanged.remove(aux.mark_tab_as_dirty);

        aux.modified = true;
        aux.title.text(aux.file_name + ' +');
        //aux.find('[name=save_button]').button('option', 'disabled', false);
      }
      aux.modified = false;

      prepare_save(aux);
      env.editor.textChanged.add(aux.mark_tab_as_dirty);

      if(options.line_number !== undefined) {
        env.editor.setLineNumber(options.line_number);
      }
    }

    WIDE.layout.layout();
    initialize_editor(content.get(0), after_init);

    return aux;
  }

  var new_editor = function (options) {
    var editor;

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
          var env = this.editor_env();
          if(env !== undefined) {
            env.dimensionsChanged();
          }
        },
      });

    editors[editors.length] = editor;

    return editor;
  };

  var editors = [];

  return {
    edit_file: function (path, line_number) {
      return edit_file(path, line_number);
    },
    dimensions_changed: function () {
      for(var i = 0; i < editors.length; i++) {
        if(editors[i].is(':visible')) {
          editors[i].dimensions_changed();
        }
      }
    },
    focus: function () {
      for(var i = 0; i < editors.length; i++) {
        if(editors[i].is(':visible')) {
          editors[i].editor().focus = true;
        }
      }
    },
    remove_editor: function(index) {
      editors.splice(index, 1);
    }
  };
}());
