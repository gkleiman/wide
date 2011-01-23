// Refreshes the projects table until all projects are initialized
var poll_projects_table = function () {
  if ($('.initializing').length > 0) .{
    setTimeout(function () { $.getScript(this.href); return true; }, 2000);
  }
};

$(function () {
  // Make rows of the projects table clickable
  $('#projects table tbody tr.success').live('click', function (event) {
    if (event.target.nodeName === 'A') {
      return true;
    }

    window.location = $(this).find('a:eq(0)').attr('href');

    event.preventDefault();
    event.stopPropagation();

    return false;
  });

  // Refresh the projects table if there is any uninitialized project
  poll_projects_table();
});
