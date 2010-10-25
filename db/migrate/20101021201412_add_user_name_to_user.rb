class AddUserNameToUser < ActiveRecord::Migration
  def self.up
    add_column :users, :user_name, :string, :null => false, :unique => true, :default => ''

    add_index :users, :user_name
  end

  def self.down
    remove_index :users, :user_name

    remove_column :users, :user_name
  end
end
