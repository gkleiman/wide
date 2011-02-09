class AddScmCacheToRepository < ActiveRecord::Migration
  def self.up
    add_column :repositories, :cached_status, :text
    add_column :repositories, :cached_summary, :text
    add_column :repositories, :scm_cache_expired_at, :timestamp
  end

  def self.down
    remove_column :repositories, :scm_cache_expired_at
    remove_column :repositories, :cached_summary
    remove_column :repositories, :cached_status
  end
end
