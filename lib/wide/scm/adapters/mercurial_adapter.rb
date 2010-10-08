module Wide
  module Scm
    module Adapters

      class MercurialAdapter
        extend Wide::Scm::Adapters::AbstractAdapter

        # Name of the mercurial binary
        HG_BIN = 'hg'
        self.skip_paths = %w(.hg)

        def status
          status_hash = super

          cmd = cmd_prefix.push('status')
          shellout(Escape.shell_command(cmd)) do |io|
            io.each_line do |line|
              # HG uses antislashs as separator on Windows
              line = line.gsub(/\\/, "/")
              line.chomp!

              status, entry_path = line.match(/\A(.) (.+)\z/).captures
              entry_path = Wide::PathUtils.secure_path_join(base_path, entry_path)
              case status
              when '?'
                status_hash[:unversioned_files] << entry_path
              when 'A'
                status_hash[:added_files] << entry_path
              when 'R'
                status_hash[:removed_files] << entry_path
              when 'M'
                status_hash[:modified_files] << entry_path
              end
            end
          end
          raise CommandFailed.new("Failed to get status for #{base_path}") if $? && $?.exitstatus != 0

          status_hash
        end

        def init
          cmd = cmd_prefix.push('init')

          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to initialize Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def move(entry, dest_path)
          src_path = Wide::PathUtils.relative_to_base(base_path, entry.path)
          dest_path = Wide::PathUtils.relative_to_base(base_path, dest_path)
        end

        private
        def cmd_prefix
          cmd = [HG_BIN, '-R', base_path, '--cwd', base_path ]
        end
      end

    end
  end
end
