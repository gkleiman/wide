WIDE.editor = (function () {
  var edit_form_tmpl = '<form accept-charset="UTF-8" action="${WIDE.repository_path()}/save_file" data-remote="true" data-type="json" method="post"><input name="utf8" type="hidden" value="&#x2713;" /><input name="${csrf_param}" type="hidden" value="${csrf_token}" /><input name="project_id" type="hidden" value="${project_id}" /><input name="path" type="hidden" value="${path}" /><textarea name="content"></textarea></form>';

  var editors = [];

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
    if(typeof bespin !== 'undefined' && typeof bespin.loaded !== 'undefined') {
      bespin.loaded.then(init);
    } else if(typeof window.onBespinLoad === 'undefined') {
      // If the `window.onBespinLoad` function is undefined, we can set the init
      // function so that it is called when Bespin is loaded.
      window.onBespinLoad = function () {
        init(after_init);
      };
    } else {
      // If there is already a function listening to the `window.onBespinLoad`
      // function, then create a new function that calls the old
      // `window.onBespinLoad` function first and the `init` function later.
      firstWindowOnBespinLoad = window.onBespinLoad;
      window.onBespinLoad = function () {
        firstWindowOnBespinLoad();
        init(after_init);
      };
    }
  };

  var prepare_save = function (editor) {
    var fail_func = function (data, result, xhr) {
      WIDE.notifications.error('Error saving: ' + editor.path);

      WIDE.toolbar.update_save_buttons();

      return false;
    };

    editor.save = function () {
      if(editor.modified === true) {
        $(editor).submit();
      }

      return editor;
    };

    $(editor).bind('ajax:failure', function () {
      fail_func();
    });

    $(editor).bind('ajax:success', function (xhr, result, status) {
      if(result.success) {
        editor.mark_tab_as_clean();

        WIDE.toolbar.update_scm_buttons();
      } else {
        fail_func(data, result, xhr);
      }

      WIDE.tree.refresh();
      WIDE.toolbar.update_save_buttons();

      return false;
    });
  };

  var set_syntax_highlighting = function (editor, file_name) {
    var extension = file_name.substr(file_name.lastIndexOf(".") + 1);
    var syntax;

    switch (extension) {
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
  };

  var edit_file = function (path, line_number) {
    var file = WIDE.file(path);
    var file_names, editor_index;
    var editor;

    // If there's already an editor for the given filename, then select its tab.
    file_names = $.map(editors, function (value, index) {
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
      new_editor({
        path: path,
        file_name: file.file_name(),
        data: data,
        line_number: line_number
      });
    }, function (data) {
      WIDE.notifications.error('Error opening: ' + path);

      return false;
    });
  };

  var create_editor = function (options) {
    var replacements = {
      csrf_token: WIDE.csrf_token(),
      csrf_param: WIDE.csrf_param(),
      project_id: WIDE.project_id()
    };
    var aux = $.tmpl(edit_form_tmpl, $.extend(options, replacements));
    var content;

    // Create a new tab
    if($('#tabs li').children().length === 0) {
      $('#tabs').show();
    }
    $('#tabs').tabs('add', '#editor-tab-' + editors.length, options.file_name);

    // Append the form/editor to the tab
    aux.appendTo('#editor-tab-' + editors.length);

    // Get the new instance of the form
    aux = $('form', '#editor-tab-' + editors.length)[0];

    // Add some attributes to the editor
    aux.containing_tab = $('#editor-tab-' + editors.length);
    aux.tab_title = $('#tabs > ul.ui-tabs-nav > li > a[href=#' + aux.containing_tab[0].id + ']');
    aux.path = options.path;
    aux.file_name = options.file_name;
    aux.modified = false;

    // Set the content of the editor
    content = $('textarea', aux);
    content.val(options.data);

    var after_init = function () {
      var env = content.get(0).bespin;

      // Add the env as an easy to access attr of the editor.
      aux.env = env;

      env.dimensionsChanged();
      env.editor.focus = true;

      set_syntax_highlighting(env.editor, aux.file_name);

      aux.mark_tab_as_clean = function () {
        env.editor.textChanged.add(aux.mark_tab_as_dirty);

        aux.modified = false;
        aux.tab_title.text(aux.file_name);

        WIDE.toolbar.update_save_buttons();
      };

      aux.mark_tab_as_dirty = function () {
        env.editor.textChanged.remove(aux.mark_tab_as_dirty);

        aux.modified = true;
        aux.tab_title.text(aux.file_name + ' +');

        WIDE.toolbar.update_save_buttons();
      };

      prepare_save(aux);
      env.editor.textChanged.add(aux.mark_tab_as_dirty);

      if(options.line_number !== undefined) {
        env.editor.setLineNumber(options.line_number);
      }

      $('textarea', aux).bind('keydown', 'Ctrl+s', function () {
        WIDE.editor.save_current();

        return false;
      });
      $('textarea', aux).bind('keydown', 'Meta+s', function () {
        WIDE.editor.save_current();

        return false;
      });

    };

    WIDE.layout.layout();

    initialize_editor(content.get(0), after_init);

    return aux;
  };

  var new_editor = function (options) {
    var editor;

    editor = create_editor(options);

    $.extend(editor, {
      editor_env: function () {
        return editor.env;
      },
      editor: function () {
        var env = editor.editor_env();
        if(env === undefined) {
          return undefined;
        }
        return env.editor;
      },
      dimensions_changed: function () {
        var env = editor.editor_env();
        if(env !== undefined) {
          env.dimensionsChanged();
        }
      }
    });

    editors[editors.length] = editor;

    return editor;
  };

  return {
    edit_file: function (path, line_number) {
      return edit_file(path, line_number);
    },
    dimensions_changed: function () {
      var editor = WIDE.editor.get_current_editor();

      if(editor !== undefined && editor.dimensions_changed !== undefined) {
        editor.dimensions_changed();

        return editor;
      }
    },
    focus: function () {
      var editor = WIDE.editor.get_current_editor();

      if(editor !== undefined && editor.editor() !== undefined) {
        editor.editor().focus = true;

        return editor;
      }
    },
    remove_editor: function (index) {
      editors.splice(index, 1);
    },
    get_current_editor: function () {
      var href = $('a', '.ui-tabs-selected', '#tabs').attr('href');

      if(href !== undefined) {
        return $('form', href)[0];
      }

      return undefined;
    },
    save_current: function () {
      var editor = WIDE.editor.get_current_editor();

      if(editor !== undefined) {
        editor.save().editor().focus = true;
      }
    },
    save_all: function () {
      var editor;
      for(var i = 0; i < editors.length; ++i) {
        editor = editors[i];
        if(editor.modified === true) {
          editor.save();
        }
      }
    },
    modified_editors: function () {
      var editor;
      for(var i = 0; i < editors.length; ++i) {
        editor = editors[i];

        if(editor.modified === true) {
          return true;
        }
      }

      return false;
    }
  };
}());

$(function () {
  $(document).bind('keydown', 'Ctrl+s', function () {
    WIDE.editor.save_current();

    return false;
  });
  $(document).bind('keydown', 'Meta+s', function () {
    WIDE.editor.save_current();

    return false;
  });
});
