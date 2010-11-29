class Project < ActiveRecord::Base
  belongs_to :user

  has_one :repository, :dependent => :destroy

  accepts_nested_attributes_for :repository, :update_only => true

  validates :name, :presence => true, :format => { :with => /\A[\w\- ]+\z/ }, :uniqueness => { :scope => :user_id }

  before_validation :set_repository_path

  serialize :compilation_status

  def to_param
    self.name
  end

  def compile
    # Make sure that the project is not being compiled
    if(compilation_status && compilation_status[:status] == 'running')
      return Wide::Scm::AsyncOpStatus.new(:operation => 'compile', :status => 'error')
    end

    self.compilation_status = Wide::Scm::AsyncOpStatus.new(:operation => 'compile', :status => 'running')
    self.save!

    Delayed::Job.enqueue(Wide::Jobs::CompileJob.new(id))

    self.compilation_status
  end

  def compiler_output
    status = compilation_status

    if(compilation_status && %w(error success).include?(compilation_status[:status]))
      status = status.merge('output' => Wide::CompilerOutputParser.parse_file(
        File.join(bin_path, 'messages'),
        Wide::PathUtils.with_trailing_slash(bin_path) + 'tmp/'))
    end

    status
  end

  # Returns the path in which the compiled binaries should be stored
  def bin_path
    @bin_path ||= Wide::PathUtils.secure_path_join(Settings.compilation_base, File.join(self.user.user_name, self.name))
  end

  private

  def set_repository_path
    self.repository.path = Wide::PathUtils.secure_path_join(Settings.repositories_base, File.join(self.user.user_name, self.name)) if self.repository && self.repository.path.blank?

    true
  end
end
