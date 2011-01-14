class CreateProjectCollaborators < ActiveRecord::Migration
  def self.up
    create_table :project_collaborators do |t|
      t.integer :project_id, :null => false
      t.integer :user_id, :null => false

      t.timestamps
    end

    add_index :project_collaborators, [:project_id, :user_id], :unique => true
  end

  def self.down
    remove_index :project_collaborators, [:project_id, :user_id]

    drop_table :project_collaborators
  end
end
