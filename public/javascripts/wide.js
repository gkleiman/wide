Array.isArray = Array.isArray || $.isArray;

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
    repository_entries_path: function () {
      return this.base_path() + '/repository/entries';
    },
    csrf_token: function () {
      return $('meta[name=csrf-token]').attr('content');
    },
    csrf_param: function () {
      return $('meta[name=csrf-param]').attr('content');
    },
    encode_path: function (path) {
      var path_array;

      if (path === '/') {
        return path;
      }

      path_array = path.split('/');

      if (path_array[0] == '/') {
        alert(path);
        path_array.shift();
      }

      return $.map(path_array, function (path_element) {
        return encodeURIComponent(path_element);
      }).join('/');
    }
  };
}());

$(function () {
  $(document).ajaxSend(function (e, xhr, options) {
    var token = $("meta[name='csrf-token']").attr("content");
    xhr.setRequestHeader("X-CSRF-Token", token);
  });
});
