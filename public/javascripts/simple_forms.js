$(function ($) {
  var first_error = $('.simple_form .error input').first();

  $('.simple_form').delegate('.ui-state-default', 'hover', function (){
    $(this).toggleClass('ui-state-hover');
    return true;
  });
  $('.simple_form').delegate('.ui-state-default', 'focus', function (){
    $(this).addClass('ui-state-active');
    return true;
  });
  $('.simple_form').delegate('.ui-state-default', 'blur', function (){
    $(this).removeClass('ui-state-active');
    return true;
  });

  // Highlight errors
  $('.simple_form .error input').addClass('ui-state-error');
  $('.simple_form .error span').addClass('ui-state-error-text');

  $('.simple_form input[type=submit]').button();

  // Focus the first input field
  if(first_error.length !== 0) {
    first_error.focus();
  } else {
    $('.simple_form .input input').first().focus();
  }
});
