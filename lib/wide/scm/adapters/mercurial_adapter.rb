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

        def diff_stat(revision = nil)
          # path | number_of_changes +++---
          # For example: librabbitmq/amqp_connection.c    |  12 +++
          file_stats_regexp = /\A\s*([^|\s]+)\s*\|\s*(\d+)\s*([^-]*)(-*)\z/
          summary_regexp = /\A\s*(\d+) files changed, (\d+) insertions\(\+\), (\d+) deletions\(-\)\z/

          stats = { :files_changed => 0, :insertions => 0, :deletions => 0, :files => [] }

          cmd = cmd_prefix.push('diff', '--stat')
          unless revision.blank?
            cmd << '-r'
            cmd << "#{revision.to_s}"
          end

          old_columns = ENV['COLUMNS']
          ENV['COLUMNS'] = '10'
          shellout(Escape.shell_command(cmd)) do |io|
            io.each_line do |line|
              # HG uses antislashs as separator on Windows
              line = line.gsub(/\\/, "/")
              line.chomp!

              if(file_stats_regexp.match(line))
                stats[:files] << {
                  :path => Wide::PathUtils.secure_path_join(base_path, $1),
                  :number_of_changes => $2.to_i,
                  :insertions => $3.length,
                  :deletions => $4.length
                }
              elsif(summary_regexp.match(line))
                stats.merge!({:files_changed => $1.to_i, :insertions => $2.to_i, :deletions  => $3.to_i})
              end
            end
          end
          ENV['COLUMNS'] = old_columns

          raise CommandFailed.new("Failed to get the diffstat for #{base_path}:#{revision}") if $? && $?.exitstatus != 0

          stats
        end

        # dest_path must be a full expanded path
        def move!(entry, dest_path)
          src_path = Wide::PathUtils.relative_to_base(base_path, entry.path)
          dest_path = Wide::PathUtils.relative_to_base(base_path, dest_path)

          cmd = cmd_prefix.push('mv', src_path, dest_path)
          shellout(Escape.shell_command(cmd))

          begin
            if($? && $?.exitstatus != 0)
              entry.move!(dest_path);
            end
          rescue
            raise CommandFailed.new("Failed to move file #{src_path} to #{dest_path} in the Mercurial repository in #{base_path}")
          end
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

        def commit(user, message, files = [])
          cmd = cmd_prefix.push('commit', '-u', user.to_s, '-m', message.to_s, *files)
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to commit the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def versioned?(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('locate', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          return ($? && $?.exitstatus == 0)
        end

        def mark_resolved(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('resolve', '-m', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to mark as resolved #{rel_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def mark_unresolved(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('resolve', '-u', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to mark as unresolved #{rel_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def summary
          cmd = cmd_prefix.push('summary')
          summary = {
            :clean? => false,
            :unresolved? => false
          }

          shellout(Escape.shell_command(cmd)) do |io|
            io.each_line do |line|
              line.chomp!

              summary[:clean?] = true if line =~ /\Acommit:.*\(clean\)\z/
              summary[:unresolved?] = true if line =~ /\Acommit:.*unresolved.*\(merge\)\z/
            end
          end

          summary[:commitable?] = !summary[:clean?] && !summary[:unresolved?]

          summary
        end

        def clean?
          !!self.summary[:clean?]
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

        def pull(url)
          cmd = cmd_prefix.push('pull', '-u', '--config', 'ui.merge=merge', url)

          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to pull repository #{url} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus > 1

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
