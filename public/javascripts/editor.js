function initialize_editor(after_init) {
  function init() {
      bespin.useBespin('content', {
          stealFocus: true,
          syntax: 'c_cpp'
      }).then(function(env) {
        // Get the editor.
        $('#content').get(0).bespin = env;
        if(after_init !== undefined) {
          after_init.call();
        }
      }, function(error) {
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
      window.onBespinLoad = function() { init(after_init) };
  }
  // If there is already a function listening to the `window.onBespinLoad`
  // function, then create a new function that calls the old
  // `window.onBespinLoad` function first and the `init` function later.
  else {
      var firstWindowOnBespinLoad = window.onBespinLoad;
      window.onBespinLoad = function() {
          firstWindowOnBespinLoad();
          init(after_init);
      }
  }
}

function editor_dimensions_changed() {
  env = editor_env();
  if(env !== undefined) {
    env.dimensionsChanged();
  }
}
function editor_env() {
  return $('#content').get(0).bespin;
}

function editor() {
  var env = editor_env();
  if(env === undefined) {
    return undefined;
  }
  return env.editor;
}

function open_file_in_editor(options) {
  $('#save_button').button('option', 'disabled', true).hide();

  after_init = function() {
    $('#path').val(options.path);
    $('#save_button').button('option', 'disabled', false).button('option', 'label', 'Save: ' + options.file_name).show();
    $('#editor_form').show();
    editor_dimensions_changed();
    editor().focus = true;
  }

  if(editor() === undefined) {
    $('#content').val(options.data);
    initialize_editor(after_init);
  } else {
    editor().value = options.data;
    after_init.call();
  }
}

function save_file() {
  // FIXME fugly function
  var base_path = '/projects/' + $('#project_id').val() + '/repository';
  var path = $('#path').val();
  var content = $('#content').val();

  $('#save_button').button('option', 'disabled', true);
  $.post(
    base_path + '/save_file',
    { path: path,
      content: content },
    function (r) {
      $('#save_button').button('option', 'disabled', false).mouseout();
      if(!r.success) {
        alert('Error saving file');
      } else {
        $.jstree._reference('#tree').refresh();
        update_commit_button();
      }
    }
  );
}

$(function() {
  var base_path = '/projects/' + $('#project_id').val() + '/repository';

  $('#editor_form').hide();
  $('#save_button').button().click(function() { save_file(); });
});
