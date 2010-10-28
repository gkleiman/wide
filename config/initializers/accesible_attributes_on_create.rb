class ActiveRecord::Base
  cattr_accessor :accessible_on_create

  def self.attr_accessible_on_create(*attrs)
    self.accessible_on_create ||= []
    self.accessible_on_create = self.accessible_on_create + attrs
    attr_protected :attrs
  end

  private
  def mass_assignment_authorizer
    self.class.accessible_on_create ||= []
    if self.new_record?
      super + self.class.accessible_on_create
    else
      super
    end
  end
end
