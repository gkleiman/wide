class CreateChanges < ActiveRecord::Migration
  def self.up
    create_table :changes do |t|
      t.integer :changeset_id, :null => false
      t.string :path, :null => false
      t.string :action, :null => false, :default => ''
    end

    add_index :changes, :changeset_id
    add_index :changes, [:changeset_id, :action]
  end

  def self.down
    remove_index :changes, :changeset_id
    remove_index :changes, [:changeset_id, :action]

    drop_table :changes
  end
end
