class Constant < ActiveRecord::Base
  belongs_to :project

  validates :name, :presence => true, :format => { :with =>  /\A[\w\-_]+\z/ }, :uniqueness => { :scope => :project_id }
  validates :value, :format => { :with => /\A[\w\-_,."\/]*\z/, :allow_blank => true}

  attr_accessible :name, :value
end
