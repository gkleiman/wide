"use strict";
function show_placeholder_if_blank(o, text) {
  if(o.val() === '' ) {
    o.val(text).css('color','#b7b7b7').css('font-style','italic');
  }
}

function clear_placeholder_if_not_blank(o, text) {
  if(o.val() === text) {
    o.val('').css('color','').css('font-style','normal');
  }
}

(function($) {
  $.fn.placeholder = function(text) {
    var t = $(this);
    var id = t.attr('id');

    show_placeholder_if_blank(t, text);
    t.focus(function() {
      clear_placeholder_if_not_blank($(this), text);
    }).blur(function() {
      show_placeholder_if_blank($(this), text);
    });

    return this;
  };
})(jQuery);
