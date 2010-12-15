(function ($) {
  $.jstree.plugin("overlays", {
    __init : function () {
      this.get_container()
        .bind("open_node.jstree create_node.jstree clean_node.jstree", $.proxy(function (e, data) {
            this._prepare_overlays(data.rslt.obj);
          }, this))
        .bind("loaded.jstree", $.proxy(function (e) {
            this._prepare_overlays();
          }, this));
    },
    __destroy : function () {
      this.get_container().find(".jstree-overlay").remove();
    },
    _fn : {
      _prepare_overlays : function (obj) {
        obj = !obj || obj === -1 ? this.get_container() : this._get_node(obj);
        var c, _this = this, t;
        obj.each(function () {
          t = $(this);
          t.find("a").not(":has(.jstree-overlay)").find("ins.jstree-icon").prepend("<ins class='jstree-overlay'>&#160;</ins>");
        });
      }
    }
  });
})(jQuery);
//*/
