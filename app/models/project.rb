class Project < ActiveRecord::Base
  belongs_to :user

  has_one :repository, :dependent => :destroy

  validates :name, :presence => true, :format => { :with => /\A[\w\-]+\z/ }

  def to_param
    self.name
  end

  def create_repository(params)
    params[:path] = Wide::PathUtils.secure_path_join(Settings.repositories_base, File.join(self.user.user_name, self.name))

    repo = self.build_repository(params)

    repo.delay.save!
  end
end
