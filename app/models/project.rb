class Project < ActiveRecord::Base
  belongs_to :user

  has_one :repository, :dependent => :destroy

  validates :name, :presence => true, :format => { :with => /[\w\-]+/ }

  def to_param
    self.name
  end

  def create_repository(url, scm)
    repo = self.build_repository
    repo.scm = scm
    repo.path = Wide::PathUtils.secure_path_join(Settings.repositories_base, File.join(self.user.user_name, self.name))
    repo.url = url unless url.blank?

    repo.save!
  end
end
