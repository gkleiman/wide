class Repository < ActiveRecord::Base
  include ActiveModel::Validations

  belongs_to :project

  class ScmAdapterInstalledValidator < ActiveModel::EachValidator
    def validate_each(record, attribute, value)
      unless Wide::Scm::Scm.all_adapters.include?(value)
        record.errors.add(attribute, :inclusion, options.merge(:value => value))
      end
    end
  end
  validates :path, :presence => true, :uniqueness => true
  validates :scm, :presence => true, :scm_adapter_installed => true

  attr_accessor :entries_status

  attr_protected :path, :scm

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

  def add(entry)
    scm_engine.add(entry)
  end

  def commit(user, message)
    scm_engine.commit(user, message)
  end

  def clean?
    scm_engine ? scm_engine.clean? : true
  end

  def respond_to?(symbol, include_private = false)
    supported_actions = %w(commit history forget)

    match = symbol.to_s.match(/^supports_(\w+)\?$/)
    if match && supported_actions.include?(match[1])
      return true
    else
      return super
    end
  end

  def update_entries_status
    self.entries_status = scm_engine.status
  end

  private
  def scm_engine
    @scm_engine ||= Wide::Scm::Scm.get_adapter(scm).new(path)
  end

  def method_missing(method_called, *args, &block)
    supported_actions = %w(commit history forget)

    match = method_called.to_s.match(/^supports_(\w+)\?$/)
    if match && supported_actions.include?(match[1]) && scm_engine
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
end
