$(function() {
  var base_path = '/projects/' + $('#project_id').val() + '/repository';

  function get_path(node) {
    path = $('#tree').jstree('get_path', node)
    if(path.length > 0)
      path.shift();
    else
      path = [''];
    path = path.join('/');

    return path;
  }

  function get_parent(node) {
      return $('#tree').jstree('_get_parent', node);
  }

  /*
  * Some operations (like remove, move, and rename) change the tree. This
  * function is a hack to get the path of a node before having performed an
  * operation
  */
  function path_before_operation(node, op_rlbk) {
      var rlbk = $('#tree').jstree('get_rollback');
      $.jstree.rollback(op_rlbk);
      var old_node = $.jstree._reference("#tree")._get_node('#' + node.id);
      var path = get_path(old_node);
      $.jstree.rollback(rlbk);

      return path;
  }

  function perform_scm_action(options) {
    var parent_node = get_parent(options.node);
    var path = get_path(options.node);
    var action = options.action;

    if(options.method === 'get')
      var method = $.get;
    else if(options.method === 'post')
      var method = $.post;

    method(
        base_path + '/' + action,
        { path: path },
        function (r) {
          if(r.success) {
            $.jstree._reference("#tree").refresh();
            update_commit_button();
          }
        }
    );
  }
  function scm_add(node) {
    perform_scm_action({node: node, method: 'post', action: 'add'});
  }
  function scm_forget(node) {
    perform_scm_action({node: node, method: 'post', action: 'forget'});
  }
  function scm_revert(node) {
    perform_scm_action({node: node, method: 'post', action: 'revert'});
  }
  function context_menu_options(node) {
    if(node.hasClass('modified')) {
      return { revert: { 'label': 'Revert changes', 'action': function(node) {
      scm_revert(node); } } };
    } else if(node.hasClass('added')) {
      return { forget: { 'label': 'Forget', 'action': function(node) {
      scm_forget(node); } }, };
    } else if(node.hasClass('unversioned') || node.hasClass('removed') || node.attr('rel') == 'directory') {
      return { add: { 'label': 'Add', 'action': function(node) {
      scm_add(node); } }, };
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
          url: base_path + '/ls',
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

        if(node !== undefined) {
          var path = get_path(node);

          if(node.attr('rel') == 'directory') {
            $('#tree').jstree('toggle_node', node);
          } else if(node.attr('rel') == 'file') {
            $.get(base_path + '/cat',
              { path: path },
              function(data) {
                var file_name = node.attr('data-filename');
                open_file_in_editor({path: path, file_name: file_name, data: data});
              });
          }
        }
    })
    .bind('create.jstree',
      function (e, data) {
        var path = get_path(data.rslt.obj);
        var type = data.rslt.obj.attr('rel')

        $.post(
            base_path + '/create_' + type,
            { path: path },
            function (r) {
              if(!r.success) {
                $.jstree.rollback(data.rlbk);
              } else {
                data.inst.refresh(get_parent(data.rslt.obj));
                update_commit_button();
              }
            }
        );
    })
    .bind('move_node.jstree', function (e, data) {
        var moved_node = data.rslt.o[0];

        var src_path = path_before_operation(moved_node, data.rlbk);
        var dest_path = get_path(moved_node);

        if(src_path !== dest_path) {
          $.post(
            base_path + '/mv',
            { src_path: src_path, dest_path: dest_path },
            function (r) {
              if(!r.success) {
                $.jstree.rollback(data.rlbk);
              } else {
                data.inst.refresh(data.np);
                update_commit_button();
              }
            }
          );
        } else {
          $.jstree.rollback(data.rlbk);
        }
    })
    .bind('remove.jstree', function (e, data) {
        var path = path_before_operation(data.rslt.obj[0], data.rlbk);

        $.ajax({
          async : false,
          type: 'POST',
          url: base_path + '/rm',
          data : {
            path: path
          },
          success : function (r) {
            if(!r.success) {
              data.inst.refresh(get_parent(data.rslt.obj[0]));
              update_commit_button();
            }
          }
        });
    })
    .bind('rename.jstree', function (e, data) {
        var renamed_node = data.rslt.obj[0];

        var src_path = path_before_operation(renamed_node, data.rlbk);
        var dest_path = get_path(renamed_node);

        $.post(
          base_path + '/mv',
          { src_path: src_path, dest_path: dest_path },
          function (r) {
            if(!r.success) {
              $.jstree.rollback(data.rlbk);
            } else {
              data.inst.refresh(get_parent(data.rslt.obj[0]));
              update_commit_button();
            }
          }
        );
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
