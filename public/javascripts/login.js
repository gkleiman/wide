$(function () {
    $('input[type=submit]').button({width: '50px'})
    $('input').addClass('ui-state-default');
    $('input').focus(function () {
      $(this).toggleClass('ui-state-focus');
    });
    $('input').blur(function () {
      $(this).toggleClass('ui-state-focus');
    });
    $('#user_email').focus();
});
