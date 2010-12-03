class AddProjectTypeToProject < ActiveRecord::Migration
  def self.up
    add_column :projects, :project_type_id, :integer
  end

  def self.down
    remove_column :projects, :project_type_id
  end
end
