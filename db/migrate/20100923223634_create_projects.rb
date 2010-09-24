class CreateProjects < ActiveRecord::Migration
  def self.up
    create_table :projects do |t|
      t.integer :user_id
      t.string :name

      t.timestamps
    end

    add_index :projects, :user_id, :unique => false
    add_index :projects, :name, :unique => false
  end

  def self.down
    remove_index :projects, :column => :name
    remove_index :projects, :column => :user_id

    drop_table :projects
  end
end
