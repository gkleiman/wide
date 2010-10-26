"use strict";

var WIDE = (function () {
  var project_id = function () {
    return $('meta[name=project_id]').attr('content');
  };

  return {
    project_id: function () {
      return $('meta[name=project_id]').attr('content');
    },
    base_path: function () {
      return '/projects/' + encodeURIComponent(project_id());
    },
    repository_path: function () {
      return this.base_path() + '/repository';
    },
    csrf_token: function () {
      return $('meta[name=csrf-token]').attr('content');
    },
    csrf_param: function () {
      return $('meta[name=csrf-param]').attr('content');
    }
  };
}());
