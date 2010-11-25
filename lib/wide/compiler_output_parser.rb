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

    def self.parse_file(file_name)
      # Matches: <resource>:<line>: <(warning|error)>: <description>
      error_or_warning_regexp = /\A([^:]+):(\d+): ([^:]+): (.+)\z/
      # Matches: <resource>: <description>
      info_regexp = /\A([^:]+): ([^:]+)\z/

      compiler_output = []
      file = File.open(file_name)
      file.each do |line|
        line.strip!

        if(error_or_warning_regexp.match(line))
          compiler_output.push(CompilerOutput.new(:resource => $1, :line => $2.to_i, :type => $3, :description => $4))
        elsif(info_regexp.match(line))
          compiler_output.push(CompilerOutput.new(:type => 'info', :resource => $1, :description => $2))
        else
          compiler_output.push(CompilerOutput.new(:description => line))
        end
      end

      compiler_output
    end

  end

end
