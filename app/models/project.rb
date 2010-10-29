class Project < ActiveRecord::Base
  belongs_to :user

  has_one :repository, :dependent => :destroy

  accepts_nested_attributes_for :repository, :update_only => true

  validates :name, :presence => true, :format => { :with => /\A[\w\-]+\z/ }

  before_validation :set_repository_path

  def to_param
    self.name
  end

  private

  def set_repository_path
    self.repository.path = Wide::PathUtils.secure_path_join(Settings.repositories_base, File.join(self.user.user_name, self.name)) if self.repository && self.repository.path.blank?

    true
  end
end
