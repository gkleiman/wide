function save_function(id, content) {
  var base_path = '/projects/' + $('#project_id').val() + '/repository';
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
        update_commit_button();
      }
    }
  );
}


$(function() {
  var base_path = '/projects/' + $('#project_id').val() + '/repository';

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
});
