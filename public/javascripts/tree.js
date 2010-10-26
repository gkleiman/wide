"use strict";

WIDE.tree = (function () {
  return {
    refresh: function (node) {
      $.jstree._reference('#tree').refresh(node);
    }
  };
}());

$(function () {
  var get_path = function (node) {
    path = $('#tree').jstree('get_path', node)
    if(path.length > 0)
      path.shift();
    else
      path = [''];
    path = path.join('/');

    return path;
  }

  var get_parent = function (node) {
      return $('#tree').jstree('_get_parent', node);
  }

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
  }

  var perform_scm_action = function (node, action) {
    var path = get_path(node);
    var file = WIDE.file(path);
    var action_func = file[action];

    action_func.call(file, function () {
      WIDE.tree.refresh();
      WIDE.commit.update_commit_button();
    }, function () {
      alert('Failed to ' + action + ' ' + path)
    });
  }

  function context_menu_options(node) {
    if(node.hasClass('modified')) {
      return { revert: { 'label': 'Revert changes', 'action': function (node) {
      perform_scm_action(node, 'revert'); } } };
    } else if(node.hasClass('added')) {
      return { forget: { 'label': 'Forget', 'action': function (node) {
      perform_scm_action(node, 'forget'); } } };
    } else if(node.hasClass('unversioned') || node.hasClass('removed') || node.attr('rel') == 'directory') {
      return { add: { 'label': 'Add', 'action': function (node) {
      perform_scm_action(node, 'add'); } } };
    } else {
      return { forget: { 'label': 'Forget', 'action': function (node) {
      perform_scm_action(node, 'forget'); } } };
    }
  }

  if($.jstree !== undefined) {
    $.jstree._themes = '/javascripts/themes/';

    $('#tree')
    .jstree({
      plugins: [ 'themes', 'json_data', 'ui', 'types', 'hotkeys', 'cookies',
        'crrm', 'dnd', 'overlays', 'contextmenu' ],

      // Plugin configuration
      core: {
        animation: 0
      },

      json_data: {
        ajax: {
          url: WIDE.repository_path() + '/ls',
          data: function (n) {
            var path = '-1';

            if(n != '-1') {
              path = get_path(n);
            }
            return { path: path };
          }
        }
      },

      types: {
        max_depth: -2,
        max_children: -2,
        valid_children: [ 'root' ],

        types: {
          root: {
            valid_children: [ 'directory', 'file' ],
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
            valid_children: [ 'file', 'directory' ],
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
        initially_select: [ 'root_node' ],
        select_limit: 1
      },

      contextmenu: {
        items: context_menu_options
       }
    })
    .bind('dblclick.jstree',
      function (e) {
        var node = $('#tree').jstree('get_selected');
        var path, file_name, file;

        if(node !== undefined) {
          path = get_path(node);

          if(node.attr('rel') == 'directory') {
            $('#tree').jstree('toggle_node', node);
          } else if(node.attr('rel') == 'file') {
            file = WIDE.file(path);

            file.cat(
              function (data) {
                var file_name = node.attr('data-filename');
                WIDE.editor.open_file({path: path, file_name: file_name, data: data});
              },
              function (data) {
                alert('Error opening: ' + path);
              }
            );
          }
        }
    })
    .bind('create.jstree',
      function (e, data) {
        var path = get_path(data.rslt.obj);
        var type = data.rslt.obj.attr('rel')
        var file = WIDE.file(path, type === 'directory');

        file.create(function () {
            WIDE.tree.refresh(data.rslt.obj);
            WIDE.commit.update_commit_button();
          }, function () {
                $.jstree.rollback(data.rlbk);
          });
    })
    .bind('move_node.jstree', function (e, data) {
        var moved_node = data.rslt.o[0];

        var src_path = path_before_operation(moved_node, data.rlbk);
        var dest_path = get_path(moved_node);

        var file = WIDE.file(src_path);

        if(src_path !== dest_path) {
          file.mv(dest_path,
            function () {
              WIDE.tree.refresh(data.np);
              WIDE.commit.update_commit_button();
            },
            function () {
              $.jstree.rollback(data.rlbk);
          });
        } else {
          $.jstree.rollback(data.rlbk);
        }
    })
    .bind('remove.jstree', function (e, data) {
        var path = path_before_operation(data.rslt.obj[0], data.rlbk);
        var file = WIDE.file(path);

        file.rm(undefined, function() {
              WIDE.tree.refresh(data.rslt.obj[0]);
              WIDE.commit.update_commit_button();
        });
    })
    .bind('rename.jstree', function (e, data) {
        var renamed_node = data.rslt.obj[0];

        var src_path = path_before_operation(renamed_node, data.rlbk);
        var dest_path = get_path(renamed_node);

        var file = WIDE.file(src_path);

        if(src_path !== dest_path) {
          file.mv(dest_path,
            function () {
              WIDE.tree.refresh(get_parent(data.rslt.obj[0]));
              WIDE.commit.update_commit_button();
            },
            function () {
              $.jstree.rollback(data.rlbk);
          });
        } else {
          $.jstree.rollback(data.rlbk);
        }
    });

    $('#add_file_button').button().click(function () {
      $('#tree').jstree('create', null, 'last', { 'attr' : { 'rel' : 'file'} });
      return false;
    });
    $('#add_directory_button').button().click(function () {
      $('#tree').jstree('create', null, 'last', { 'attr' : { 'rel' : 'directory'} });
      return false;
    });

    $('#remove_button').button().click(function () {
      $('#tree').jstree('remove');
      return false;
    });

    $('#rename_button').button().click(function () {
      $('#tree').jstree('rename');
      return false;
    });
  }
});
