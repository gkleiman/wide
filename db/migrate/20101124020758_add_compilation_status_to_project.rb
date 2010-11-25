class AddCompilationStatusToProject < ActiveRecord::Migration
  def self.up
    add_column :projects, :compilation_status, :string
  end

  def self.down
    remove_column :projects, :compilation_status
  end
end
