class Directory
  def initialize(path)
    @path = File.expand_path(path)
  end

  def path
    @path
  end

  def entries
    @entries ||= populate_entries
  end

  def as_json(options = {})
    entries.as_json(options)
  end

  private
  def populate_entries
    entries = []

    Dir.foreach(path) do |entry_name|
      next if entry_name =~ /^.{1,2}$/

      entry_path = File.join([path, entry_name])
      entry = DirectoryEntry.new(entry_path)

      entries << entry
    end

    entries.sort_by! do |entry|
      [
        entry.type == 'folder' ? '0' : '1',
        entry.file_name
      ]
    end
  end
end
