class Repository < ActiveRecord::Base
  belongs_to :project

  validates :path, :presence => true, :uniqueness => true
  validates :scm, :presence => true

  def directory_entries(rel_path)
    return Directory.new(real_path(rel_path)).entries
  end

  def file_contents(rel_path)
    return DirectoryEntry.new(real_path(rel_path)).get_content
  end

  def save_file(rel_path, content)
    return DirectoryEntry.new(real_path(rel_path)).update_content(content)
  end

  private
  def real_path(rel_path)
    base_path = File.expand_path(self.path)
    joined_path = File.expand_path(File.join([base_path, rel_path]))

    # Raise an exception if the expanded path is not in the repository
    raise ActiveRecord::RecordNotFound unless joined_path.slice(0, base_path.length) == base_path

    return joined_path
  end
end
