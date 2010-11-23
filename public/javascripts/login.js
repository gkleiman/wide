$(function () {
    $('#user_submit').button({label: 'Login', width: '50px'})
    $('input').focus(function () {
      $(this).toggleClass('ui-state-focus');
    });
    $('input').blur(function () {
      $(this).toggleClass('ui-state-focus');
    });
    $('#user_email').focus();
});
