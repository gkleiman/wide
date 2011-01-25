$(function ($) {
  var first_error = $('.simple_form .error input').first();

  $('.simple_form').delegate('.ui-state-default:not(.button)', 'hover', function () {
    $(this).toggleClass('ui-state-hover');
    return true;
  });

  $('.simple_form').delegate('.ui-state-default', 'focus', function () {
    $(this).addClass('ui-state-focus');
    return true;
  }).delegate('.ui-state-default', 'blur', function () {
    $(this).removeClass('ui-state-focus');
    return true;
  });

  // Add ui-state-default to all the text input boxes
  $('.simple_form .string input:disabled').addClass('ui-state-disabled');
  $('.simple_form .string input:not(:disabled)').addClass('ui-state-default');
  $('.simple_form .password input').addClass('ui-state-default');
  $('.simple_form .select select').addClass('ui-state-default');

  // Highlight errors
  $('.simple_form .error input').addClass('ui-state-error');
  $('.simple_form .error span').addClass('ui-state-error-text');

  $('.simple_form input[type=submit]').button();

  // Focus the first input field
  if(first_error.length !== 0) {
    first_error.focus();
  } else {
    $('.simple_form .input input:not(:disabled)').first().focus();
  }
});
