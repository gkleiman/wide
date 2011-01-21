class AddAceThemeToUsers < ActiveRecord::Migration
  def self.up
    add_column :users, :ace_theme, :string
  end

  def self.down
    remove_column :users, :ace_theme
  end
end
