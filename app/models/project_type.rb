class ProjectType < ActiveRecord::Base
  has_many :projects

  has_attached_file :repository_template

  validates_attachment_content_type :repository_template, :content_type => 'application/x-gzip'

  validates :name, :presence => true
  validates :makefile_template, :presence => true

  attr_accessible :name, :makefile_template, :description, :repository_template, :binary_extension
end
