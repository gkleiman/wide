class AddBinaryExtensionToProjectType < ActiveRecord::Migration
  def self.up
    add_column :project_types, :binary_extension, :string
  end

  def self.down
    remove_column :project_types, :binary_extension
  end
end
