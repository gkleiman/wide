class ProjectType < ActiveRecord::Base
  has_many :projects

  validates :name, :presence => true
  validates :makefile_template, :presence => true
end
