(function ($) {
  $.widget("ui.combobox", {
    _create: function () {
      var self = this,
        select = this.element.hide(),
        value = "",
        selected;

      var input = this.input = $("<input>")
        .insertAfter(select)
        .val(value)
        .attr('name', select.attr('name'))
        .autocomplete({
          delay: 0,
          minLength: 0,
          source: function (request, response) {
            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
            response(select.children("option").map(function () {
              var text = $(this).text();
              if (this.value && (!request.term || matcher.test(text))) {
                return {
                  label: text.replace(
                    new RegExp(
                      "(?![^&;]+;)(?!<[^<>]*)(" +
                      $.ui.autocomplete.escapeRegex(request.term) +
                      ")(?![^<>]*>)(?![^&;]+;)", "gi"
                  ), "<strong>$1</strong>"),
                  value: text,
                  option: this
                };
              }
            }));
          },
          select: function (event, ui) {
            ui.item.option.selected = true;
            self._trigger("selected", event, {
              item: ui.item.option
            });
          }
        })
        .addClass("ui-widget ui-widget-content ui-corner-left");

      input.data("autocomplete")._renderItem = function (ul, item) {
        return $("<li></li>")
          .data("item.autocomplete", item)
          .append("<a>" + item.label + "</a>")
          .appendTo(ul);
      };

      this.button = $("<button type='button'>&nbsp;</button>")
        .attr("tabIndex", -1)
        .attr("title", "Show All Items")
        .insertAfter(input)
        .button({
          icons: {
            primary: "ui-icon-triangle-1-s"
          },
          text: false
        })
        .removeClass("ui-corner-all")
        .addClass("ui-corner-right ui-button-icon")
        .click(function () {
          // close if already visible
          if (input.autocomplete("widget").is(":visible")) {
            input.autocomplete("close");
            return;
          }

          // pass empty string as value to search for, displaying all results
          input.autocomplete("search", "");
          input.focus();
        });
    },

    destroy: function () {
      this.input.remove();
      this.button.remove();
      this.element.show();
      $.Widget.prototype.destroy.call(this);
    }
  });
})(jQuery);
