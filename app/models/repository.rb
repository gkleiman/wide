class Repository < ActiveRecord::Base
  include ActiveModel::Validations

  cattr_accessor :supported_actions
  attr_accessor :entries_status

  self.supported_actions = %w(add commit history forget mark_resolved mark_unresolved)

  # Status will be 0 if the repository is being initialized/cloned, -1 if there
  # have been an error during the initialization, and 1 on success.
  attr_protected :status

  belongs_to :project

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

  def add(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.add(entry)
  end

  def forget(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.forget(entry)
  end

  def revert!(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.revert!(entry)
  end

  def mark_resolved(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.mark_resolved(entry)
  end

  def mark_unresolved(rel_path)
    entry = DirectoryEntry.new(full_path(rel_path))
    scm_engine.mark_unresolved(entry)
  end

  def commit(user, message)
    scm_engine.commit(user, message)
  end

  def summary
    scm_engine ? scm_engine.summary : {}
  end

  def clean?
    scm_engine ? scm_engine.clean? : true
  end

  def respond_to?(symbol, include_private = false)
    match = symbol.to_s.match(/^supports_(\w+)\?$/)
    if match && self.supported_actions.include?(match[1])
      return true
    else
      return super
    end
  end

  def update_entries_status
    self.entries_status = scm_engine.status
  end

  def init_or_clone
    begin
      if url.blank?
        scm_engine.init
      else
        scm_engine.clone(url)
      end

      self.status = 1

      self.save!

      true
    rescue
      self.status = -1

      self.save!

      false
    end
  end

  private
  def scm_engine
    @scm_engine ||= Wide::Scm::Scm.get_adapter(scm).new(path)
  end

  def method_missing(method_called, *args, &block)
    match = method_called.to_s.match(/^supports_(\w+)\?$/)
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

  def full_path(rel_path = '')
    Wide::PathUtils.secure_path_join(path, rel_path)
  end

  def mark_entries(entries)
    entries.each do |entry|
      if self.entries_status[entry.path]
        entry.css_class = self.entries_status[entry.path].map(&:to_s).join(' ')
      end
    end
  end

  def prepare_init_or_clone
    # Create the directory tree
    FileUtils.mkdir_p(path)

    # Set status to initializing/cloning
    self.status = 0
    self.save

    # Queue initialization/cloning
    self.delay.init_or_clone

    true
  end
end
