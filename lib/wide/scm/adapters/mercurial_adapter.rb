module Wide
  module Scm
    module Adapters

      class MercurialAdapter
        extend Wide::Scm::Adapters::AbstractAdapter

        # Name of the mercurial binary
        HG_BIN = 'hg'

        # List of paths to skip when browsing the repository
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

          cmd = cmd_prefix.push('resolve', '-l')
          shellout(Escape.shell_command(cmd)) do |io|
            io.each_line do |line|
              # HG uses antislashs as separator on Windows
              line = line.gsub(/\\/, "/")
              line.chomp!

              status, entry_path = line.match(/\A(.) (.+)\z/).captures
              entry_path = Wide::PathUtils.secure_path_join(base_path, entry_path)
              status_hash[entry_path] ||= []
              case status
              when 'R'
                status_hash[entry_path] << :resolved
              when 'U'
                status_hash[entry_path] << :unresolved
              end
            end
          end
          raise CommandFailed.new("Failed to get merge status for #{base_path}") if $? && $?.exitstatus != 0

          status_hash
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

        def add(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('add', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to add file #{src_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def forget(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('forget', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to forget file #{src_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def revert!(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('revert', '--no-backup', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to revert file #{src_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def commit(user, message)
          cmd = cmd_prefix.push('commit', '-u', user.to_s, '-m', message.to_s)
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to commit the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def versioned?(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('locate', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          return ($? && $?.exitstatus == 0)
        end

        def clean?
          cmd = cmd_prefix.push('summary')

          shellout(Escape.shell_command(cmd)) do |io|
            io.each_line do |line|
              return true if line.chomp! =~ /\Acommit:.*\(clean\)\z/
            end
          end

          false
        end

        def init
          cmd = cmd_prefix.push('init')

          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to initialize Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0

          true
        end

        def clone(url)
          cmd = cmd_prefix.push('clone', url, base_path)

          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to clone repository #{url} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0

          true
        end

        def self.valid_url?(url)
          (url =~ %r{\A(http://|https://|ssh://)}) != nil
        end

        private
        def cmd_prefix
          cmd = [HG_BIN, '-R', base_path, '--cwd', base_path ]
        end
      end

    end
  end
end
