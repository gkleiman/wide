class CreateConstants < ActiveRecord::Migration
  def self.up
    create_table :constants do |t|
      t.integer :project_id
      t.string :name, :null => false
      t.string :value, :null => false

      t.timestamps
    end
  end

  def self.down
    drop_table :constants
  end
end
