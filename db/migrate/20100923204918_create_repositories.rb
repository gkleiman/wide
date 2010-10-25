class CreateRepositories < ActiveRecord::Migration
  def self.up
    create_table :repositories do |t|
      t.integer :project_id, :null => false, :unique => true
      t.string :path, :null => false
      t.string :url
      t.string :scm, :null => false

      t.timestamps
    end

    add_index :repositories, :project_id, :unique => :true
  end

  def self.down
    remove_index :repositories, :column => :project_id, :unique => :true

    drop_table :repositories
  end
end
