module Wide

  class CompilerOutput < Struct.new(:resource, :line, :type, :description)
    def initialize(options = {})
      super()
      options.each do |key, value|
        send("#{key}=".to_sym, value)
      end
    end

    def as_json(options = {})
      {}.tap do |res|
        res[:resource] = resource unless resource.blank?
        res[:line] = line unless line.blank?
        res[:type] = type unless type.blank?
        res[:description] = description unless description.blank?
      end
    end
  end

  class CompilerOutputParser

    def self.parse_file(file_name, source_base = '')
      # Matches: <resource>:<line>: <(warning|error)>: <description>
      error_or_warning_regexp = /\A([^:]+):(\d+): ([^:]+): (.+)\z/
      # Matches: <resource>:<line> <description>
      error_regexp = /\A([^:]+):(\d+):\s*(.+)\z/
      # Matches: <resource>: <description>
      info_regexp = /\A([^:]+):\s*(.+)\z/

      compiler_output = []
      file = File.open(file_name)
      file.each do |line|
        line.strip!

        output = nil
        if(error_or_warning_regexp.match(line))
          output = CompilerOutput.new(:resource => $1, :line => $2.to_i, :type => $3, :description => $4)
        elsif(error_regexp.match(line))
          output = CompilerOutput.new(:resource => $1, :line => $2.to_i, :type => 'error', :description => $3)
        elsif(info_regexp.match(line))
          output = CompilerOutput.new(:type => 'info', :resource => $1, :description => $2)
        else
          output = CompilerOutput.new(:description => line, :type => 'info')
        end

        unless(output == nil)
          compiler_output.push(filter_output(output, source_base))
        end
      end

      compiler_output
    end

    private
    def self.filter_output(compiler_output, source_base)
      unless source_base.blank?
        compiler_output[:resource].sub!(source_base, '') unless compiler_output[:resource].blank?
        compiler_output[:description].sub!(source_base, '') unless compiler_output[:description].blank?
      end

      compiler_output
    end

  end

end
