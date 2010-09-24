class Project < ActiveRecord::Base
  belongs_to :user
  has_one :repository

  validates :name, :presence => true, :format => { :with => /[\w\-]+/ }

  def to_param
    self.name
  end
end
