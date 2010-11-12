class AddAsyncOpsStatusToRepository < ActiveRecord::Migration
  def self.up
    add_column :repositories, :async_op_status, :string
  end

  def self.down
    remove_column :repositories, :async_op_status
  end
end
