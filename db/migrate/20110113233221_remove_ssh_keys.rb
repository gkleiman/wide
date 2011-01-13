class RemoveSshKeys < ActiveRecord::Migration
  def self.up
    drop_table :ssh_keys
  end

  def self.down
  end
end
