module ProjectsHelper
  def link_to_add_fields(name, f, association)
    new_object = f.object.class.reflect_on_association(association).klass.new
    fields = ''
    f.simple_fields_for(association, new_object,
                        :child_index => "new_#{association}") do |builder|
      fields = render(association.to_s.singularize + "_fields", :f => builder)
    end
    link_to_function(name, "WIDE.add_fields(this, \"#{association}\",
                     \"#{escape_javascript(fields)}\")", :id => 'add_link')
  end
end
