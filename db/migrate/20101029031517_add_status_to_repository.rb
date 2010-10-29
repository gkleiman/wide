class AddStatusToRepository < ActiveRecord::Migration
  def self.up
    add_column :repositories, :status, :integer, :null => false, :default => -1
    add_column :repositories, :operation_in_progress, :boolean, :null => false, :default => false
  end

  def self.down
    remove_column :repositories, :operation_in_progress
    remove_column :repositories, :status
  end
end
