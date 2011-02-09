class Repository < ActiveRecord::Base
  include ActiveModel::Validations

  cattr_accessor :supported_actions
  self.supported_actions = %w(add commit history forget mark_resolved mark_unresolved pull merge diff_stat diff revert! update!)

  attr_accessor :url, :parent_repository

  serialize :async_op_status
  serialize :cached_status
  serialize :cached_summary

  belongs_to :project

  has_many :changesets, :include => :changes, :dependent => :destroy, :order => 'revision DESC'
  has_many :pull_urls, :dependent => :destroy, :order => 'created_at DESC'

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

  validates :path,
    :presence => true,
    :uniqueness => true
  validates :scm,
    :presence => true,
    :scm_adapter_installed => true
  validates :url,
    :scm_valid_url => true,
    :unless => Proc.new { self.parent_repository.present? }

  before_validation :copy_attributes_from_parent_repository, :on => :create
  after_create :queue_init_or_clone

  def changesets_for_entry(rel_path)
    changesets.joins(:changes).where('changes.path' => rel_path).order('"changesets"."committed_on" DESC')
  end

  def directory_entry(rel_path)
    DirectoryEntry.new(full_path(rel_path))
  end

  def repository_url
    URI.encode(Settings.repo_server_base + Wide::PathUtils.without_leading_slash(path))
  end

  def add_new_revisions_to_db
    if scm_engine && scm_engine.respond_to?(:log)
      last_changeset = changesets.first

      scm_engine.log(nil, last_changeset.try(:revision)).each do |changeset|
        next if !last_changeset.nil? && changeset.revision.to_i == last_changeset.revision.to_i
        changeset.save(self)
      end
    end
  end
  handle_asynchronously :add_new_revisions_to_db

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

    entries = mark_entries(entries)
  end

  def file_contents(rel_path)
    directory_entry(rel_path).get_content
  end

  def save_file(rel_path, content)
    directory_entry(rel_path).update_content(content)

    expire_scm_cache
  end

  def move_file(src_path, dest_path)
    entry = DirectoryEntry.new(full_path(src_path))
    full_dest_path = full_path(dest_path)

    if scm_engine.respond_to?(:move!) && scm_engine.versioned?(entry)
      scm_engine.move!(entry, full_dest_path)
    else
      entry.move!(full_dest_path)
    end

    expire_scm_cache
  end

  def make_dir(rel_path)
    DirectoryEntry.create(full_path(rel_path), :directory)

    expire_scm_cache
  end

  def create_file(rel_path)
    DirectoryEntry.create(full_path(rel_path), :file)

    expire_scm_cache
  end

  def remove_file(rel_path)
    entry = directory_entry(rel_path)

    if scm_engine.respond_to?(:remove!) && scm_engine.versioned?(entry)
      scm_engine.remove!(entry)
    else
      entry.remove!
    end

    expire_scm_cache
  end

  def add(rel_path = '')
    entry = nil
    entry = directory_entry(rel_path) unless rel_path.blank?
    scm_engine.add(entry)

    expire_scm_cache
  end

  def forget(rel_path)
    entry = directory_entry(rel_path)
    scm_engine.forget(entry)

    expire_scm_cache
  end

  def revert!(files, revision = nil)
    scm_engine.revert!(files, revision)

    expire_scm_cache
  end

  def mark_resolved(rel_path)
    entry = directory_entry(rel_path)
    scm_engine.mark_resolved(entry)

    expire_scm_cache
  end

  def mark_unresolved(rel_path)
    entry = directory_entry(rel_path)
    scm_engine.mark_unresolved(entry)

    expire_scm_cache
  end

  def commit(user, message, files = [])
    scm_engine.commit(user.email, message, files)

    expire_scm_cache
    add_new_revisions_to_db
  end

  def summary
    if scm_engine
      get_from_scm_cache(:summary)
    else
      return {}
    end
  end

  def diff_stat(revision = nil)
    scm_engine ? scm_engine.diff_stat(revision) : {}
  end

  def diff(rel_path, by_revision = nil)
    entry = directory_entry(rel_path)
    scm_engine.diff(entry, by_revision)
  end

  def pull(url)
    queue_async_operation(:perform_pull, url)
  end

  def update!(revision = nil)
    scm_engine.update!(revision)

    expire_scm_cache
  end

  def respond_to?(symbol, include_private = false)
    match = symbol.to_s.match(/^supports_([^?]+)\?$/)
    if match && self.supported_actions.include?(match[1])
      return true
    else
      return super
    end
  end

  def expire_scm_cache
    current_time = current_time_from_proper_timezone

    unless scm_cache_expired_at.present? && scm_cache_expired_at >= current_time
      Repository.transaction do
        lock!

        # Check again to avoid race conditions
        unless scm_cache_expired_at.present? && scm_cache_expired_at >= current_time
          update_attribute(:scm_cache_expired_at, current_time_from_proper_timezone)
        end
      end
    end
  end

  def copy_attributes_from_parent_repository
    if parent_repository.present?
      self.scm = parent_repository.scm
      self.url = "file://#{parent_repository.full_path}"
    end
  end

  def async_operation(operation, url)
    status = 'error'

    begin
      status = 'success' if(self.send(operation, url))
    ensure
      self.async_op_status = Wide::Scm::AsyncOpStatus.new(:operation => operation, :status => status)
      self.save!
    end

    return status == 'success'
  end

  def full_path(rel_path = '')
    Wide::PathUtils.secure_path_join(absolute_repository_base_path, rel_path)
  end

  def status
    get_from_scm_cache(:status)
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

  # Return the scm value, updating it if it was stale.
  def get_from_scm_cache(attribute_name)
    cached_attribute_name = "cached_#{attribute_name.to_s}"
    cached_value = self.send(cached_attribute_name)

    if self.scm_cache_expired_at.nil?
      expire_scm_cache
    end

    unless cached_value.present? && cached_value[:updated_at] > scm_cache_expired_at
      update_scm_cache(attribute_name)
      reload
      self.send(cached_attribute_name)[:content]
    else
      cached_value[:content]
    end
  end

  def update_scm_cache(attribute_name)
    Repository.transaction do
      lock!

      cached_attribute_name = "cached_#{attribute_name.to_s}"
      cached_value = self.send(cached_attribute_name)

      unless cached_value.present? && cached_value[:updated_at] >= scm_cache_expired_at
        cached_value = {}
        cached_value[:updated_at] = current_time_from_proper_timezone
        cached_value[:content] = scm_engine.send(attribute_name)

        self.send("#{cached_attribute_name.to_s}=", cached_value)

        save!
      end
    end
  end

  def mark_entries(entries)
    status = self.status

    entries.each do |entry|
      if status[entry.path]
        entry.css_class = status[entry.path].map(&:to_s).join(' ')
      end
    end
  end

  def queue_init_or_clone
    # Queue initialization/cloning
    queue_async_operation(:init_or_clone, self.url)

    true
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

      if(scm_engine.class.valid_url?(url))
        # Add the url if the clone was successful and it wasn't a fork
        pull_urls.find_or_create_by_url(url)
      end
    end

    expire_scm_cache

    true
  end

  def perform_pull(url)
    if(!scm_engine || url.blank? || !scm_engine.class.valid_url?(url))
      return false
    end

    if scm_engine.pull(url)
      pull_urls.find_or_create_by_url(url)

      expire_scm_cache
      add_new_revisions_to_db

      return true
    end

    return false
  end

  def queue_async_operation(operation, url)
    # Run one async_operation at a time.
    if self.async_op_status && self.async_op_status[:status] == 'running'
      return Wide::Scm::AsyncOpStatus.new(:operation => operation, :status => 'error')
    end

    self.async_op_status = Wide::Scm::AsyncOpStatus.new(:operation => operation)
    self.save!

    self.delay.async_operation(operation, url)

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
