require 'erb'

module Wide
  module Jobs

    class CommandFailed < StandardError
    end

    class CompileJobBinding
      def initialize(project)
        @project = project
      end

      def get_binding
        binding
      end
    end

    class CompileJob < Struct.new(:project_id)
      def project
        @project ||= Project.find(project_id)
      end

      def makefile_path
        @makefile_path ||= Wide::PathUtils.secure_path_join(project.bin_path, File.join('tmp', 'Makefile'))
      end

      def perform
        # Append '/.' to the path, in order to copy all contents of a directory
        # instead of the directory itself
        @src_path = "#{Wide::PathUtils::with_trailing_slash(project.repository.full_path)}."
        @dst_path = Wide::PathUtils.secure_path_join(project.bin_path, 'tmp')

        prepare_compilation_environment
        make_and_move_results

        project.save!
      end

      def error(job, exception)
        project.compilation_status = Wide::Scm::AsyncOpStatus.new(:operation => 'compile', :status => 'error')
        project.save!
      end

      def failure
        project.compilation_status = Wide::Scm::AsyncOpStatus.new(:operation => 'compile', :status => 'error')
        project.save!
      end

      private

      def prepare_compilation_environment
        # Create a temporary directory for compiling and copy the repository there
        FileUtils.rm_rf(project.bin_path)
        FileUtils.mkdir_p(@dst_path)
        FileUtils.cp_r(@src_path, @dst_path)

        write_makefile
      end

      def write_makefile
        my_binding = CompileJobBinding.new(project).get_binding
        makefile = ERB.new(project.project_type.makefile_template).result(my_binding)

        File.open(makefile_path, 'w') { |f| f.write(makefile) }
      end

      def make_and_move_results
        # Go to the directory, run make, and save the output in @project.bin_path/mesages
        FileUtils.chdir(@dst_path)
        cmd = %w(make)
        cmd = cmd.push('-s', '-f', makefile_path)
        cmd = Escape.shell_command(cmd).to_s + " 2>>#{Wide::PathUtils.secure_path_join(project.bin_path, 'messages')}"
        shellout(cmd)

        if $? && $?.exitstatus != 0
          project.compilation_status = Wide::Scm::AsyncOpStatus.new(:operation => 'compile', :status => 'error')
        else
          project.compilation_status = Wide::Scm::AsyncOpStatus.new(:operation => 'compile', :status => 'success')
          FileUtils.mv(File.join(@dst_path, 'binary'), File.join(project.bin_path, 'binary'))
        end

          FileUtils.rm_rf(@dst_path)
      end

      def logger
        ::Rails.logger
      end

      def shellout(cmd, &block)
        cmd = cmd.to_s

        logger.debug "Shelling out: #{cmd}" if logger && logger.debug?

        begin
          IO.popen(cmd, "r+") do |io|
            io.close_write
            block.call(io) if block_given?
          end
        rescue Errno::ENOENT => e
          msg = e.message
          # The command failed, log it and re-raise
          logger.error("Compilation command failed with: #{msg}")
          raise CommandFailed.new(msg)
        end
      end
    end

  end
end
