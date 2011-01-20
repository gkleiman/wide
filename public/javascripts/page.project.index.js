var poll_projects_table = function () {
  if ($('.initializing').length > 0) {
    setTimeout(function () { $.getScript(this.href); return true; }, 2000);
  }
};

$(function () {
  poll_projects_table();
});
