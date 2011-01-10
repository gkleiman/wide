function add_fields(link, association, content) {
  var new_id = new Date().getTime();
  var regexp = new RegExp("new_" + association, "g");
  $(link).parent().before(content.replace(regexp, new_id));
}

(function ($) {
  var show_placeholder_if_blank = function (o, text) {
    if(o.val() === '') {
      o.val(text).css('color', '#b7b7b7').css('font-style', 'italic');
    }
  }

  var clear_placeholder_if_not_blank = function (o, text) {
    if(o.val() === text) {
      o.val('').css('color', '').css('font-style', 'normal');
    }
  }

  $.fn.placeholder = function (text) {
    var t = $(this);
    var id = t.attr('id');

    show_placeholder_if_blank(t, text);
    t.focus(function () {
      clear_placeholder_if_not_blank($(this), text);
    }).blur(function () {
      show_placeholder_if_blank($(this), text);
    });

    return this;
  };
})(jQuery);
