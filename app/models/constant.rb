class Constant < ActiveRecord::Base
  belongs_to :container, :polymorphic => true

  validates :name, :presence => true, :format => { :with =>  /\A[\w\-_]+\z/ }, :uniqueness => { :scope => [:container_type, :container_id] }
  validates :value, :format => { :with => /\A[\w\-_,."\/]*\z/, :allow_blank => true}

  attr_accessible :name, :value
end
