module Wide
  module Scm

    class AsyncOpStatus < Hash
      attr_accessor :updated_at, :status, :operation

      def initialize(attributes = {})
        default_attributes = { :updated_at => Time.now.to_i,
          :status => 'running', :operation => '' }

        default_attributes.merge!(attributes)

        default_attributes.each do |k, v|
          self[k] = v
        end
      end
    end

  end
end
