class Repository < ActiveRecord::Base
  include ActiveModel::Validations

  cattr_accessor :supported_actions
  self.supported_actions = %w(add commit history forget mark_resolved mark_unresolved pull merge diff_stat diff revert!)

  attr_accessor :entries_status, :url

  serialize :async_op_status

  belongs_to :project

  has_many :changesets, :include => :changes, :dependent => :destroy, :order => 'revision DESC'

  class ScmAdapterInstalledValidator < ActiveModel::EachValidator
    def validate_each(record, attribute, value)
      unless Wide::Scm::Scm.all_adapters.include?(value)
        record.errors.add(attribute, :inclusion, options.merge(:value => value))
      end
    end
  end

  class ScmValidUrlValidator < ActiveModel::EachValidator
    def validate_each(record, attribute, value)
      scm_engine = Wide::Scm::Scm.get_adapter(record.scm)
      unless scm_engine && (value.blank? || scm_engine.valid_url?(value))
        record.errors.add(attribute, 'Invalid url', options.merge(:value => value))
      end
    end
  end

  validates :path, :presence => true, :uniqueness => true
  validates :scm, :presence => true, :scm_adapter_installed => true
  validates :url, :scm_valid_url => true

  after_create :prepare_init_or_clone

  def add_new_revisions_to_db
    if scm_engine && scm_engine.respond_to?(:log)
      last_changeset = changesets.first

      scm_engine.log(nil, last_changeset.try(:revision)).each do |changeset|
        next if !last_changeset.nil? && changeset.revision.to_i == last_changeset.revision.to_i
        changeset.save(self)
      end
    end
  end

  def log(path = nil, revision_from = nil, revision_until = nil)
    scm_engine.log(path, revision_from, revision_until)
  end

  def directory_entries(rel_path)
    entries = Directory.new(full_path(rel_path)).entries

    if scm_engine.skip_paths
      entries.reject! do |entry|
        scm_engine.skip_paths.include?(entry.file_name)
      end
    end

    update_entries_status
    entries = mark_entries(entries)
  end

  def file_contents(rel_path)
    DirectoryEntry.new(full_path(rel_path)).get_content
  end

  def save_file(rel_path, content)
    DirectoryEntry.new(full_path(rel_path)).update_content(content)
  end

  def move_file(src_path, dest_path)
    entry = DirectoryEntry.new(full_path(src_path))
    full_dest_path = full_path(dest_path)

    if scm_engine.respond_to?(:move!) && scm_engine.versioned?(entry)
      scm_engine.move!(entry, full_dest_path)
    else
      entry.move!(full_dest_path)
    end
  end

  def make_dir(rel_path)
    DirectoryEntry.create(full_path(rel_path), :directory)
  end

  def create_file(rel_path)
    DirectoryEntry.create(full_path(rel_path), :file)
  end

  def remove_file(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))

    if scm_engine.respond_to?(:remove!) && scm_engine.versioned?(entry)
      scm_engine.remove!(entry)
    else
      entry.remove!
    end
  end

  def add(rel_path = '')
    entry = nil
    entry = DirectoryEntry.new(full_path(rel_path)) unless rel_path.blank?
    scm_engine.add(entry)
  end

  def forget(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.forget(entry)
  end

  def revert!(files)
    scm_engine.revert!(files)
  end

  def mark_resolved(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.mark_resolved(entry)
  end

  def mark_unresolved(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.mark_unresolved(entry)
  end

  def commit(user, message, files = [])
    scm_engine.commit(user.email, message, files)
    add_new_revisions_to_db
  end

  def summary
    scm_engine ? scm_engine.summary : {}
  end

  def diff_stat(revision = nil)
    scm_engine ? scm_engine.diff_stat(revision) : {}
  end

  def diff(rel_path, by_revision = nil)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.diff(entry, by_revision)
  end

  def clean?
    scm_engine ? scm_engine.clean? : true
  end

  def pull(url)
    queue_async_operation(:pull, url)
  end

  def respond_to?(symbol, include_private = false)
    match = symbol.to_s.match(/^supports_([^?]+)\?$/)
    if match && self.supported_actions.include?(match[1])
      return true
    else
      return super
    end
  end

  def update_entries_status
    self.entries_status = scm_engine.status
  end

  def init_or_clone(url)
    # Create the directory tree
    FileUtils.rm_rf(full_path)
    FileUtils.mkdir_p(full_path)

    if url.blank?
      scm_engine.init

      project_type = project.project_type

      # Untar the repository layout into the repository.
      if project_type && project_type.repository_template && !project_type.repository_template.path.blank?
        shellout(Escape.shell_command(['tar', '-zxkpf', project_type.repository_template.path, '-C', full_path]))

        self.add
        self.commit(self.project.user, 'Project template')
      end
    else
      scm_engine.clone(url)
      add_new_revisions_to_db
    end

    true
  end

  def async_operation(operation, url, delegate_to_scm_engine = true)
    status = 'error'

    receiver = scm_engine if(delegate_to_scm_engine)
    receiver ||= self

    begin
      status = 'success' if(receiver.send(operation, url))
    ensure
      self.async_op_status = Wide::Scm::AsyncOpStatus.new(:operation => operation, :status => status)
      self.save!
    end

    return status == 'success'
  end

  def full_path(rel_path = '')
    Wide::PathUtils.secure_path_join(absolute_repository_base_path, rel_path)
  end

  private
  def scm_engine
    @scm_engine ||= Wide::Scm::Scm.get_adapter(scm).new(full_path)
  end

  def method_missing(method_called, *args, &block)
    match = method_called.to_s.match(/^supports_([^?]+)\?$/)
    if match && self.supported_actions.include?(match[1]) && scm_engine
      if scm_engine.respond_to?(match[1])
        true
      else
        false
      end
    else
      super
    end
  end

  def mark_entries(entries)
    entries.each do |entry|
      if self.entries_status[entry.path]
        entry.css_class = self.entries_status[entry.path].map(&:to_s).join(' ')
      end
    end
  end

  def prepare_init_or_clone
    # Queue initialization/cloning
    queue_async_operation(:init_or_clone, self.url, false)

    true
  end

  def queue_async_operation(operation, url, delegate_to_scm_engine = true)
    # Run one async_operation at a time.
    if self.async_op_status && self.async_op_status[:status] == 'running'
      return Wide::Scm::AsyncOpStatus.new(:operation => operation, :status => 'error')
    end

    # If the operation is to be delegated to the scm, ensure that the url is
    # valid.
    if(delegate_to_scm_engine && (!scm_engine || url.blank? || !scm_engine.class.valid_url?(url)))
      self.async_op_status = Wide::Scm::AsyncOpStatus.new(:operation => operation,
                                                          :status => 'error')

      self.save!

      return self.async_op_status
    end

    self.async_op_status = Wide::Scm::AsyncOpStatus.new(:operation => operation)
    self.save!

    self.delay.async_operation(operation, url, delegate_to_scm_engine)

    self.async_op_status
  end

  def absolute_repository_base_path
    Wide::PathUtils.secure_path_join(Settings.repositories_base, path)
  end

  def shellout(cmd, &block)
    cmd = cmd.to_s

    logger.debug "Shelling out: #{cmd}" if logger && logger.debug?

    begin
      IO.popen(cmd, "r+") do |io|
        io.close_write
        block.call(io) if block_given?
      end
    rescue Errno::ENOENT => e
      msg = e.message
      # The command failed, log it and re-raise
      logger.error("Compilation command failed with: #{msg}")
      raise CommandFailed.new(msg)
    end
  end
end
