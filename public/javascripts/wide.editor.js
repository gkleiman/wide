WIDE.editor = (function () {
  var edit_form_tmpl = '<p class="loading">Retrieving file...</p><form accept-charset="UTF-8" action="${WIDE.repository_path()}/save_file" data-remote="true" data-type="json" method="post" style="display: none;"><input name="utf8" type="hidden" value="&#x2713;" /><input name="${csrf_param}" type="hidden" value="${csrf_token}" /><input name="project_id" type="hidden" value="${project_id}" /><input name="path" type="hidden" value="${path}" /><textarea style="display: none;" name="content"></textarea></form><div class="editor"> </div>';

  var editors = [], id_count = 0;

  var initialize_ace = function (node, data, after_init) {
    var env = require("pilot/environment").create();
    var catalog = require("pilot/plugin_manager").catalog;

    catalog.startupPlugins({ env: env }).then(function() {
      var EditSession = require("ace/edit_session").EditSession;
      var UndoManager = require("ace/undomanager").UndoManager;
      var Editor = require("ace/editor").Editor;
      var Renderer = require("ace/virtual_renderer").VirtualRenderer;
      var theme = require("ace/theme/textmate");

      var Mode = load_editor_mode(node);

      var doc = new EditSession(data);
      doc.setMode(new Mode());
      doc.setUndoManager(new UndoManager());
      env.document = doc;
      env.editor = new Editor(new Renderer($(node).siblings('.editor')[0], theme));
      env.editor.setSession(doc);

      node.env = env;
      WIDE.layout.layout();

      after_init();
    });
  };

  var prepare_save = function (editor) {
    var fail_func = function (data, result, xhr) {
      WIDE.notifications.error('Error saving: ' + editor.path.value);

      editor.editor().setReadOnly(false);

      WIDE.toolbar.update_save_buttons();

      return false;
    };

    editor.save = function () {
      if(editor.modified === true) {
        $(editor).submit();
      }

      return editor;
    };

    $(editor).submit(function () {
      editor.show_throbber();
      editor.editor().setReadOnly(true);

      $('textarea', editor).val(editor.editor().getSession().doc.getValue());

      return true;
    }).bind('ajax:complete', function () {
      editor.hide_throbber();
      editor.editor().setReadOnly(false);

      return true;
    }).bind('ajax:error', function () {
      return fail_func();

      return true;
    }).bind('ajax:success', function (xhr, result, status) {
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

    $('textarea', editor).bind('keydown', 'Ctrl+s', WIDE.editor.save_shortcut_handler)
      .bind('keydown', 'Meta+s', WIDE.editor.save_shortcut_handler);
  };

  var load_editor_mode = function (editor) {
    var file_name = editor.file_name;
    var extension = file_name.substr(file_name.lastIndexOf(".") + 1);

    switch (extension) {
      case 'h':
      case 'hpp':
      case 'c':
      case 'cpp':
        return require('ace/mode/c_cpp').Mode;
        break;
      case 'js':
        return require('ace/mode/javascript').Mode;
        break;
      case 'html':
        return require('ace/mode/html').Mode;
        break;
      case 'css':
        return require('ace/mode/css').Mode;
        break;
      case 'php':
        return require('ace/mode/php').Mode;
        break;
      case 'py':
        return require('ace/mode/python').Mode;
        break;
    }

    return require('ace/mode/text').Mode;
  };

  var _remove_editor = function (index) {
    editors.splice(index, 1);
    WIDE.toolbar.update_save_buttons();

    $('#tabs').tabs('remove', index);
    if($('#tabs li').children().length === 0) {
      $('#tabs').hide();
    }
  }

  var edit_file = function (path, line_number) {
    var file = WIDE.file(path);
    var paths, editor_index, editor;

    // If there's already an editor for the given filename, then select its tab.
    paths = $.map(editors, function (value, index) {
      return value.path.value;
    });
    editor_index = $.inArray(file.path(), paths);
    if(editor_index !== -1) {
      editor = editors[editor_index];

      $('#tabs').tabs('select', editor_index);

      if(line_number !== undefined) {
        editor.go_to_line(line_number);
      }

      return false;
    }

    WIDE.notifications.success('Loading ' + path + ' ...');
    new_editor(file, line_number);
  };

  var create_editor_tab = function (options) {
    // Create the form with the editor.
    var replacements = {
      csrf_token: WIDE.csrf_token(),
      csrf_param: WIDE.csrf_param(),
      project_id: WIDE.project_id()
    };
    var editor = $.tmpl(edit_form_tmpl, $.extend(options, replacements));

    // Create a new tab for the editor.
    var editor_tab_id = '#editor-tab-' + id_count++;

    // Show the tab bar if it was hidden
    if($('#tabs li').children().length === 0) {
      $('#tabs').show();
    }
    $('#tabs').tabs('add', editor_tab_id, options.file_name);

    // Append the form/editor to the tab
    editor.appendTo(editor_tab_id);

    // Get the new instance of the form
    editor = $('form', editor_tab_id)[0];

    // Add some attributes to the editor
    editor.containing_tab = $(editor_tab_id);
    editor.tab_title = $('#tabs > ul.ui-tabs-nav > li > a[href=' + editor_tab_id + ']');
    editor.throbber_icon = editor.tab_title.parent().find('.ui-icon-throbber');
    editor.close_icon = editor.tab_title.parent().find('.ui-icon-close');
    editor.path = options.path;
    editor.file_name = options.file_name;
    editor.modified = false;
    editor.show_throbber = function () {
      this.close_icon.hide();
      this.throbber_icon.show();
    };
    editor.hide_throbber = function () {
      this.close_icon.show();
      this.throbber_icon.hide();
    };

    prepare_save(editor);

    editor.show_throbber();

    WIDE.layout.layout();

    // Hide the editor form and show that the file is being retrieven.
    $(editor).hide().siblings('p').show();

    return editor;
  };

  var load_ace_into_editor = function (options) {
    var editor = options.editor, content = $('textarea', options.editor);

    // Set the content of the editor
    content.val(options.data);

    var after_init = function () {
      var env = editor.env;

      editor.mark_tab_as_clean = function () {
        editor.modified = false;
        editor.tab_title.text(editor.file_name);
        editor.containing_tab.removeClass('modified');

        WIDE.toolbar.update_save_buttons();

        return true;
      };

      editor.mark_tab_as_dirty = function () {
        editor.modified = true;
        editor.tab_title.text(editor.file_name + ' +');
        editor.containing_tab.addClass('modified');

        WIDE.toolbar.update_save_buttons();

        return true;
      };

      editor.editor = function () {
        var env = this.env;
        if(env === undefined) {
          return undefined;
        }
        return env.editor;
      };

      editor.dimensions_changed = function () {
        var editor = this.editor();
        if(editor !== undefined) {
          editor.resize();
        }
      };

      editor.go_to_line = function (line_number) {
        var editor = this.editor();

        if (editor !== undefined) {
          editor.gotoLine(line_number);
          editor.focus();
        }
      }

      editor.focus = function () {
        var editor = this.editor();

        if (editor !== undefined) {
          editor.focus();
        }
      };

      $('textarea', editor).bind('keydown', 'Ctrl+s', WIDE.editor.save_shortcut_handler)
        .bind('keydown', 'Meta+s', WIDE.editor.save_shortcut_handler);

      env.editor.resize();
      env.editor.focus();

      // TODO
      //set_syntax_highlighting(env.editor, editor.file_name);
      env.editor.getSession().doc.on('change', editor.mark_tab_as_dirty);

      if(options.line_number !== undefined) {
        editor.go_to_line(options.line_number);
      }

      editor.hide_throbber();
    };

    initialize_ace(editor, options.data, after_init);

    return editor;
  };

  var new_editor = function (file, line_number) {
    var editor, editor_index;

    editor = create_editor_tab({
      path: file.path(),
      file_name: file.file_name()
    });

    // Add the editor to the editors array
    editor_index = editors.length;
    editors[editor_index] = editor;

    // Load the contents of the files into the editor, and add skywriter to it.
    file.cat(
      function (data) {
        WIDE.notifications.hide();

        $(editor).siblings('p').hide();
        $(editor).siblings('.editor').show();

        load_ace_into_editor({
          data: data,
          line_number: line_number,
          editor: editor
        });
      },
      function (data) {
        var index = $('#tabs li').index(editor.tab_title.parent());

        WIDE.notifications.error('Error opening: ' + file.path());

        WIDE.editor.remove_editor(editor_index);

        return false;
    });

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
        editor.focus();

        return editor;
      }
    },
    remove_editor: function (index) {
      var editor = editors[index];

      if (editor.modified) {
        $('<div />').dialog({
          title: "Save '" + editor.file_name + "'?",
          modal: true,
          resizable: false,
          buttons: {
            Yes: function () {
              $(this).dialog('close');
              editor.save();
              _remove_editor(index);
            },
            No: function () {
              $(this).dialog('close');
              _remove_editor(index);
            },
            Cancel: function () {
              $(this).dialog('close');
            }
          }
        });
      } else {
        _remove_editor(index);
      }
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
        editor.save().focus();
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
      return $('#tabs .modified').length !== 0;
    },
    save_shortcut_handler: function () {
      WIDE.editor.save_current();

      return false;
    }
  };
}());

$(function () {
  if($('#tabs').length > 0) {
    $('#tabs').tabs({
      tabTemplate: '<li><a href="#{href}">#{label}</a> <span class="ui-icon ui-icon-throbber" style="display: none;">Activity in progress...</span><span class="ui-icon ui-icon-close">Remove Tab</span></li>',
      add: function (event, ui) {
        $('#tabs').tabs('select', '#' + ui.panel.id);
      },
      show: function (event, ui) {
        WIDE.layout.layout();
        WIDE.toolbar.update_save_buttons();
        WIDE.editor.focus();
      }
    }).hide();

    $('#tabs span.ui-icon-close').live('click', function () {
      var index = $('#tabs li').index($(this).parent());

      WIDE.editor.remove_editor(index);
    });
  }

  $(document).bind('keydown', 'Ctrl+s', WIDE.editor.save_shortcut_handler)
    .bind('keydown', 'Meta+s', WIDE.editor.save_shortcut_handler);
});
