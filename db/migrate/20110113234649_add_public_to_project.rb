class AddPublicToProject < ActiveRecord::Migration
  def self.up
    add_column :projects, :public, :boolean, :null => false, :default => false
  end

  def self.down
    remove_column :projects, :public
  end
end
