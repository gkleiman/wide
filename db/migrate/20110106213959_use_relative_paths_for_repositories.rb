class UseRelativePathsForRepositories < ActiveRecord::Migration
  def self.up
    base_path = Wide::PathUtils.with_trailing_slash(Settings.repositories_base)

    Repository.all.each do |repo|
      if(repo.path.starts_with?(base_path))
        repo.path = repo.path[base_path.length, repo.path.length]

        repo.save(false)
      end
    end
  end

  def self.down
    base_path = Wide::PathUtils.with_trailing_slash(Settings.repositories_base)

    Repository.all.each do |repo|
      unless(repo.path.starts_with?(base_path))
        repo.path = File.join(base_path, repo.path)

        repo.save(false)
      end
    end
  end
end
