module Wide
  module Scm
    module Adapters

      class CommandFailed < StandardError
      end

      class AbstractAdapter
        attr_accessor :base_path
        cattr_accessor :skip_paths
        self.skip_paths = []

        def init
          true
        end

        def adapter_name
          'Abstract'
        end

        def logger
          ::Rails.logger
        end

        def initialize(base_path)
          self.base_path = base_path
        end

        def shellout(cmd, &block)
          cmd = cmd.to_s

          logger.debug "Shelling out: #{cmd}" if logger && logger.debug?
          if Rails.env == 'development'
            # Capture stderr when running in dev environment
            cmd = "#{cmd} 2>>#{::Rails.root.to_s}/log/scm.stderr.log"
          end

          begin
            IO.popen(cmd, "r+") do |io|
              io.close_write
              block.call(io) if block_given?
            end
          rescue Errno::ENOENT => e
            msg = e.message
            # The command failed, log it and re-raise
            logger.error("SCM command failed, make sure that your SCM binary (eg. svn) is in PATH (#{ENV['PATH']}): #{cmd}\n  with: #{msg}")
            raise CommandFailed.new(msg)
          end
        end

        def status
          {}
        end

        def self.adapter_name
          self.class.adapter_name
        end

        def self.logger
          self.class.logger
        end

        def self.shellout(cmd, &block)
          self.class.shellout(cmd, &block)
        end
      end

      class Revision
        attr_accessor :revision, :scmid, :author, :author_email, :time,
          :message, :paths

        def initialize(attributes={})
          self.revision = attributes[:revision]
          self.scmid = attributes[:scmid]
          self.author = attributes[:author]
          self.author_email = attributes[:author_email]
          self.time = attributes[:time]
          self.message = attributes[:message] || ""
          self.paths = attributes[:paths]
        end

        def save(repo)
          Changeset.transaction do
            changeset = Changeset.create(
              :repository => repo,
              :revision => revision,
              :scmid => scmid,
              :committer => author,
              :committer_email => author_email,
              :committed_on => time,
              :message => message
            )

            if changeset.save
              paths.each do |file|
                Change.create(
                  :changeset => changeset,
                  :action => file[:action],
                  :path => file[:path])
              end
            end
          end
        end
      end

    end
  end
end
