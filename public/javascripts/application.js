function save_function(id, content) {
  var path = editAreaLoader.getCurrentFile(id).id;
  $("#path").val(path);
  $("#content").val(content);

  $("form#file_edit").submit();

  editAreaLoader.setFileEditedMode(id, path, false)
}

$(function() {
  $.jstree._themes = '/javascripts/themes/';
  $('#tree')
  .jstree({
    plugins: [ 'themes', 'json_data', 'ui', 'types', 'hotkeys' ],

    // Plugin configuration
    core: {
      animation: 0
    },

    json_data: {
      ajax: {
        url: '/children',
        data: function (n) {
          // the result is fed to the AJAX request `data` option
          return {
            path: n.attr ? n.attr('data-path') : '/'
          };
        }
      }
    },

    types: {
      max_depth: -2,
      max_children: -2,
      valid_children: [ 'folder', 'file' ],

      types: {
        file: {
          valid_children: 'none',
          icon: {
            image: '/images/file.png'
          }
        },
        folder: {
          valid_children: [ 'default', 'folder' ],
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
  })
  .bind('select_node.jstree',
    function (e, data) {
      node = data.rslt.obj;

      if(node.attr('rel') == 'folder') {
        $('#tree').jstree('toggle_node', node);
      } else {
        $.get('/edit', { path: node.attr('data-path') },
          function(data) {
            var path = node.attr('data-path');
            var file_name = node.attr('data-filename');
            editAreaLoader.openFile('content', { id: path, title: file_name, text: data });
          });
      }
  });

  editAreaLoader.init({
    id: "content",
    start_highlight: true,
    allow_toggle: false,
    language: "en",
    syntax: "html",
    toolbar: "save, |, search, go_to_line, |, undo, redo, |, select_font, |, syntax_selection, |, change_smooth_selection, highlight, reset_highlight, |, help",
    syntax_selection_allow: "css,html,js,php,python,vb,xml,c,cpp,sql,basic,pas,brainfuck",
    is_multi_files: true,
    show_line_colors: true,
    save_callback: "save_function"
  });
});
