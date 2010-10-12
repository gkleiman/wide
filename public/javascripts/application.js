function save_function(id, content) {
  var base_path = '/projects/' + $('#project_id').val();
  var path = editAreaLoader.getCurrentFile(id).id;
  $('#path').val(path);
  $('#content').val(content);

  $.post(
    base_path + '/save_file',
    { path: path,
      content: content },
    function (r) {
      if(!r.success) {
        // TODO display an error message or a warning.
        editAreaLoader.setFileEditedMode(id, path, true);
      } else {
        editAreaLoader.setFileEditedMode(id, path, false);
        $.jstree._reference("#tree").refresh();
      }
    }
  );
}

$(function() {
  var base_path = '/projects/' + $('#project_id').val();

  function get_path(node) {
    path = $('#tree').jstree('get_path', node)
    if(path.length > 0)
      path.shift();
    else
      path = [''];
    path = path.join('/');

    return path;
  }

  // Some operations (like remove, move, and rename) change the tree. This function is a hack to get the path of a node before having performed an operation
  function path_before_operation(node, op_rlbk) {
      var rlbk = $('#tree').jstree('get_rollback');
      $.jstree.rollback(op_rlbk);
      var old_node = $.jstree._reference("#tree")._get_node('#' + node.id);
      var path = get_path(old_node);
      $.jstree.rollback(rlbk);

      return path;
  }

  if($.jstree !== undefined) {
    $.jstree._themes = '/javascripts/themes/';

    $('#tree')
    .jstree({
      plugins: [ 'themes', 'json_data', 'ui', 'types', 'hotkeys', 'cookies', 'crrm', 'dnd', 'overlays' ],

      // Plugin configuration
      core: {
        animation: 0
      },

      json_data: {
        ajax: {
          url: base_path + '/list_dir',
          data: function (n) {
            // the result is fed to the AJAX request `data` option
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
            $.get(base_path + '/read_file',
              { path: path },
              function(data) {
                var file_name = node.attr('data-filename');
                editAreaLoader.openFile('content', { id: path, title: file_name, text: data });
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
                data.inst.refresh();
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
            base_path + '/move_file',
            { src_path: src_path, dest_path: dest_path },
            function (r) {
              if(!r.success) {
                $.jstree.rollback(data.rlbk);
              } else {
                data.inst.refresh();
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
          url: base_path + '/remove_file',
          data : {
            path: path
          },
          success : function (r) {
            if(!r.success) {
              data.inst.refresh();
            }
          }
        });
    })
    .bind('rename.jstree', function (e, data) {
        var renamed_node = data.rslt.obj[0];

        var src_path = path_before_operation(renamed_node, data.rlbk);
        var dest_path = get_path(renamed_node);

        $.post(
          base_path + '/move_file',
          { src_path: src_path, dest_path: dest_path },
          function (r) {
            if(!r.success) {
              $.jstree.rollback(data.rlbk);
            }
          }
        );
    });

    editAreaLoader.init({
      id: 'content',
      start_highlight: true,
      allow_toggle: false,
      language: 'en',
      syntax: 'c',
      toolbar: 'save, |, search, go_to_line, |, undo, redo, |, select_font, |, syntax_selection, |, change_smooth_selection, highlight, reset_highlight, |, help',
      syntax_selection_allow: 'c,css,html,js,php,python,xml,cpp,sql,basic',
      is_multi_files: true,
      show_line_colors: true,
      save_callback: 'save_function'
    });

    $('#add_file_button').click(function () {
      $('#tree').jstree('create', null, 'last', { 'attr' : { 'rel' : 'file'} });
      return false;
    });
    $('#add_directory_button').click(function () {
      $('#tree').jstree('create', null, 'last', { 'attr' : { 'rel' : 'directory'} });
      return false;
    });

    $('#remove_button').click(function () {
      $('#tree').jstree('remove');
      return false;
    });

    $('#rename_button').click(function () {
      $('#tree').jstree('rename');
      return false;
    });
  }
});
