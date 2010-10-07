class Directory
  attr_accessor :path, :entries

  def initialize(path)
    self.path = path
    self.entries = populate_entries
  end

  def as_json(options = {})
    entries.as_json(options)
  end

  private
  def populate_entries
    entries = []

    Dir.foreach(path) do |entry_name|
      next if entry_name =~ /\A.{1,2}\z/

      entry = DirectoryEntry.new(Wide::PathUtils.secure_path_join(path,
                                                                  entry_name))

      next unless %w{file directory}.include?(entry.type)

      entries << entry
    end

    entries.sort do |x, y|
      if x.type == y.type
        x.file_name.to_s <=> y.file_name.to_s
      else
        x.type.to_s <=> y.type.to_s
      end
    end
  end
end
