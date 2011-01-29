class DirectoryEntry
  attr_accessor :path, :file_name, :css_class

  def self.create(path, type)
    raise StandardError.new("#{path} already exists.") if File.exist?(path)

    if type == :file
      FileUtils.touch path
    elsif type == :directory
      FileUtils.mkdir path
    else
      raise StandardError.new('Unknown file type.')
    end

    return DirectoryEntry.new(path)
  end

  def initialize(path)
    self.path = path
    self.file_name = File.basename(path)
  end

  def directory?
    @is_directory ||= File.directory?(path)
  end

  def type
    @type ||= File.ftype(path)
  end

  def id
    file_name.parameterize + Digest::SHA1.hexdigest(path)
  end

  def as_json(options = {})
      entry = {
        :attr => {
          "data-filename" => file_name,
          :rel => type,
          :id => id,
        },
        :data => file_name,
        :type => type,
        :state => directory? ? 'closed' : ''
      }

      entry[:attr][:class] = css_class unless css_class.blank?
      entry[:class] = css_class unless css_class.blank?

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

  def move!(dest_path)
    FileUtils.move(path, dest_path)
  end

  def remove!
    FileUtils.rm_r path, :secure => true
  end
end
