module Wide
  module Scm
    module Adapters

      class FilesystemAdapter < Wide::Scm::Adapters::AbstractAdapter
        def init
          FileUtils.mkdir_p(base_path)
        end
      end

    end
  end
end
