class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable, :lockable and :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  before_create :make_inactive

  validates_presence_of :user_name
  validates_format_of :user_name, :with => /\A[A-Za-z0-9._-]+\z/, :allow_blank => true, :message => "can only contain letters, numbers and the following characters: '.' ',' '_' and '-'"
  validates_uniqueness_of :user_name, :allow_blank => true

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

  private
  def make_inactive
    self.active = false
  end
end
