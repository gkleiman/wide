class CreateChangesets < ActiveRecord::Migration
  def self.up
    create_table :changesets do |t|
      t.integer :repository_id, :null => false
      t.integer :revision, :null => false
      t.string :scmid, :null => false
      t.string :committer, :null => false
      t.string :committer_email, :default => '', :null => false
      t.datetime :committed_on, :null => false
      t.text :message
    end

    add_index :changesets, [:repository_id, :revision], :unique => true
    add_index :changesets, :repository_id
    add_index :changesets, :committed_on
  end

  def self.down
    remove_index :changesets, [:repository_id, :revision]
    remove_index :changesets, :repository_id
    remove_index :changesets, :committed_on

    drop_table :changesets
  end
end
