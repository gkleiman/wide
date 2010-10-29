class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable, :lockable and :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  validates :user_name, :presence => true, :format => { :with => /\A[\w\-]+\z/ }

  has_many :projects, :dependent => :destroy

  attr_accessible_on_create :user_name
  attr_accessible :email, :password, :password_confirmation, :remember_me
end
