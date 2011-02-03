class CreatePullUrls < ActiveRecord::Migration
  def self.up
    create_table :pull_urls do |t|
      t.references :repository, :null => false
      t.string :url, :null => false

      t.timestamps
    end

    add_index :pull_urls, :repository_id
    add_index :pull_urls, [ :repository_id, :url ], :unique => true
  end

  def self.down
    remove_index :pull_urls, :repository_id
    remove_index :pull_urls, [ :repository_id, :url ], :unique => true
    drop_table :pull_urls
  end
end
