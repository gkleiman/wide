class RemoveDeprecatedAndUnusedColumnsFromRepository < ActiveRecord::Migration
  def self.up
    remove_column :repositories, :operation_in_progress
    remove_column :repositories, :status
  end

  def self.down
    add_column :repositories, :status, :integer, :null => false, :default => -1
    add_column :repositories, :operation_in_progress, :boolean, :null => false, :default => false
  end
end
