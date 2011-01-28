WIDE.file = function (path, is_directory, file_name) {
  var encoded_path = WIDE.encode_path(path);

  // Convert whatever is passed to a boolean value
  is_directory = !!is_directory;

  if(file_name === undefined) {
    file_name = path.replace(/^.*\//, '');
  }

  var perform_action = function (options) {
    var action = options.action;
    var data, dataType, url;
    var fail_func = function (r) {
      if(typeof(options.fail) === 'function') {
        options.fail.call(this, r);
      }
    };

    data = options.params || {};

    if (options.method == 'GET') {
      dataType = 'text';
    } else {
      dataType = 'json';
    }

    if (action !== undefined) {
      url = WIDE.repository_entries_path() + '/' + encoded_path + '/' + action;
    } else {
      url = WIDE.repository_entries_path() + '/' + encoded_path;
    }

    $.ajax({
      type: options.method,
      url: url,
      data: data,
      success: function (r) {
        if(r.success === undefined || r.success === 1) {
          if(typeof(options.success) === 'function') {
            options.success.call(this, r);
          }
        } else {
          fail_func(r);
        }
      },
      error: fail_func,
      dataType: dataType
    });
  };

  return {
    // SCM functions
    add: function (success, fail) {
      perform_action({
        method: 'POST',
        action: 'add',
        success: success,
        fail: fail
      });
    },
    forget: function (success, fail) {
      perform_action({
        method: 'POST',
        action: 'forget',
        success: success,
        fail: fail
      });
    },
    revert: function (success, fail) {
      perform_action({
        method: 'POST',
        action: 'revert',
        success: success,
        fail: fail
      });
    },
    mark_resolved: function (success, fail) {
      perform_action({
        method: 'POST',
        action: 'mark_resolved',
        success: success,
        fail: fail
      });
    },
    mark_unresolved: function (success, fail) {
      perform_action({
        method: 'POST',
        action: 'mark_unresolved',
        success: success,
        fail: fail
      });
    },
    // fs functions
    create: function (success, fail) {
      var type = is_directory ? 'directory' : 'file';
      perform_action({
        method: 'POST',
        params: { _method: 'put', type: type },
        success: success,
        fail: fail
      });
    },
    mv: function (dest_path, success, fail) {
      perform_action({
        method: 'POST',
        action: 'mv',
        params: { dest_path: dest_path },
        success: success,
        fail: fail
      });
    },
    cat: function (success, fail) {
      perform_action({
        method: 'GET',
        success: success,
        fail: fail
      });
    },
    rm: function (success, fail) {
      var params = {};

      params._method = 'delete';

      perform_action({
        method: 'POST',
        params:  { _method: 'delete' },
        success: success,
        fail: fail
      });
    },
    diff: function (success, fail) {
      perform_action({
        method: 'GET',
        action: 'diff',
        success: success,
        fail: fail
      });
    },
    file_name: function () {
      return file_name;
    },
    path: function () {
      return path;
    }
  };
};
