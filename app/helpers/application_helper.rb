module ApplicationHelper
  def title(page_title, show_title = true)
    content_for :title, page_title.to_s
    @show_title = show_title
  end

  def show_title?
    @show_title
  end

  def link_to_remove_fields(name, f)
    f.hidden_field(:_destroy) + link_to(name, '#', :class => "remove_link")
  end

  def link_to_add_fields(name, f, association)
    new_object = f.object.class.reflect_on_association(association).klass.new
    fields = ''
    f.simple_fields_for(association, new_object, :child_index => "new_#{association}") do |builder|
      fields = render(association.to_s.singularize + "_fields", :f => builder)
    end
    link_to_function(name, "add_fields(this, \"#{association}\", \"#{escape_javascript(fields)}\")", :id => 'add_link')
  end

  def highlight_diff(diff)
    CodeRay.scan(diff, 'diff').html(:css => :class).html_safe
  end
end
