module Wide
  module Scm
    module Adapters

      class CommandFailed < StandardError
      end

      module AbstractAdapter
        def self.extended(base)
          base.send(:include, InstanceMethods)
          base.send(:attr_accessor, :base_path)
          base.send(:cattr_accessor, :skip_paths)
          base.skip_paths = []
        end

        def adapter_name
          'Abstract'
        end

        def logger
          ::Rails.logger
        end

        def shellout(cmd, &block)
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

        module InstanceMethods
          def initialize(base_path)
            self.base_path = base_path
          end

          def status
            Status.new()
          end

          def adapter_name
            self.class.adapter_name
          end

          def logger
            self.class.logger
          end

          def shellout(cmd, &block)
            self.class.shellout(cmd, &block)
          end
        end

      end

      class Status < Hash

        def to_s
          returning '' do |message|
            self.each_pair do |path, status|
              message += "#{path} #{status.to_s}\n"
            end
          end
        end

      end

    end
  end
end
