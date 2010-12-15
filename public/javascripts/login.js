"use strict";

$(function () {
    $('input[type=submit]').button({width: '50px'});
    $('input').addClass('ui-state-default');
    $('input').focus(function () {
      $(this).addClass('ui-state-focus');
    });
    $('input').blur(function () {
      $(this).removeClass('ui-state-focus');
    });
    $('#user_email').focus();
});
