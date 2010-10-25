"use strict";

var WIDE = (function () {
  var project_id = function () {
    return $('#project_id').val();
  };

  return {
    base_path: function () {
      return '/projects/' + encodeURIComponent(project_id());
    },
    repository_path: function () {
      return this.base_path() + '/repository';
    }
  };
}());
