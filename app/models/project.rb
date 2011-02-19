class Project < ActiveRecord::Base
  belongs_to :user
  belongs_to :project_type

  has_many :constants, :dependent => :destroy, :as => :container
  has_one :repository, :dependent => :destroy
  has_many :project_collaborators, :dependent => :destroy
  has_many :collaborators, :through => :project_collaborators, :source => :user

  accepts_nested_attributes_for :repository, :update_only => true
  accepts_nested_attributes_for :constants, :allow_destroy => true

  validates :name, :presence => true, :format => { :with => /\A[\w\- ]+\z/ }, :uniqueness => { :scope => :user_id, :case_sensitive => false }

  attr_accessible_on_create :name, :repository_attributes
  attr_accessible :project_type_id, :constants_attributes, :public, :collaborator_ids

  serialize :compilation_status

  # Callbacks
  before_validation :strip_project_name
  before_validation :set_repository_path
  before_save :add_constants_from_project_type

  def to_param
    name
  end

  def compile
    # Make sure that the project is not being compiled
    if(!compilation_status.blank? && compilation_status[:status] == 'running')
      return Wide::Scm::AsyncOpStatus.new(:operation => 'compile', :status => 'error')
    end

    self.compilation_status = Wide::Scm::AsyncOpStatus.new(:operation => 'compile', :status => 'running')
    self.save!

    Delayed::Job.enqueue(Wide::Jobs::CompileJob.new(id))

    compilation_status
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
    @bin_path ||= Wide::PathUtils.secure_path_join(Settings.compilation_base, user.user_name, name)
  end

  def status
    async_op_status = repository.async_op_status

    return 'success' unless async_op_status && async_op_status[:operation] == :init_or_clone && async_op_status[:status] != 'success'
    return 'initializing' if async_op_status[:operation] == :init_or_clone && async_op_status[:status] == 'running'
    return 'error'
  end

  # Process the project type's Makefile template and write it to the makefile path
  def makefile
    my_binding = MakefileBinding.new(self).get_binding
    ERB.new(project_type.makefile_template).result(my_binding)
  end

  private
  def strip_project_name
    self.name.try(:strip!)
  end

  def set_repository_path
    if repository && repository.path.blank?
      # Check for path traversals
      Wide::PathUtils.secure_path_join(Settings.repositories_base, user.user_name, name)
      repository.path = File.join(user.user_name, name)
    end

    true
  end

  def add_constants_from_project_type
    if project_type_id_changed? && project_type.present?
      project_type.constants.each do |constant|
        project_constant = constants.find_by_name(constant.name)

        if project_constant.blank?
          constants.build(:name => constant.name, :value => constant.value)
        end
      end
    end
  end

  # Class used to generate the Makefile from an ERB template.
  class MakefileBinding
    def initialize(project)
      @project = project
      @constants = project.constants.inject({}) do |hash, constant|
        hash[constant.name] = constant.value
        hash
      end
    end

    def get_binding
      binding
    end
  end
end
