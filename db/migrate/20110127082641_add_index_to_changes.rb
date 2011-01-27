class AddIndexToChanges < ActiveRecord::Migration
  def self.up
    add_index :changes, :path
  end

  def self.down
    remove_index :changes, :path
  end
end
