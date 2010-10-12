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
              status_hash[entry_path] ||= []
              case status
              when '?'
                status_hash[entry_path] << :unversioned
              when 'A'
                status_hash[entry_path] << :added
              when 'R'
                status_hash[entry_path] << :removed
              when 'M'
                status_hash[entry_path] << :modified
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

        # dest_path must be a full expanded path
        def move!(entry, dest_path)
          src_path = Wide::PathUtils.relative_to_base(base_path, entry.path)
          dest_path = Wide::PathUtils.relative_to_base(base_path, dest_path)

          cmd = cmd_prefix.push('mv', src_path, dest_path)
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to move file #{src_path} to #{dest_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        # dest_path must be a full expanded path
        def remove!(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('rm', '-f', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to remove file #{src_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def versioned?(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          versioned = false
          cmd = cmd_prefix.push('locate', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd)) do |io|
            io.each_line do |line|
              versioned = true if line.chomp! == rel_path
            end
          end

          return versioned
        end

        private
        def cmd_prefix
          cmd = [HG_BIN, '-R', base_path, '--cwd', base_path ]
        end
      end

    end
  end
end
