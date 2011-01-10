class RemoveUrlFromRepositories < ActiveRecord::Migration
  def self.up
    remove_column :repositories, :url
  end

  def self.down
    add_column :repositories, :url, :string
  end
end
