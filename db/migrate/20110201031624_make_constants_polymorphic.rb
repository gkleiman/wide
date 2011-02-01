class MakeConstantsPolymorphic < ActiveRecord::Migration
  def self.up
    change_table :constants do |t|
      t.rename :project_id, :container_id
      t.column :container_type, :string, :default => 'Project', :null => trye
      t.change :container_type, :string, :null => true
    end

    change_column_default :constants, :container_type, nil
  end

  def self.down
  end
end
