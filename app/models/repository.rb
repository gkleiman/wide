class Repository < ActiveRecord::Base
  belongs_to :project

  validates :path, :presence => true, :uniqueness => true
  validates :scm, :presence => true

  def directory_entries(rel_path)
    Directory.new(real_path(rel_path)).entries
  end

  def file_contents(rel_path)
    DirectoryEntry.new(real_path(rel_path)).get_content
  end

  def save_file(rel_path, content)
    DirectoryEntry.new(real_path(rel_path)).update_content(content)
  end

  def move_file(src_path, dest_path)
    src_path = real_path src_path
    dest_path = real_path dest_path

    FileUtils.move(src_path, dest_path)
  end

  def make_dir(rel_path)
    path = real_path rel_path
    raise "#{path} already exists." if File.exist?(path)

    FileUtils.mkdir path
  end

  def create_file(rel_path)
    path = real_path rel_path
    raise "#{path} already exists." if File.exist?(path)

    FileUtils.touch path
  end

  def remove_file(rel_path)
    path = real_path rel_path

    FileUtils.rm_r path, :secure => true
  end

  private
  def real_path(rel_path)
    base_path = File.expand_path(self.path)
    joined_path = File.expand_path(File.join([base_path, rel_path]))

    # Raise an exception if the expanded path is not in the repository
    raise ActiveRecord::RecordNotFound unless joined_path.index(base_path) == 0 || joined_path == base_path

    joined_path
  end
end
