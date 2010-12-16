module DeviseHelper
  def devise_error_messages!
    return "" if resource.errors.empty?

    messages = resource.errors.full_messages.map { |msg| content_tag(:li, msg) }.join

    html = <<-HTML
<div id="error_explanation" class="ui-widget">
  <div class="ui-state-error ui-corner-all">
    <h2>Failed because of the following errors:</h2>
    <ul>#{messages}</ul>
  </div>
</div>
    HTML

    html.html_safe
  end
end
