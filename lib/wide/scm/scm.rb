module Wide
  module Scm
    class ScmAdapterNotFound < StandardError
    end

    class Scm
      def self.all_adapters
        scm_adapters
      end

      def self.add_adapter(scm_name)
        scm_adapters << scm_name
      end

      def self.get_adapter(scm_name)
        raise ScmAdapterNotFound.new(scm_name) unless scm_adapters.include? scm_name

        "Wide::Scm::Adapters::#{scm_name}_adapter".classify.constantize
      end

      private
      def self.scm_adapters
        @@scm_adapters ||= []
      end
    end

    Scm.add_adapter('Mercurial')
    Scm.add_adapter('Filesystem')
  end
end
