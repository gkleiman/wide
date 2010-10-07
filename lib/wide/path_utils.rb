module Wide
  class BaseDirectoryTraversalError < StandardError
  end

  class PathUtils
    class << self
      def with_leading_slash(path)
        path ||= ''
        (path[0,1]!="/") ? "/#{path}" : path
      end

      def with_trailing_slash(path)
        path ||= ''
        (path[-1,1] == "/") ? path : "#{path}/"
      end

      def without_leading_slash(path)
        path ||= ''
        path.gsub(%r{^/+}, '')
      end

      def without_trailing_slash(path)
        path ||= ''
        (path != '/' && path[-1,1] == "/") ? path[0..-2] : path
      end

      def secure_path_join(base, path = '/')
        raise BaseDirectoryTraversalError.new("You need a base path to secure join a path") if base.blank?

        joined_path = File.expand_path(File.join([base.to_s, path.to_s]))
        joined_path = without_trailing_slash(joined_path)

        base = without_trailing_slash(File.expand_path(base.to_s))
        # Raise an exception if the expanded path is not inside the base path
        unless base == '/' || joined_path == base || joined_path.index(base + File::SEPARATOR) == 0
          exception = BaseDirectoryTraversalError.new("Wrong path join: base=#{base} path=#{path} result=#{joined_path}")
          logger.debug exception.to_s if logger && logger.debug?
          raise exception
        end

        joined_path
      end

      private
      def logger
        ::Rails::logger
      end
    end
  end
end