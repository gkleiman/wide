// Place your application-specific JavaScript functions and classes for
// the admin panel here.

$(function () {
  var makefile_textarea = $('#project_type_makefile_template');

  if(makefile_textarea.length > 0) {
    makefile_textarea.attr('rows', 24);
    $.getScript('/javascripts/ace_textarea.js', function () {
      var ace = window.__ace_shadowed__;
      ace.transformTextarea(makefile_textarea[0]);
    });
  }
});
