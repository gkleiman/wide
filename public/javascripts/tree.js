"use strict";

WIDE.tree = (function () {
  return {
    refresh: function (node) {
      $.jstree._reference('#tree').refresh(node);
    },
    select_node: function (node) {
      $('#tree').jstree('select_node', node);
    }
  };
}());

$(function () {
  var get_parent = function (node) {
    return $.jstree._reference('#tree')._get_parent(node);
  };

  var get_insertion_node = function () {
    var selected_node = $('#tree').jstree('get_selected');
    var root_node = $('#root_node');

    if(selected_node.length === 0) {
      selected_node = root_node;
      $('#tree').jstree('select_node', selected_node);
    } else if(selected_node !== root_node && selected_node.attr('rel') === 'file') {
      selected_node = get_parent(selected_node);
    }

    return selected_node;
  };

  var get_path = function (node) {
    var path = $('#tree').jstree('get_path', node);
    if(path.length > 0) {
      path.shift();
    } else {
      path = [''];
    }

    path = path.join('/');

    return path;
  };

/*
  * Some operations (like remove, move, and rename) change the tree. This
  * function is a hack to get the path of a node before having performed an
  * operation
  */
  var path_before_operation = function (node, op_rlbk) {
    var rlbk = $('#tree').jstree('get_rollback');
    $.jstree.rollback(op_rlbk);
    var old_node = $.jstree._reference("#tree")._get_node('#' + node.id);
    var path = get_path(old_node);
    $.jstree.rollback(rlbk);

    return path;
  };

  var perform_scm_action = function (node, action) {
    var path = get_path(node);
    var file = WIDE.file(path);
    var action_func = file[action];

    action_func.call(file, function () {
      WIDE.tree.refresh(get_parent(node));
      WIDE.toolbar.update_scm_buttons();
    }, function () {
      WIDE.notifications.error('Failed to ' + action + ' ' + path);
    });
  };

  var create_file = function () {
    var insertion_node = get_insertion_node();

    $('#tree').jstree('create', insertion_node, 'last', {
      attr: {
        rel: 'file'
      },
      data: 'New File'
    });
    return false;
  };
  var add_directory = function () {
    var insertion_node = get_insertion_node();

    $('#tree').jstree('create', insertion_node, 'last', {
      attr: {
        rel: 'directory'
      },
      data: 'New Folder'
    });
    return false;
  };
  var remove_node = function () {
    $('#tree').jstree('remove');
    return false;
  };
  var rename_node = function () {
    $('#tree').jstree('rename');
    return false;
  };

  var context_menu_options = function (node) {
    var default_menu = {
      create_file: {
        separator_before: false,
        separator_after: false,
        label: 'Create File',
        action: create_file
      },
      create_directory: {
        separator_before: false,
        separator_after: true,
        label: 'Create Folder',
        action: add_directory
      },
      rename: {
        separator_before: false,
        separator_after: true,
        label: 'Rename',
        action: rename_node
      },
      remove: {
        separator_before: false,
        icon: false,
        separator_after: false,
        label: 'Delete',
        action: remove_node
      }
    };
    var scm_menu = {
      scm: {
        separator_before: true,
        separator_after: false,
        label: 'Version Control',
        action: false,
        submenu: {}
      }
    };
    var add_scm_menu = false;

    if(node.hasClass('unresolved')) {
      add_scm_menu = true;

      $.extend(scm_menu.scm.submenu, {
        resolve: {
          label: 'Mark as Resolved',
          action: function (node) {
            perform_scm_action(node, 'mark_resolved');
          }
        }
      });
    } else if(node.hasClass('resolved')) {
      add_scm_menu = true;

      $.extend(scm_menu.scm.submenu, {
        resolve: {
          label: 'Mark as Unresolved',
          action: function (node) {
            perform_scm_action(node, 'mark_unresolved');
          }
        }
      });
    } else if(node.hasClass('modified')) {
      add_scm_menu = true;

      $.extend(scm_menu.scm.submenu, {
        revert: {
          label: 'Revert changes',
          action: function (node) {
            perform_scm_action(node, 'revert');
          }
        }
      });
    }

    if(node.hasClass('added')) {
      add_scm_menu = true;

      $.extend(scm_menu.scm.submenu, {
        forget: {
          label: 'Forget',
          action: function (node) {
            perform_scm_action(node, 'forget');
          }
        }
      });
    }

    if(node.hasClass('unversioned') || node.hasClass('removed') || node.attr('rel') === 'directory') {
      add_scm_menu = true;

      $.extend(scm_menu.scm.submenu, {
        add: {
          label: 'Add',
          action: function (node) {
            perform_scm_action(node, 'add');
          }
        }
      });
    } else {
      add_scm_menu = true;

      $.extend(scm_menu.scm.submenu, {
        forget: {
          label: 'Forget',
          action: function (node) {
            perform_scm_action(node, 'forget');
          }
        }
      });
    }

    if(add_scm_menu) {
      $.extend(default_menu, scm_menu);
    }

    return default_menu;
  };

  if($.jstree !== undefined) {
    $.jstree._themes = '/javascripts/themes/';

    $('#tree').jstree({
      plugins: ['themes', 'json_data', 'ui', 'types', 'hotkeys', 'cookies', 'crrm', 'dnd', 'overlays', 'contextmenu'],

      // Plugin configuration
      core: {
        animation: 0
      },

      json_data: {
        ajax: {
          url: WIDE.repository_path() + '/ls',
          data: function (n) {
            var path = '-1';

            if(n !== '-1') {
              path = get_path(n);
            }
            return {
              path: path
            };
          },
          error: function (r) {
            WIDE.notifications.error('Error trying to load the repository tree.');

            return false;
          }
        }
      },

      types: {
        max_depth: -2,
        max_children: -2,
        valid_children: ['root'],

        types: {
          root: {
            valid_children: ['directory', 'file'],
            start_drag: false,
            move_node: false,
            delete_node: false,
            remove: false
          },
          file: {
            valid_children: 'none',
            icon: {
              image: '/images/file.png'
            }
          },
          directory: {
            valid_children: ['file', 'directory'],
            icon: {
              image: '/images/folder.png'
            }
          },
          start_drag: false,
          move_node: false,
          delete_node: false,
          remove: false
        }
      },

      ui: {
        select_prev_on_delete: false,
        initially_select: ['root_node'],
        select_limit: 1
      },

      contextmenu: {
        items: context_menu_options,
        select_node: true
      }
    }).bind('dblclick.jstree', function (e) {
      var node = $('#tree').jstree('get_selected');
      var path, file_name;

      if(node !== undefined) {
        path = get_path(node);

        if(node.attr('rel') === 'directory') {
          $('#tree').jstree('toggle_node', node);
        } else if(node.attr('rel') === 'file') {
          file_name = node.attr('data-filename');

          WIDE.editor.edit_file(path);
        }
      }
    }).bind('create.jstree', function (e, data) {
      var path = get_path(data.rslt.obj);
      var type = data.rslt.obj.attr('rel');
      var file = WIDE.file(path, type === 'directory');

      file.create(function () {
        WIDE.tree.refresh(get_parent(data.rslt.obj));
        WIDE.toolbar.update_scm_buttons();
      }, function () {
        WIDE.notifications.error('Error creating: ' + path);
        $.jstree.rollback(data.rlbk);

        return false;
      });
    }).bind('move_node.jstree', function (e, data) {
      var moved_node = data.rslt.o[0];

      var src_path = path_before_operation(moved_node, data.rlbk);
      var dest_path = get_path(moved_node);

      var file = WIDE.file(src_path);

      if(src_path !== dest_path) {
        file.mv(dest_path, function () {
          WIDE.tree.refresh(data.np);
          WIDE.toolbar.update_scm_buttons();
        }, function () {
          WIDE.notifications.error('Error moving: ' + src_path);
          $.jstree.rollback(data.rlbk);
        });
      } else {
        $.jstree.rollback(data.rlbk);
      }
    }).bind('remove.jstree', function (e, data) {
      var path = path_before_operation(data.rslt.obj[0], data.rlbk);
      var file = WIDE.file(path);

      var after_remove = function (r) {
        if(r && r.success) {
          WIDE.tree.refresh(get_parent(data.rslt.obj[0]));
          WIDE.tree.select_node($('#root_node'));
          WIDE.toolbar.update_scm_buttons();

          return true;
        } else {
          WIDE.notifications.error('Error removing: ' + path);

          $.jstree.rollback(data.rlbk);
          return false;
        }
      };

      file.rm(after_remove, after_remove);
    }).bind('rename.jstree', function (e, data) {
      var renamed_node = data.rslt.obj[0];

      var src_path = path_before_operation(renamed_node, data.rlbk);
      var dest_path = get_path(renamed_node);

      var file = WIDE.file(src_path);

      if(src_path !== dest_path) {
        file.mv(dest_path, function () {
          WIDE.tree.refresh(get_parent(data.rslt.obj[0]));
          WIDE.toolbar.update_scm_buttons();
        }, function () {
          WIDE.notifications.error('Error renaming: ' + src_path);
          $.jstree.rollback(data.rlbk);

          return false;
        });
      } else {
        $.jstree.rollback(data.rlbk);
      }
    });
  }
});
