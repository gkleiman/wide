class SshKey < ActiveRecord::Base
  belongs_to :user

  validates :name, :presence => true
  validates :content, :presence => true, :format => /\A[A-Za-z0-9+\/\s=]+\z/
end
