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

  attr_protected :path

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

  private
  def scm_engine
    @scm_engine ||= Wide::Scm::Scm.get_adapter(scm).new(path)
  end

  def method_missing_with_supports_action?(method_called, *args, &block)
    supported_actions = %w(commit history forget)

    match = method_called.to_s.match(/^supports_(\w+)\?$/)
    if match && supported_actions.include?(match[1]) && scm_engine
      if scm_engine.respond_to?(match[1])
        return true
      else
        return false
      end
    else
      return method_missing_without_supports_action?(method_called, *args, &block)
    end
  end
  alias_method_chain :method_missing, :supports_action?

  def update_entries_status
    @entries_status = scm_engine.status
  end

  def full_path(rel_path = '')
    Wide::PathUtils.secure_path_join(path, rel_path)
  end

  def mark_entries(entries)
    entries.each do |entry|
      @entries_status.each_key do |file_type|
        if @entries_status[file_type].include?(entry.path)
          entry.css_class = file_type.to_s.sub('_files', '')
        end
      end
    end
  end
end
