// Refreshes the projects table until all projects are initialized
var poll_projects_table = function () {
  if ($('.initializing').length > 0) {
    setTimeout(function () { $.getScript(this.href); return true; }, 2000);
  }
};

$(function () {
  var clickable_row_click_handler = function (event) {
    if (event.target.nodeName === 'A') {
      return true;
    }

    window.location = $(this).find('a:eq(0)').attr('href');

    event.preventDefault();
    event.stopPropagation();

    return false;
  };

  // Refresh the projects table if there is any uninitialized project
  poll_projects_table();

  // Make rows of the ready projects in the projects table clickable
  $('#my_projects tr.success').live('click', clickable_row_click_handler);

  // Make the "Add a New Project" row clickable.
  $('#my_projects tr.add_new_project').live('click', clickable_row_click_handler);
});
