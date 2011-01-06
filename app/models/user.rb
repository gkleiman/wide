class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable, :lockable and :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Ugly hack to make user registrations work with devise
  before_validation(:on => :create) do
    self.active = true
  end
  after_validation(:on => :create) do
    self.active = false
  end

  validates_presence_of :user_name
  validates_format_of :user_name, :with => /\A[A-Za-z0-9_-]+[A-Za-z0-9._-]*\z/, :allow_blank => true, :message => "can only contain letters, numbers and the following characters: '.', '_' and '-'. And it can't start with a dot."
  validates_uniqueness_of :user_name, :allow_blank => true, :case_sensitive => false

  has_many :projects, :dependent => :destroy
  has_many :ssh_keys, :dependent => :destroy

  attr_accessible_on_create :user_name
  attr_accessible :email, :password, :password_confirmation, :remember_me

  def to_label
    "#{user_name} <#{email}>"
  end

  def active?
    super && active
  end

  # Make user name case insensitive for login
  def self.find_for_database_authentication(conditions = {})
    self.where("LOWER(user_name) = LOWER(?)", conditions[:user_name]).first || super
  end
end
