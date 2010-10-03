class DirectoryEntry
  def initialize(path)
    @path = File.expand_path(path)
  end

  def path
    @path
  end

  def directory?
    @is_directory ||= File.directory?(path)
  end

  def type
    @type ||= directory? ? 'folder' : 'file'
  end

  def file_name
    @file_name ||= File.basename(path)
  end

  def as_json(options = {})
      entry = {
        :attr => {
          "data-filename" => file_name,
          :rel => type,
          :id => file_name.parameterize + Digest::SHA1.hexdigest(path)
        },
        :data => file_name,
        :type => type,
        :state => directory? ? 'closed' : '',
      }

      entry
  end

  def get_content
    IO.read(path)
  end

  def update_content(content)
    file = File.new(path, 'w')
    file.write(content)
    file.close
  end
end
