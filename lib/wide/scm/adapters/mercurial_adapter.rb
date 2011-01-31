require 'rexml/document'

module Wide
  module Scm
    module Adapters

      class MercurialAdapter < Wide::Scm::Adapters::AbstractAdapter

        # Name of the mercurial binary
        HG_BIN = 'hg'

        # List of paths to skip when browsing the repository
        self.skip_paths = %w(.hg .hgrc)

        def status
          status_hash = {}

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


        def diff(entry, by_revision = nil)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('diff', '--git', "path:#{rel_path}")

          cmd.push('-c', "#{by_revision.to_i}") unless by_revision.nil?

          lines = ''
          shellout(Escape.shell_command(cmd)) do |io|
            lines = io.read
          end

          raise CommandFailed.new("Failed to diff file #{rel_path}:#{by_revision} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0

          lines
        end

        def diff_stat(by_revision = nil)
          # path | number_of_changes +++---
          # For example: librabbitmq/amqp_connection.c    |  12 +++---
          bin_file_stats_regexp = /\A\s*([^|\s]+)\s*\|\s*Bin\s*\z/
          file_stats_regexp = /\A\s*([^|\s]+)\s*\|\s*(\d+)\s*([^-]*)(-*)\z/
          summary_regexp = /\A\s*(\d+) files changed, (\d+) insertions\(\+\), (\d+) deletions\(-\)\z/

          stats = { :files_changed => 0, :insertions => 0, :deletions => 0, :files => [] }

          cmd = cmd_prefix.push('diff', '--git', '--stat')
          unless by_revision.blank?
            cmd << '-c'
            cmd << "#{by_revision.to_s}"
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
                  :deletions => $4.length,
                  :binary => false
                }
              elsif(summary_regexp.match(line))
                stats.merge!({:files_changed => $1.to_i, :insertions => $2.to_i, :deletions  => $3.to_i})
              elsif(bin_file_stats_regexp.match(line))
                stats[:files] << {
                  :path => Wide::PathUtils.secure_path_join(base_path, $1),
                  :number_of_changes => 0,
                  :insertions => 0,
                  :deletions => 0,
                  :binary => true
                }
              end
            end
          end
          ENV['COLUMNS'] = old_columns

          raise CommandFailed.new("Failed to get the diffstat for #{base_path}:#{by_revision}") if $? && $?.exitstatus != 0

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

        def add(entry = nil)
          cmd = cmd_prefix.push('add')

          unless entry.nil?
            rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)
            cmd << "path:#{rel_path}"
          end

          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to add file #{src_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def forget(entry)
          rel_path = Wide::PathUtils.relative_to_base(base_path, entry.path)

          cmd = cmd_prefix.push('forget', "path:#{rel_path}")
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to forget file #{src_path} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def revert!(files)
          files = files.map { |path| "path:#{path}" }

          cmd = cmd_prefix.push('revert', '--no-backup', *files)
          shellout(Escape.shell_command(cmd))

          raise CommandFailed.new("Failed to revert #{files.join(', ')} in the Mercurial repository in #{base_path}") if $? && $?.exitstatus != 0
        end

        def commit(user, message, files = [])
          cmd = cmd_prefix.push('commit', '-u', user.to_s, '-m', message.to_s)
          cmd.push(*files) unless files.empty?
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

        def log(path=nil, revision_from=nil, revision_to=nil)
          cmd = cmd_prefix.push('log', '--encoding', 'utf8', '-v', '--style', Rails.root.join('extra', 'hg_template.xml').to_s)

          if revision_from && revision_to
            cmd.push('-r',  "#{revision_from.to_i}:#{revision_to.to_i}")
          elsif revision_from
            cmd.push('-r', "#{revision_from.to_i}:")
          end

          cmd << "path:#{path}" unless path.blank?

          revisions = []
          shellout(Escape.shell_command(cmd)) do |io|
            begin
              # In some systems hg doesn't close the XML Document...
              output = io.read
              output << "</log>" unless output.include?('</log>')

              doc = REXML::Document.new(output)
              doc.elements.each("log/logentry") do |logentry|
                paths = []
                logentry.elements.each("paths/path") do |path|
                  paths << {
                    :action => path.attributes['action'],
                    :path => "#{CGI.unescape(path.text)}",
                  }
                end

                revisions << Revision.new({
                  :revision => logentry.attributes['revision'],
                  :scmid => logentry.attributes['node'],
                  :author => (logentry.elements['author'] ? logentry.elements['author'].text : ""),
                  :author_email => (logentry.elements['author'] ? logentry.elements['author'].attributes['email'] : ""),
                  :time => Time.xmlschema(logentry.elements['date'].text).localtime,
                  :message => logentry.elements['msg'].text,
                  :paths => paths
                })
              end
            rescue
              raise CommandFailed.new("Failed to get revisions for #{base_path}: #{$!}")
            end
          end

          raise CommandFailed.new("Failed to get revisions for #{base_path}") if $? && $?.exitstatus != 0

          revisions
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
