class Changeset < ActiveRecord::Base
  belongs_to :repository

  has_many :changes, :dependent => :destroy

  def files_added
    changes.to_a.count { |change| change.action == 'A' }
  end

  def files_modified
    changes.to_a.count { |change| change.action == 'M' }
  end

  def files_removed
    changes.to_a.count { |change| change.action == 'R' }
  end
end
