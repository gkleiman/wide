"use strict";

WIDE.file = (function (path, is_directory, file_name) {
  // Convert whatever is passed to a boolean value
  is_directory = !!is_directory;

  var perform_action = function (options) {
    var action = options.action;
    var method;
    var data;

    if(options.dest_path !== undefined) {
      data = { src_path: path, dest_path: options.dest_path };
    } else {
      data = { path: path };
    }

    if(options.method === 'get')
      method = $.get;
    else if(options.method === 'post')
      method = $.post;

    method(
      WIDE.repository_path() + '/' + action,
      data,
      function (r) {
        if(r.success === undefined || r.success === 1) {
          if(typeof(options.success) === 'function') {
            options.success.call(this, r);
          }
        } else {
          if(typeof(options.fail) === 'function') {
            options.fail.call(this, r);
          }
        }
      }
    );
  }

  return {
    // SCM functions
    add: function (success, fail) {
      perform_action({method: 'post', action: 'add', success: success, fail: fail});
    },
    forget: function (success, fail) {
      perform_action({method: 'post', action: 'forget', success: success, fail: fail});
    },
    revert: function (success, fail) {
      perform_action({method: 'post', action: 'revert', success: success, fail: fail});
    },
    // fs functions
    create: function (success, fail) {
      var action = 'create_' + (is_directory ? 'directoy' : 'file');
      perform_action({method: 'post', action: action, success: success, fail: fail});
    },
    mv: function (dest_path, success, fail) {
      perform_action({method: 'post', action: 'mv', dest_path: dest_path, success: success, fail: fail});
    },
    cat: function (success, fail) {
      perform_action({method: 'get', action: 'cat', success: success, fail: fail});
    },
    rm: function (success, fail) {
      perform_action({method: 'post', action: 'rm', success: success, fail: fail});
    }
  };
});
